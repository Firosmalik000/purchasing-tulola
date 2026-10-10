<?php

namespace App\Services;

use App\Enums\PurchaseRequestItemType;
use App\Enums\UserRole;
use App\Mail\GoodsReceiptConfirmedMail;
use App\Mail\PurchaseOrderPlacedMail;
use App\Mail\PurchaseRequestSubmittedMail;
use App\Mail\UserInvitationMail;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\Receipt;
use App\Models\Store;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class PurchasingNotificationService
{
    /**
     * Send user invitation email to set password.
     */
    public function sendUserInvitation(User $user): void
    {
        try {
            $inviteUrl = route('invitation.accept', ['token' => $user->invitation_token]);
            Mail::to($user->email)->send(new UserInvitationMail($user, $inviteUrl));
        } catch (Throwable $e) {
            Log::error('Gagal mengirim email undangan pengguna: '.$e->getMessage(), [
                'user_id' => $user->id,
                'email' => $user->email,
            ]);
        }
    }

    /**
     * Determine if an email address is a dummy/unroutable test email.
     */
    protected function isDummyEmail(string $email): bool
    {
        if (app()->environment('testing')) {
            return false;
        }

        $email = strtolower(trim($email));

        return str_ends_with($email, '.test')
            || str_ends_with($email, '.example')
            || str_ends_with($email, '.invalid')
            || str_ends_with($email, '@localhost');
    }

    /**
     * Get active central purchasing team emails.
     *
     * @return array<int, string>
     */
    public function getCentralEmails(): array
    {
        $emails = User::query()
            ->where('is_active', true)
            ->whereIn('role', [
                UserRole::SUPER_ADMIN,
                UserRole::CENTRAL_ADMIN,
                UserRole::PURCHASING,
                UserRole::MANAGEMENT,
            ])
            ->pluck('email')
            ->filter()
            ->reject(fn (string $email) => $this->isDummyEmail($email))
            ->unique()
            ->values()
            ->all();

        if (empty($emails)) {
            $fallback = config('mail.from.address');
            if ($fallback && ! $this->isDummyEmail($fallback)) {
                $emails[] = $fallback;
            }
        }

        return array_values(array_unique(array_filter($emails)));
    }

    /**
     * Notify central purchasing team and requester when a store PR is submitted.
     */
    public function sendPurchaseRequestSubmitted(PurchaseRequest $request): void
    {
        try {
            $centralEmails = $this->getCentralEmails();

            $request->loadMissing(['store', 'requester', 'items.item', 'items.unit']);
            $viewUrl = route('central.requests.show', $request);

            $recipients = $centralEmails;
            $requesterEmail = $request->requester?->email;
            if ($requesterEmail && filter_var($requesterEmail, FILTER_VALIDATE_EMAIL) && ! $this->isDummyEmail($requesterEmail)) {
                $recipients[] = $requesterEmail;
            }
            $recipients = array_values(array_unique(array_filter($recipients)));

            if (empty($recipients)) {
                if (config('mail.from.address')) {
                    $recipients = [config('mail.from.address')];
                } else {
                    Log::warning('Tidak ada email penerima valid untuk notifikasi pengajuan PR.', [
                        'request_id' => $request->id,
                        'request_number' => $request->number,
                    ]);

                    return;
                }
            }

            Mail::to($recipients)->send(new PurchaseRequestSubmittedMail($request, $viewUrl));
        } catch (Throwable $e) {
            Log::error('Gagal mengirim email pengajuan PR: '.$e->getMessage(), [
                'request_id' => $request->id,
                'request_number' => $request->number,
            ]);
        }
    }

    /**
     * Notify store PICs and requester when a purchase order is placed.
     */
    public function sendPurchaseOrderPlaced(PurchaseOrder $order): void
    {
        try {
            $order->loadMissing([
                'purchaseRequest.store.users',
                'purchaseRequest.requester',
                'items.item',
                'items.unit',
                'items.allocations.purchaseRequestItem.purchaseRequest.store.users',
            ]);

            // Group allocated items by store
            $storesMap = [];
            foreach ($order->items as $orderItem) {
                foreach ($orderItem->allocations as $allocation) {
                    $pr = $allocation->purchaseRequestItem?->purchaseRequest;
                    if (! $pr || ! $pr->store) {
                        continue;
                    }

                    $storeId = $pr->store_id;
                    if (! isset($storesMap[$storeId])) {
                        $storesMap[$storeId] = [
                            'store' => $pr->store,
                            'requester_email' => $pr->requester?->email,
                            'items' => [],
                        ];
                    }

                    $itemName = $orderItem->item_type === PurchaseRequestItemType::STOCK
                        ? ($orderItem->item->name ?? 'Item')
                        : ($orderItem->name ?? 'Item Khusus');

                    $storesMap[$storeId]['items'][] = [
                        'name' => $itemName,
                        'sku' => $orderItem->item?->sku,
                        'quantity' => (string) $allocation->allocated_quantity,
                        'unit' => $orderItem->unit->symbol ?? $orderItem->unit->name ?? '',
                    ];
                }
            }

            // Fallback: If no allocations found but order belongs to a PR with store
            if (empty($storesMap) && $order->purchaseRequest?->store) {
                $store = $order->purchaseRequest->store;
                $items = [];
                foreach ($order->items as $orderItem) {
                    $itemName = $orderItem->item_type === PurchaseRequestItemType::STOCK
                        ? ($orderItem->item->name ?? 'Item')
                        : ($orderItem->name ?? 'Item Khusus');

                    $items[] = [
                        'name' => $itemName,
                        'sku' => $orderItem->item?->sku,
                        'quantity' => (string) $orderItem->quantity,
                        'unit' => $orderItem->unit->symbol ?? $orderItem->unit->name ?? '',
                    ];
                }
                $storesMap[$store->id] = [
                    'store' => $store,
                    'requester_email' => $order->purchaseRequest->requester?->email,
                    'items' => $items,
                ];
            }

            foreach ($storesMap as $storeData) {
                /** @var Store $store */
                $store = $storeData['store'];
                $items = $storeData['items'];

                // Get active store users / PICs
                $recipientEmails = $store->users()
                    ->where('users.is_active', true)
                    ->wherePivot('is_active', true)
                    ->pluck('users.email')
                    ->filter()
                    ->reject(fn (string $email) => $this->isDummyEmail($email))
                    ->all();

                // Also include requester email
                if (! empty($storeData['requester_email']) && filter_var($storeData['requester_email'], FILTER_VALIDATE_EMAIL)) {
                    if (! $this->isDummyEmail($storeData['requester_email'])) {
                        $recipientEmails[] = $storeData['requester_email'];
                    }
                }

                $recipientEmails = array_values(array_unique(array_filter($recipientEmails)));

                if (empty($recipientEmails)) {
                    if (config('mail.from.address')) {
                        $recipientEmails = [config('mail.from.address')];
                    } else {
                        Log::warning('Tidak ada penerima valid untuk email PO ditempatkan ke cabang.', [
                            'store_id' => $store->id,
                            'order_id' => $order->id,
                        ]);

                        continue;
                    }
                }

                $viewUrl = route('store.incoming.show', [
                    'purchase_order' => $order->id,
                    'store_id' => $store->id,
                ]);

                Mail::to($recipientEmails)->send(new PurchaseOrderPlacedMail($order, $store, $items, $viewUrl));
            }
        } catch (Throwable $e) {
            Log::error('Gagal mengirim email PO ditempatkan ke cabang: '.$e->getMessage(), [
                'order_id' => $order->id,
                'order_number' => $order->number,
            ]);
        }
    }

    /**
     * Notify central purchasing team when a store confirms goods receipt.
     */
    public function sendGoodsReceiptConfirmed(Receipt $receipt): void
    {
        try {
            $centralEmails = $this->getCentralEmails();

            if (empty($centralEmails)) {
                return;
            }

            $receipt->loadMissing([
                'store',
                'purchaseOrder',
                'receiver',
                'items.purchaseOrderItem.item',
                'items.purchaseOrderItem.unit',
            ]);

            $viewUrl = route('central.orders.show', $receipt->purchase_order_id);

            Mail::to($centralEmails)->send(new GoodsReceiptConfirmedMail($receipt, $viewUrl));
        } catch (Throwable $e) {
            Log::error('Gagal mengirim email konfirmasi penerimaan barang: '.$e->getMessage(), [
                'receipt_id' => $receipt->id,
                'receipt_number' => $receipt->number,
            ]);
        }
    }
}

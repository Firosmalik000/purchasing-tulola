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
     * Notify central purchasing team when a store PR is submitted.
     */
    public function sendPurchaseRequestSubmitted(PurchaseRequest $request): void
    {
        try {
            $centralEmails = User::query()
                ->where('is_active', true)
                ->whereIn('role', [UserRole::SUPER_ADMIN, UserRole::CENTRAL_ADMIN])
                ->pluck('email')
                ->filter()
                ->all();

            if (empty($centralEmails)) {
                return;
            }

            $request->loadMissing(['store', 'requester', 'items.item', 'items.unit']);
            $viewUrl = route('central.requests.show', $request);

            Mail::to($centralEmails)->send(new PurchaseRequestSubmittedMail($request, $viewUrl));
        } catch (Throwable $e) {
            Log::error('Gagal mengirim email pengajuan PR: '.$e->getMessage(), [
                'request_id' => $request->id,
                'request_number' => $request->number,
            ]);
        }
    }

    /**
     * Notify store PICs when a purchase order is placed with allocations for their store.
     */
    public function sendPurchaseOrderPlaced(PurchaseOrder $order): void
    {
        try {
            $order->loadMissing([
                'purchaseRequest.store',
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
                    ->all();

                if (empty($recipientEmails)) {
                    continue;
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
            $centralEmails = User::query()
                ->where('is_active', true)
                ->whereIn('role', [UserRole::SUPER_ADMIN, UserRole::CENTRAL_ADMIN])
                ->pluck('email')
                ->filter()
                ->all();

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

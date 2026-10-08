<?php

namespace App\Actions\Inventory;

use App\Actions\Requests\TransitionPurchaseRequestStatus;
use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestStatus;
use App\Enums\ReceiptStatus;
use App\Models\PurchaseOrderRequestItem;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\ReceiptItem;
use App\Models\User;
use App\Support\Decimal;

class SynchronizeCompletedPurchaseRequests
{
    public function __construct(private TransitionPurchaseRequestStatus $transition) {}

    /** @param array<int, int> $requestIds */
    public function handle(array $requestIds, User $actor): void
    {
        $requests = PurchaseRequest::query()->whereIn('id', $requestIds)->orderBy('id')->lockForUpdate()->get();
        foreach ($requests as $request) {
            if ($request->status !== PurchaseRequestStatus::ORDERED) {
                continue;
            }

            $lines = PurchaseRequestItem::query()->where('purchase_request_id', $request->id)
                ->where('approved_quantity', '>', 0)->get();
            $fullyHandled = $lines->isNotEmpty() && $lines->every(function (PurchaseRequestItem $line): bool {
                $allocated = PurchaseOrderRequestItem::query()->where('purchase_request_item_id', $line->id)
                    ->whereHas('purchaseOrderItem.purchaseOrder', fn ($query) => $query->where('status', '!=', PurchaseOrderStatus::CANCELLED))
                    ->sum('allocated_quantity');
                $receivedAndApplied = ReceiptItem::query()->where('purchase_request_item_id', $line->id)
                    ->whereHas('receipt', fn ($query) => $query->where('status', ReceiptStatus::CONFIRMED)->whereNotNull('stock_applied_at'))
                    ->whereHas('purchaseOrderItem.purchaseOrder', fn ($query) => $query->where('status', '!=', PurchaseOrderStatus::CANCELLED))
                    ->sum('received_quantity');
                $approved = Decimal::quantityMills((string) $line->approved_quantity);

                return Decimal::quantityMills((string) $allocated) >= $approved
                    && Decimal::quantityMills((string) $receivedAndApplied) >= $approved;
            });

            if ($fullyHandled) {
                $this->transition->handle(
                    $request,
                    PurchaseRequestStatus::COMPLETED,
                    $actor,
                    'Seluruh alokasi telah diterima dan pembaruan stok pusat selesai.',
                    ['completed_at' => now()],
                );
            }
        }
    }
}

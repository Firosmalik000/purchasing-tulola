<?php

namespace App\Actions\Orders;

use App\Actions\Requests\TransitionPurchaseRequestStatus;
use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestStatus;
use App\Models\PurchaseOrderRequestItem;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\User;

class SynchronizeOrderedPurchaseRequests
{
    public function __construct(private TransitionPurchaseRequestStatus $transition) {}

    /** @param array<int, int> $requestIds */
    public function handle(array $requestIds, User $actor): void
    {
        $requests = PurchaseRequest::query()->whereIn('id', $requestIds)->orderBy('id')->lockForUpdate()->get();
        foreach ($requests as $request) {
            if ($request->status !== PurchaseRequestStatus::PROCESSED) {
                continue;
            }

            $lines = PurchaseRequestItem::query()->where('purchase_request_id', $request->id)->where('approved_quantity', '>', 0)->get();
            $fullyOrdered = $lines->isNotEmpty() && $lines->every(function (PurchaseRequestItem $line): bool {
                $ordered = PurchaseOrderRequestItem::query()->where('purchase_request_item_id', $line->id)
                    ->whereHas('purchaseOrderItem.purchaseOrder', fn ($query) => $query->whereIn('status', [
                        PurchaseOrderStatus::ORDERED, PurchaseOrderStatus::WAITING_RECEIPT,
                        PurchaseOrderStatus::PARTIALLY_RECEIVED, PurchaseOrderStatus::RECEIVED, PurchaseOrderStatus::COMPLETED,
                    ]))->sum('allocated_quantity');

                return (float) $ordered >= (float) $line->approved_quantity;
            });

            if ($fullyOrdered) {
                $this->transition->handle($request, PurchaseRequestStatus::ORDERED, $actor, attributes: ['ordered_at' => now()]);
            }
        }
    }
}

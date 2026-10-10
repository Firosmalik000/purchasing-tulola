<?php

namespace App\Actions\Orders;

use App\Enums\PurchaseOrderStatus;
use App\Models\PurchaseOrder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PlacePurchaseOrder
{
    public function __construct(
        private TransitionPurchaseOrderStatus $transition,
    ) {}

    public function handle(PurchaseOrder $purchaseOrder): PurchaseOrder
    {
        return DB::transaction(function () use ($purchaseOrder): PurchaseOrder {
            $purchaseOrder = PurchaseOrder::query()
                ->with(['items.item', 'items.allocations.purchaseRequestItem.purchaseRequest.store', 'purchaseRequest.store'])
                ->lockForUpdate()
                ->findOrFail($purchaseOrder->id);

            if ($purchaseOrder->items->isEmpty()) {
                throw ValidationException::withMessages(['items' => 'Pesanan harus memiliki item.']);
            }

            $this->transition->handle($purchaseOrder, PurchaseOrderStatus::ORDERED);

            return $purchaseOrder->load(['purchaseRequest.store', 'items.item', 'items.unit', 'items.allocations.purchaseRequestItem.purchaseRequest.store']);
        }, 3);
    }
}

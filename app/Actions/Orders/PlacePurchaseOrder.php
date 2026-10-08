<?php

namespace App\Actions\Orders;

use App\Enums\PurchaseOrderStatus;
use App\Models\PurchaseOrder;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PlacePurchaseOrder
{
    public function __construct(private TransitionPurchaseOrderStatus $transition, private SynchronizeOrderedPurchaseRequests $synchronizeRequests) {}

    public function handle(PurchaseOrder $purchaseOrder, User $actor): PurchaseOrder
    {
        return DB::transaction(function () use ($purchaseOrder, $actor): PurchaseOrder {
            $purchaseOrder = PurchaseOrder::query()->with('items.allocations.purchaseRequestItem')->lockForUpdate()->findOrFail($purchaseOrder->id);
            if ($purchaseOrder->items->isEmpty()) {
                throw ValidationException::withMessages(['items' => 'Pesanan harus memiliki item.']);
            }
            if ($purchaseOrder->items->contains(fn ($item) => (float) $item->unit_price <= 0)) {
                throw ValidationException::withMessages(['items' => 'Harga satuan seluruh item wajib lebih dari 0 sebelum pesanan ditandai Dipesan.']);
            }
            $this->transition->handle($purchaseOrder, PurchaseOrderStatus::ORDERED);
            $requestIds = $purchaseOrder->items->flatMap->allocations->map(fn ($allocation) => $allocation->purchaseRequestItem->purchase_request_id)->unique()->sort()->values()->all();
            $this->synchronizeRequests->handle($requestIds, $actor);

            return $purchaseOrder->load(['supplier', 'items.item', 'items.unit', 'items.allocations.purchaseRequestItem.purchaseRequest.store']);
        }, 3);
    }
}

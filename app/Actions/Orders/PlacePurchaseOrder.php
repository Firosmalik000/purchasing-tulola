<?php

namespace App\Actions\Orders;

use App\Actions\Inventory\UpdateStoreStock;
use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemType;
use App\Enums\StockMovementType;
use App\Models\PurchaseOrder;
use App\Models\Store;
use App\Models\StoreStock;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PlacePurchaseOrder
{
    public function __construct(
        private TransitionPurchaseOrderStatus $transition,
        private UpdateStoreStock $stocks,
    ) {}

    public function handle(PurchaseOrder $purchaseOrder, ?User $actor = null): PurchaseOrder
    {
        return DB::transaction(function () use ($purchaseOrder, $actor): PurchaseOrder {
            $purchaseOrder = PurchaseOrder::query()
                ->with(['items.item', 'items.allocations.purchaseRequestItem.purchaseRequest.store', 'purchaseRequest.store'])
                ->lockForUpdate()
                ->findOrFail($purchaseOrder->id);

            if ($purchaseOrder->items->isEmpty()) {
                throw ValidationException::withMessages(['items' => 'Pesanan harus memiliki item.']);
            }

            $destinationStore = $purchaseOrder->purchaseRequest?->store
                ?? $purchaseOrder->items->flatMap->allocations->first()?->purchaseRequestItem?->purchaseRequest?->store;

            $centralStore = Store::centralStore();

            if ($centralStore && (! $destinationStore || $destinationStore->id !== $centralStore->id)) {
                $stockItems = $purchaseOrder->items->filter(fn ($item) => $item->item_type === PurchaseRequestItemType::STOCK);

                $groupedItems = $stockItems->groupBy('item_id');

                foreach ($groupedItems as $itemId => $orderItems) {
                    $firstItem = $orderItems->first();
                    $item = $firstItem->item;
                    if (! $item) {
                        continue;
                    }

                    $totalNeeded = (int) $orderItems->sum('quantity');

                    $currentStock = (int) (StoreStock::query()
                        ->where('store_id', $centralStore->id)
                        ->where('item_id', $item->id)
                        ->lockForUpdate()
                        ->value('quantity') ?? 0);

                    if ($currentStock < $totalNeeded) {
                        throw ValidationException::withMessages([
                            'stock' => "Stok item \"{$item->name}\" di Gudang Pusat tidak mencukupi (Tersedia: {$currentStock}, Dibutuhkan: {$totalNeeded}).",
                        ]);
                    }
                }

                foreach ($groupedItems as $itemId => $orderItems) {
                    $firstItem = $orderItems->first();
                    $item = $firstItem->item;
                    if (! $item) {
                        continue;
                    }

                    $totalNeeded = (int) $orderItems->sum('quantity');

                    $this->stocks->handle(
                        store: $centralStore,
                        item: $item,
                        quantity: (string) $totalNeeded,
                        type: StockMovementType::DISTRIBUTION_OUT,
                        reason: 'Distribusi ke '.($destinationStore?->name ?? 'Cabang')." ({$purchaseOrder->number})",
                        notes: $purchaseOrder->notes,
                        increment: false,
                        reference: $purchaseOrder,
                        actor: $actor,
                        decrement: true,
                    );
                }
            }

            $this->transition->handle($purchaseOrder, PurchaseOrderStatus::ORDERED);

            return $purchaseOrder->load(['purchaseRequest.store', 'items.item', 'items.unit', 'items.allocations.purchaseRequestItem.purchaseRequest.store']);
        }, 3);
    }
}

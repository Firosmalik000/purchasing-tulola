<?php

namespace App\Actions\Inventory;

use App\Enums\StockMovementType;
use App\Models\Item;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\StoreStock;
use App\Models\User;
use App\Support\Decimal;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class UpdateStoreStock
{
    public function handle(
        Store $store,
        Item $item,
        string $quantity,
        StockMovementType $type,
        string $reason,
        ?string $notes = null,
        bool $increment = false,
        ?Model $reference = null,
        ?User $actor = null,
    ): StoreStock {
        return DB::transaction(function () use ($store, $item, $quantity, $type, $reason, $notes, $increment, $reference, $actor): StoreStock {
            StoreStock::query()->createOrFirst(['store_id' => $store->id, 'item_id' => $item->id], ['quantity' => 0]);
            $stock = StoreStock::query()->whereBelongsTo($store)->whereBelongsTo($item)->lockForUpdate()->firstOrFail();
            $previous = (string) $stock->quantity;
            $newQuantity = $increment
                ? Decimal::quantity(Decimal::quantityMills($previous) + Decimal::quantityMills($quantity))
                : Decimal::quantity(Decimal::quantityMills($quantity));
            $stock->update(['quantity' => $newQuantity]);
            StockMovement::create([
                'store_id' => $store->id, 'item_id' => $item->id,
                'previous_quantity' => $previous, 'new_quantity' => $newQuantity,
                'quantity_difference' => Decimal::quantity(Decimal::quantityMills($newQuantity) - Decimal::quantityMills($previous)),
                'movement_type' => $type, 'reason' => $reason, 'notes' => $notes,
                'reference_type' => $reference?->getMorphClass(), 'reference_id' => $reference?->getKey(),
                'created_by' => $actor instanceof User ? $actor->id : auth()->id(),
            ]);

            return $stock;
        }, 3);
    }
}

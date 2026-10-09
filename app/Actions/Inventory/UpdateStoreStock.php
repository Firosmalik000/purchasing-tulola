<?php

namespace App\Actions\Inventory;

use App\Enums\StockMovementType;
use App\Models\Item;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\StoreStock;
use App\Models\User;
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
        ?string $unitCost = null,
        ?int $supplierId = null,
    ): StoreStock {
        return DB::transaction(function () use ($store, $item, $quantity, $type, $reason, $notes, $increment, $reference, $actor, $unitCost, $supplierId): StoreStock {
            StoreStock::query()->createOrFirst(['store_id' => $store->id, 'item_id' => $item->id], [
                'quantity' => 0, 'average_unit_cost' => 0, 'total_value' => 0,
            ]);
            $stock = StoreStock::query()->whereBelongsTo($store)->whereBelongsTo($item)->lockForUpdate()->firstOrFail();
            $previous = (int) $stock->quantity;
            $previousValue = (int) $stock->total_value;
            $previousAverage = (int) $stock->average_unit_cost;
            $newQuantity = $increment ? $previous + (int) $quantity : (int) $quantity;
            $inputCost = $unitCost === null ? null : (int) $unitCost;
            $masterCost = $item->cost_price !== null && (int) $item->cost_price > 0
                ? (int) $item->cost_price
                : 0;
            $effectiveCost = $inputCost ?? ($previousAverage > 0 ? $previousAverage : $masterCost);
            $newValue = $increment
                ? $previousValue + ((int) $quantity * $effectiveCost)
                : $newQuantity * $effectiveCost;
            $newAverage = $newQuantity > 0
                ? (int) round($newValue / $newQuantity)
                : 0;

            $stock->update([
                'quantity' => $newQuantity,
                'average_unit_cost' => $newAverage,
                'total_value' => $newValue,
            ]);

            $recordedCost = $unitCost !== null
                ? (int) $unitCost
                : ($masterCost > 0 ? $masterCost : null);

            StockMovement::create([
                'store_id' => $store->id, 'item_id' => $item->id, 'supplier_id' => $supplierId,
                'previous_quantity' => $previous, 'new_quantity' => $newQuantity,
                'quantity_difference' => $newQuantity - $previous,
                'unit_cost' => $recordedCost,
                'movement_value' => $newValue - $previousValue,
                'previous_value' => $previousValue,
                'new_value' => $newValue,
                'movement_type' => $type, 'reason' => $reason, 'notes' => $notes,
                'reference_type' => $reference?->getMorphClass(), 'reference_id' => $reference?->getKey(),
                'created_by' => $actor instanceof User ? $actor->id : auth()->id(),
            ]);

            return $stock;
        }, 3);
    }
}

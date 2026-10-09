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
        ?string $unitCost = null,
        ?int $supplierId = null,
    ): StoreStock {
        return DB::transaction(function () use ($store, $item, $quantity, $type, $reason, $notes, $increment, $reference, $actor, $unitCost, $supplierId): StoreStock {
            StoreStock::query()->createOrFirst(['store_id' => $store->id, 'item_id' => $item->id], [
                'quantity' => 0, 'average_unit_cost' => 0, 'total_value' => 0,
            ]);
            $stock = StoreStock::query()->whereBelongsTo($store)->whereBelongsTo($item)->lockForUpdate()->firstOrFail();
            $previous = (string) $stock->quantity;
            $previousValueCents = Decimal::moneyCents((string) $stock->total_value);
            $previousAverageCents = Decimal::moneyCents((string) $stock->average_unit_cost);
            $newQuantity = $increment
                ? Decimal::quantity(Decimal::quantityMills($previous) + Decimal::quantityMills($quantity))
                : Decimal::quantity(Decimal::quantityMills($quantity));
            $newQuantityMills = Decimal::quantityMills($newQuantity);
            $inputCostCents = $unitCost === null ? null : Decimal::moneyCents($unitCost);
            $effectiveCostCents = $inputCostCents ?? $previousAverageCents;
            $newValueCents = $increment
                ? $previousValueCents + Decimal::moneyCents(Decimal::moneyTotal($quantity, Decimal::money($effectiveCostCents)))
                : Decimal::moneyCents(Decimal::moneyTotal($newQuantity, Decimal::money($effectiveCostCents)));
            $newAverageCents = $newQuantityMills > 0
                ? (int) round(($newValueCents * 1000) / $newQuantityMills)
                : 0;

            $stock->update([
                'quantity' => $newQuantity,
                'average_unit_cost' => Decimal::money($newAverageCents),
                'total_value' => Decimal::money($newValueCents),
            ]);
            StockMovement::create([
                'store_id' => $store->id, 'item_id' => $item->id, 'supplier_id' => $supplierId,
                'previous_quantity' => $previous, 'new_quantity' => $newQuantity,
                'quantity_difference' => Decimal::quantity(Decimal::quantityMills($newQuantity) - Decimal::quantityMills($previous)),
                'unit_cost' => $unitCost,
                'movement_value' => Decimal::money($newValueCents - $previousValueCents),
                'previous_value' => Decimal::money($previousValueCents),
                'new_value' => Decimal::money($newValueCents),
                'movement_type' => $type, 'reason' => $reason, 'notes' => $notes,
                'reference_type' => $reference?->getMorphClass(), 'reference_id' => $reference?->getKey(),
                'created_by' => $actor instanceof User ? $actor->id : auth()->id(),
            ]);

            return $stock;
        }, 3);
    }
}

<?php

namespace App\Actions\Inventory;

use App\Enums\StockMovementType;
use App\Models\Item;
use App\Models\StockBatch;
use App\Models\Store;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class BulkAddStoreStock
{
    public function __construct(private UpdateStoreStock $updateStoreStock) {}

    /**
     * @param  array{
     *     store_id: int,
     *     movement_type: string,
     *     reason: string,
     *     notes?: string|null,
     *     supplier_id?: int|null,
     *     items: array<int, array{item_id: int, quantity: string|int, unit_cost?: string|int|null}>
     * }  $data
     */
    public function handle(Store $store, array $data, ?User $actor = null): int
    {
        return DB::transaction(function () use ($store, $data, $actor): int {
            $movementType = StockMovementType::from($data['movement_type']);
            $reason = (string) $data['reason'];
            $notes = isset($data['notes']) ? (string) $data['notes'] : null;
            $supplierId = ! empty($data['supplier_id']) ? (int) $data['supplier_id'] : null;

            $dateStr = Carbon::now()->format('Ymd');
            $countToday = StockBatch::query()->whereDate('created_at', Carbon::today())->count();
            $batchNumber = sprintf('STK-%s-%04d', $dateStr, $countToday + 1);

            $batch = StockBatch::create([
                'batch_number' => $batchNumber,
                'store_id' => $store->id,
                'movement_type' => $movementType,
                'reason' => $reason,
                'notes' => $notes,
                'supplier_id' => $supplierId,
                'created_by' => $actor?->id ?? auth()->id(),
                'item_count' => count($data['items']),
                'total_quantity' => 0,
            ]);

            $count = 0;
            $totalQuantity = 0;
            foreach ($data['items'] as $itemRow) {
                $item = Item::findOrFail($itemRow['item_id']);
                $quantity = (string) $itemRow['quantity'];
                $unitCost = isset($itemRow['unit_cost']) && $itemRow['unit_cost'] !== '' && $itemRow['unit_cost'] !== null
                    ? (string) $itemRow['unit_cost']
                    : null;

                $this->updateStoreStock->handle(
                    store: $store,
                    item: $item,
                    quantity: $quantity,
                    type: $movementType,
                    reason: $reason,
                    notes: $notes,
                    increment: true,
                    reference: $batch,
                    actor: $actor,
                    unitCost: $unitCost,
                    supplierId: $supplierId,
                );
                $count++;
                $totalQuantity += (int) $quantity;
            }

            $batch->update([
                'total_quantity' => $totalQuantity,
            ]);

            return $count;
        }, 3);
    }
}


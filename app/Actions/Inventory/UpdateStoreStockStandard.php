<?php

namespace App\Actions\Inventory;

use App\Models\Item;
use App\Models\Store;
use App\Models\StoreStockStandard;
use App\Services\ActivityLogger;
use Illuminate\Support\Facades\DB;

class UpdateStoreStockStandard
{
    public function __construct(private ActivityLogger $logger) {}

    public function handle(Store $store, Item $item, string $quantity, ?string $minQuantity = null): StoreStockStandard
    {
        return DB::transaction(function () use ($store, $item, $quantity, $minQuantity): StoreStockStandard {
            $standard = StoreStockStandard::query()->whereBelongsTo($store)->whereBelongsTo($item)->lockForUpdate()->first();
            $old = $standard?->only(['standard_quantity', 'min_quantity']);
            $standard ??= new StoreStockStandard(['store_id' => $store->id, 'item_id' => $item->id]);
            $payload = ['standard_quantity' => $quantity];
            if ($minQuantity !== null) {
                $payload['min_quantity'] = $minQuantity !== '' ? $minQuantity : null;
            }
            $standard->fill($payload)->save();
            $this->logger->log('stock_standard.updated', $standard, $old, $payload);

            return $standard;
        }, 3);
    }
}

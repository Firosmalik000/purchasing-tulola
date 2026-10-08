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

    public function handle(Store $store, Item $item, string $quantity): StoreStockStandard
    {
        return DB::transaction(function () use ($store, $item, $quantity): StoreStockStandard {
            $standard = StoreStockStandard::query()->whereBelongsTo($store)->whereBelongsTo($item)->lockForUpdate()->first();
            $old = $standard?->only(['standard_quantity']);
            $standard ??= new StoreStockStandard(['store_id' => $store->id, 'item_id' => $item->id]);
            $standard->fill(['standard_quantity' => $quantity])->save();
            $this->logger->log('stock_standard.updated', $standard, $old, ['standard_quantity' => $quantity]);

            return $standard;
        }, 3);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['sku', 'name', 'item_category_id', 'unit_id', 'cost_price', 'min_stock', 'target_stock', 'is_active'])]
class Item extends Model
{
    protected function casts(): array
    {
        return [
            'cost_price' => 'integer',
            'min_stock' => 'integer',
            'target_stock' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<ItemCategory, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ItemCategory::class, 'item_category_id');
    }

    /** @return BelongsTo<Unit, $this> */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /** @return HasMany<StoreStock, $this> */
    public function stocks(): HasMany
    {
        return $this->hasMany(StoreStock::class);
    }

    /** @return HasMany<StoreStockStandard, $this> */
    public function stockStandards(): HasMany
    {
        return $this->hasMany(StoreStockStandard::class);
    }

    /** @return HasMany<PurchaseOrderItem, $this> */
    public function purchaseOrderItems(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }
}

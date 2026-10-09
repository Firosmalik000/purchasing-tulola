<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['store_id', 'item_id', 'quantity', 'average_unit_cost', 'total_value'])]
class StoreStock extends Model
{
    protected function casts(): array
    {
        return ['quantity' => 'decimal:3', 'average_unit_cost' => 'decimal:2', 'total_value' => 'decimal:2'];
    }

    /** @return BelongsTo<Store, $this> */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /** @return BelongsTo<Item, $this> */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}

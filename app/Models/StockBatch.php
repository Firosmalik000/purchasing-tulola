<?php

namespace App\Models;

use App\Enums\StockMovementType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $batch_number
 * @property int $store_id
 * @property StockMovementType $movement_type
 * @property string $reason
 * @property string|null $notes
 * @property int|null $supplier_id
 * @property int|null $created_by
 * @property int $item_count
 * @property int $total_quantity
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Fillable([
    'batch_number',
    'store_id',
    'movement_type',
    'reason',
    'notes',
    'supplier_id',
    'created_by',
    'item_count',
    'total_quantity',
])]
class StockBatch extends Model
{
    protected function casts(): array
    {
        return [
            'movement_type' => StockMovementType::class,
            'item_count' => 'integer',
            'total_quantity' => 'integer',
        ];
    }

    /** @return BelongsTo<Store, $this> */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /** @return BelongsTo<Supplier, $this> */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return MorphMany<StockMovement, $this> */
    public function movements(): MorphMany
    {
        return $this->morphMany(StockMovement::class, 'reference');
    }
}

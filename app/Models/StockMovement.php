<?php

namespace App\Models;

use App\Enums\StockMovementType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $store_id
 * @property int $item_id
 * @property string $previous_quantity
 * @property string $new_quantity
 * @property string $quantity_difference
 * @property StockMovementType $movement_type
 * @property string $reason
 * @property string|null $notes
 * @property int|null $created_by
 * @property Carbon $created_at
 */
#[Fillable(['store_id', 'item_id', 'previous_quantity', 'new_quantity', 'quantity_difference', 'movement_type', 'reason', 'notes', 'reference_type', 'reference_id', 'created_by'])]
class StockMovement extends Model
{
    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['previous_quantity' => 'decimal:3', 'new_quantity' => 'decimal:3', 'quantity_difference' => 'decimal:3', 'movement_type' => StockMovementType::class];
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

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return MorphTo<Model, $this> */
    public function reference(): MorphTo
    {
        return $this->morphTo();
    }
}

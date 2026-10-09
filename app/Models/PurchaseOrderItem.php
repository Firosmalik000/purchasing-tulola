<?php

namespace App\Models;

use App\Enums\PurchaseRequestItemType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $purchase_order_id
 * @property PurchaseRequestItemType $item_type
 * @property int|null $item_id
 * @property string|null $name
 * @property int $unit_id
 * @property string $quantity
 * @property string $total
 */
#[Fillable(['purchase_order_id', 'item_type', 'item_id', 'name', 'unit_id', 'quantity'])]
class PurchaseOrderItem extends Model
{
    protected function casts(): array
    {
        return ['item_type' => PurchaseRequestItemType::class, 'quantity' => 'integer'];
    }

    /** @return BelongsTo<PurchaseOrder, $this> */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /** @return BelongsTo<Item, $this> */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    /** @return BelongsTo<Unit, $this> */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /** @return HasMany<PurchaseOrderRequestItem, $this> */
    public function allocations(): HasMany
    {
        return $this->hasMany(PurchaseOrderRequestItem::class);
    }

    /** @return HasMany<ReceiptItem, $this> */
    public function receiptItems(): HasMany
    {
        return $this->hasMany(ReceiptItem::class);
    }
}

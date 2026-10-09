<?php

namespace App\Models;

use App\Enums\PurchaseRequestItemStatus;
use App\Enums\PurchaseRequestItemType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $purchase_request_id
 * @property PurchaseRequestItemType $type
 * @property int|null $item_id
 * @property string|null $name
 * @property string|null $description
 * @property int $unit_id
 * @property string|null $current_stock_snapshot
 * @property string|null $standard_stock_snapshot
 * @property string|null $suggested_quantity
 * @property string $requested_quantity
 * @property string|null $approved_quantity
 * @property Carbon|null $required_date
 * @property string|null $reason
 * @property PurchaseRequestItemStatus|null $status
 */
#[Fillable(['purchase_request_id', 'type', 'item_id', 'name', 'description', 'unit_id', 'current_stock_snapshot', 'standard_stock_snapshot', 'suggested_quantity', 'requested_quantity', 'approved_quantity', 'required_date', 'reason', 'status'])]
class PurchaseRequestItem extends Model
{
    protected function casts(): array
    {
        return ['type' => PurchaseRequestItemType::class, 'current_stock_snapshot' => 'decimal:3', 'standard_stock_snapshot' => 'decimal:3', 'suggested_quantity' => 'decimal:3', 'requested_quantity' => 'decimal:3', 'approved_quantity' => 'decimal:3', 'required_date' => 'date', 'status' => PurchaseRequestItemStatus::class];
    }

    /** @return BelongsTo<PurchaseRequest, $this> */
    public function purchaseRequest(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class);
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
    public function orderAllocations(): HasMany
    {
        return $this->hasMany(PurchaseOrderRequestItem::class);
    }

    /** @return HasMany<ReceiptItem, $this> */
    public function receiptItems(): HasMany
    {
        return $this->hasMany(ReceiptItem::class);
    }
}

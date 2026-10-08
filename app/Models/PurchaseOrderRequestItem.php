<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $purchase_order_item_id
 * @property int $purchase_request_item_id
 * @property string $allocated_quantity
 */
#[Fillable(['purchase_order_item_id', 'purchase_request_item_id', 'allocated_quantity'])]
class PurchaseOrderRequestItem extends Model
{
    protected function casts(): array
    {
        return ['allocated_quantity' => 'decimal:3'];
    }

    /** @return BelongsTo<PurchaseOrderItem, $this> */
    public function purchaseOrderItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrderItem::class);
    }

    /** @return BelongsTo<PurchaseRequestItem, $this> */
    public function purchaseRequestItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequestItem::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $receipt_id
 * @property int $purchase_order_item_id
 * @property int|null $purchase_request_item_id
 * @property string $ordered_quantity
 * @property string $received_quantity
 */
#[Fillable(['receipt_id', 'purchase_order_item_id', 'purchase_request_item_id', 'ordered_quantity', 'received_quantity'])]
class ReceiptItem extends Model
{
    protected function casts(): array
    {
        return ['ordered_quantity' => 'integer', 'received_quantity' => 'integer'];
    }

    /** @return BelongsTo<Receipt, $this> */
    public function receipt(): BelongsTo
    {
        return $this->belongsTo(Receipt::class);
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

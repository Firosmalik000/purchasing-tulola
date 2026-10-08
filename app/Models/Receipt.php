<?php

namespace App\Models;

use App\Enums\ReceiptStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $number
 * @property int $purchase_order_id
 * @property int $store_id
 * @property int $received_by
 * @property Carbon $received_at
 * @property string|null $notes
 * @property ReceiptStatus $status
 * @property Carbon|null $stock_applied_at
 * @property int|null $stock_applied_by
 */
#[Fillable(['number', 'purchase_order_id', 'store_id', 'received_by', 'received_at', 'notes', 'status', 'stock_applied_at', 'stock_applied_by'])]
class Receipt extends Model
{
    protected function casts(): array
    {
        return ['received_at' => 'datetime', 'status' => ReceiptStatus::class, 'stock_applied_at' => 'datetime'];
    }

    /** @return BelongsTo<PurchaseOrder, $this> */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /** @return BelongsTo<Store, $this> */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /** @return BelongsTo<User, $this> */
    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    /** @return BelongsTo<User, $this> */
    public function stockApplier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'stock_applied_by');
    }

    /** @return HasMany<ReceiptItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(ReceiptItem::class);
    }
}

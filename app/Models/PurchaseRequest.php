<?php

namespace App\Models;

use App\Enums\PurchaseRequestStatus;
use Database\Factories\PurchaseRequestFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $number
 * @property int $store_id
 * @property int $requested_by
 * @property Carbon|null $required_date
 * @property string|null $notes
 * @property PurchaseRequestStatus $status
 * @property Carbon|null $submitted_at
 * @property Carbon|null $processed_at
 */
#[Fillable(['number', 'store_id', 'requested_by', 'required_date', 'notes', 'status', 'submitted_at', 'processed_at'])]
class PurchaseRequest extends Model
{
    /** @use HasFactory<PurchaseRequestFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return ['status' => PurchaseRequestStatus::class, 'required_date' => 'date', 'submitted_at' => 'datetime', 'processed_at' => 'datetime'];
    }

    /** @return BelongsTo<Store, $this> */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /** @return BelongsTo<User, $this> */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /** @return HasMany<PurchaseRequestItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseRequestItem::class);
    }

    /** @return HasMany<PurchaseRequestStatusHistory, $this> */
    public function statusHistories(): HasMany
    {
        return $this->hasMany(PurchaseRequestStatusHistory::class);
    }

    /** @return HasOne<PurchaseOrder, $this> */
    public function purchaseOrder(): HasOne
    {
        return $this->hasOne(PurchaseOrder::class);
    }
}

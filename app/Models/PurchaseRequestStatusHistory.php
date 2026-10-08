<?php

namespace App\Models;

use App\Enums\PurchaseRequestStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['purchase_request_id', 'from_status', 'to_status', 'changed_by', 'notes'])]
class PurchaseRequestStatusHistory extends Model
{
    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['from_status' => PurchaseRequestStatus::class, 'to_status' => PurchaseRequestStatus::class];
    }

    /** @return BelongsTo<PurchaseRequest, $this> */
    public function purchaseRequest(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    /** @return BelongsTo<User, $this> */
    public function changer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}

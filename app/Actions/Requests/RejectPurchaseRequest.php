<?php

namespace App\Actions\Requests;

use App\Enums\PurchaseRequestItemStatus;
use App\Enums\PurchaseRequestStatus;
use App\Models\PurchaseRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class RejectPurchaseRequest
{
    public function __construct(private TransitionPurchaseRequestStatus $transition) {}

    public function handle(PurchaseRequest $purchaseRequest, User $actor, string $reason): PurchaseRequest
    {
        return DB::transaction(function () use ($purchaseRequest, $actor, $reason): PurchaseRequest {
            $purchaseRequest = PurchaseRequest::query()->with('items')->lockForUpdate()->findOrFail($purchaseRequest->id);
            $purchaseRequest->items()->update(['approved_quantity' => 0, 'status' => PurchaseRequestItemStatus::REJECTED->value]);
            $this->transition->handle(
                $purchaseRequest,
                PurchaseRequestStatus::REJECTED,
                $actor,
                $reason,
                auditValues: ['reason' => $reason, 'rejected_item_count' => $purchaseRequest->items->count()],
            );

            return $purchaseRequest->load(['items.item', 'items.unit', 'statusHistories']);
        }, 3);
    }
}

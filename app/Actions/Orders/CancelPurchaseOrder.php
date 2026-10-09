<?php

namespace App\Actions\Orders;

use App\Actions\Requests\TransitionPurchaseRequestStatus;
use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestStatus;
use App\Models\PurchaseOrder;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CancelPurchaseOrder
{
    public function __construct(
        private TransitionPurchaseOrderStatus $orderTransition,
        private TransitionPurchaseRequestStatus $requestTransition,
    ) {}

    public function handle(PurchaseOrder $purchaseOrder, User $actor): PurchaseOrder
    {
        return DB::transaction(function () use ($purchaseOrder, $actor): PurchaseOrder {
            $purchaseOrder = PurchaseOrder::query()
                ->with('purchaseRequest')
                ->lockForUpdate()
                ->findOrFail($purchaseOrder->id);

            $this->orderTransition->handle($purchaseOrder, PurchaseOrderStatus::CANCELLED);

            if ($purchaseOrder->purchaseRequest?->status === PurchaseRequestStatus::PROCESSED) {
                $this->requestTransition->handle(
                    $purchaseOrder->purchaseRequest,
                    PurchaseRequestStatus::CANCELLED,
                    $actor,
                    'Order internal dibatalkan.',
                );
            }

            return $purchaseOrder->refresh();
        }, 3);
    }
}

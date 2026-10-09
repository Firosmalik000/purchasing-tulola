<?php

namespace App\Actions\Orders;

use App\Enums\PurchaseOrderStatus;
use App\Models\PurchaseOrder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CancelPurchaseOrder
{
    public function __construct(private TransitionPurchaseOrderStatus $orderTransition) {}

    public function handle(PurchaseOrder $purchaseOrder): PurchaseOrder
    {
        return DB::transaction(function () use ($purchaseOrder): PurchaseOrder {
            $purchaseOrder = PurchaseOrder::query()
                ->with('purchaseRequest')
                ->lockForUpdate()
                ->findOrFail($purchaseOrder->id);

            if ($purchaseOrder->status !== PurchaseOrderStatus::DRAFT) {
                throw ValidationException::withMessages([
                    'status' => 'Hanya order berstatus Proses yang dapat dibatalkan.',
                ]);
            }

            $this->orderTransition->handle($purchaseOrder, PurchaseOrderStatus::CANCELLED);

            return $purchaseOrder->refresh();
        }, 3);
    }
}

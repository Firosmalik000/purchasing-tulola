<?php

namespace App\Actions\Orders;

use App\Enums\PurchaseOrderStatus;
use App\Models\PurchaseOrder;
use Illuminate\Support\Facades\DB;

class AdvancePurchaseOrder
{
    public function __construct(private TransitionPurchaseOrderStatus $transition) {}

    public function handle(PurchaseOrder $purchaseOrder, PurchaseOrderStatus $next): PurchaseOrder
    {
        return DB::transaction(function () use ($purchaseOrder, $next): PurchaseOrder {
            $purchaseOrder = PurchaseOrder::query()->lockForUpdate()->findOrFail($purchaseOrder->id);
            $this->transition->handle($purchaseOrder, $next);

            return $purchaseOrder->refresh();
        }, 3);
    }
}

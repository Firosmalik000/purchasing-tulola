<?php

namespace App\Actions\Orders;

use App\Enums\PurchaseOrderStatus;
use App\Models\PurchaseOrder;
use App\Services\ActivityLogger;
use Illuminate\Validation\ValidationException;

class TransitionPurchaseOrderStatus
{
    public function __construct(private ActivityLogger $logger) {}

    public function handle(PurchaseOrder $purchaseOrder, PurchaseOrderStatus $next, ?string $notes = null): void
    {
        $previous = $purchaseOrder->status;
        if (! $previous->canTransitionTo($next)) {
            throw ValidationException::withMessages(['status' => "Status {$previous->label()} tidak dapat diubah menjadi {$next->label()}."]);
        }

        $purchaseOrder->update(['status' => $next]);
        $this->logger->log('purchase_order.'.strtolower($next->value), $purchaseOrder, ['status' => $previous->value], [
            'status' => $next->value, 'notes' => $notes,
        ]);
    }
}

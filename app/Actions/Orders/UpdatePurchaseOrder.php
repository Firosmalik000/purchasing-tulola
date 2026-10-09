<?php

namespace App\Actions\Orders;

use App\Enums\PurchaseOrderStatus;
use App\Models\PurchaseOrder;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdatePurchaseOrder
{
    public function __construct(private ActivityLogger $logger) {}

    /** @param array<string, mixed> $data */
    public function handle(PurchaseOrder $purchaseOrder, User $actor, array $data): PurchaseOrder
    {
        return DB::transaction(function () use ($purchaseOrder, $actor, $data): PurchaseOrder {
            $purchaseOrder = PurchaseOrder::query()->with('items')->lockForUpdate()->findOrFail($purchaseOrder->id);
            if ($purchaseOrder->status !== PurchaseOrderStatus::DRAFT) {
                throw ValidationException::withMessages(['status' => 'Hanya order berstatus Proses yang dapat diperbarui.']);
            }

            $purchaseOrder->update([
                'expected_date' => $data['expected_date'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);
            $this->logger->log('purchase_order.updated', $purchaseOrder, newValues: [
                'number' => $purchaseOrder->number,
                'updated_by' => $actor->id,
            ]);

            return $purchaseOrder->load(['purchaseRequest.store', 'items.item', 'items.unit', 'items.allocations']);
        }, 3);
    }
}

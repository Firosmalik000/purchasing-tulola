<?php

namespace App\Actions\Orders;

use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemStatus;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\User;
use App\Services\ActivityLogger;

class CreateDraftOrderForRequest
{
    public function __construct(
        private GeneratePurchaseOrderNumber $numbers,
        private ActivityLogger $logger,
    ) {}

    public function handle(PurchaseRequest $request, User $actor): ?PurchaseOrder
    {
        $existing = PurchaseOrder::query()->where('purchase_request_id', $request->id)->first();
        if ($existing) {
            return $existing;
        }

        $request->unsetRelation('items');
        $request->load(['items.item', 'items.unit']);
        $approved = $request->items->filter(
            fn ($item) => in_array($item->status, [PurchaseRequestItemStatus::APPROVED, PurchaseRequestItemStatus::PARTIALLY_APPROVED], true) && $item->approved_quantity > 0
        );
        if ($approved->isEmpty()) {
            return null;
        }

        $order = PurchaseOrder::create([
            'number' => $this->numbers->handle(),
            'purchase_request_id' => $request->id,
            'order_date' => now()->toDateString(),
            'expected_date' => $request->required_date,
            'notes' => $request->notes,
            'status' => PurchaseOrderStatus::DRAFT,
            'created_by' => $actor->id,
        ]);

        foreach ($approved as $line) {
            $orderItem = $order->items()->create([
                'item_type' => $line->type,
                'item_id' => $line->item_id,
                'name' => $line->name,
                'unit_id' => $line->unit_id,
                'quantity' => $line->approved_quantity,
            ]);
            $orderItem->allocations()->create([
                'purchase_request_item_id' => $line->id,
                'allocated_quantity' => $line->approved_quantity,
            ]);
        }

        $this->logger->log('purchase_order.created', $order, newValues: [
            'number' => $order->number,
            'purchase_request_id' => $request->id,
            'item_count' => $approved->count(),
        ]);

        return $order->load(['items.allocations.purchaseRequestItem']);
    }
}

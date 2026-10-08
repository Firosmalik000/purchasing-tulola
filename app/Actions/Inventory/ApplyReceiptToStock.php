<?php

namespace App\Actions\Inventory;

use App\Actions\Orders\TransitionPurchaseOrderStatus;
use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemType;
use App\Enums\ReceiptStatus;
use App\Enums\StockMovementType;
use App\Models\Item;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequestItem;
use App\Models\Receipt;
use App\Models\ReceiptItem;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Support\Decimal;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ApplyReceiptToStock
{
    public function __construct(
        private UpdateStoreStock $stocks,
        private TransitionPurchaseOrderStatus $orderTransition,
        private SynchronizeCompletedPurchaseRequests $requestCompletion,
        private ActivityLogger $logger,
    ) {}

    public function handle(Receipt $receipt, User $actor, ?string $notes = null): Receipt
    {
        return DB::transaction(function () use ($receipt, $actor, $notes): Receipt {
            $receipt = Receipt::query()->lockForUpdate()->findOrFail($receipt->id);
            if ($receipt->stock_applied_at !== null) {
                throw ValidationException::withMessages(['receipt' => 'Penerimaan ini sudah diterapkan ke stok.']);
            }

            $receipt->load(['store', 'items.purchaseOrderItem.item']);
            $stockLines = $this->stockLines($receipt->items);
            foreach ($stockLines as $line) {
                $this->stocks->handle(
                    $receipt->store,
                    $line['item'],
                    Decimal::quantity($line['quantity']),
                    StockMovementType::ORDER_RECEIVED,
                    "Penerimaan {$receipt->number}",
                    $notes,
                    increment: true,
                    reference: $receipt,
                    actor: $actor,
                );
            }

            $receipt->update(['stock_applied_at' => now(), 'stock_applied_by' => $actor->id]);
            $this->logger->log('receipt.stock_applied', $receipt, newValues: [
                'purchase_order_id' => $receipt->purchase_order_id,
                'store_id' => $receipt->store_id,
                'stock_item_count' => $stockLines->count(),
            ]);
            $this->completeEligibleOrderAndRequests($receipt, $actor);

            return $receipt->refresh();
        }, 3);
    }

    /** @param Collection<int, ReceiptItem> $items
     * @return Collection<int, array{item: Item, quantity: int}>
     */
    private function stockLines(Collection $items): Collection
    {
        return $items->filter(fn (ReceiptItem $item) => $item->purchaseOrderItem->item_type === PurchaseRequestItemType::STOCK)
            ->groupBy(fn (ReceiptItem $item) => (int) $item->purchaseOrderItem->item_id)
            ->map(function (Collection $group): array {
                /** @var ReceiptItem $first */
                $first = $group->first();
                $item = $first->purchaseOrderItem->item;
                if (! $item instanceof Item) {
                    throw ValidationException::withMessages(['receipt' => 'Item stok pada receipt tidak valid.']);
                }

                return [
                    'item' => $item,
                    'quantity' => $group->sum(fn (ReceiptItem $item) => Decimal::quantityMills($item->received_quantity)),
                ];
            })
            ->sortKeys()->values();
    }

    private function completeEligibleOrderAndRequests(Receipt $receipt, User $actor): void
    {
        $order = PurchaseOrder::query()->lockForUpdate()->findOrFail($receipt->purchase_order_id);
        if ($order->status === PurchaseOrderStatus::RECEIVED) {
            $hasPendingReceipts = $order->receipts()->where('status', ReceiptStatus::CONFIRMED)
                ->whereNull('stock_applied_at')->exists();
            if (! $hasPendingReceipts) {
                $this->orderTransition->handle($order, PurchaseOrderStatus::COMPLETED, 'Seluruh receipt telah diterapkan ke stok.');
            }
        }

        $requestItemIds = $order->items()->with('allocations:id,purchase_order_item_id,purchase_request_item_id')
            ->get()->flatMap->allocations->pluck('purchase_request_item_id')->unique();
        $requestIds = PurchaseRequestItem::query()->whereIn('id', $requestItemIds)
            ->pluck('purchase_request_id')->unique()->values()->all();
        $this->requestCompletion->handle($requestIds, $actor);
    }
}

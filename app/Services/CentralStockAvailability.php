<?php

namespace App\Services;

use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemType;
use App\Enums\PurchaseRequestStatus;
use App\Enums\ReceiptStatus;
use App\Models\Store;
use App\Models\StoreStock;
use Illuminate\Support\Facades\DB;

class CentralStockAvailability
{
    /**
     * Submitted requests reserve their requested quantity. Processing transfers
     * that reservation to the outstanding allocations of active orders.
     * Call with locking inside the transaction that submits/processes a request.
     *
     * @param  array<int, int>  $itemIds
     * @return array<int, int>
     */
    public function available(Store $central, array $itemIds, bool $lock = false, ?int $excludeRequestId = null): array
    {
        $stocks = StoreStock::query()->where('store_id', $central->id)->whereIn('item_id', $itemIds)
            ->orderBy('item_id')->when($lock, fn ($query) => $query->lockForUpdate())->get();
        $available = array_fill_keys($itemIds, 0);
        foreach ($stocks as $stock) {
            $available[$stock->item_id] = (int) $stock->quantity;
        }

        // Locking reads also avoid stale snapshots under MySQL REPEATABLE READ.
        $pending = DB::table('purchase_request_items as line')
            ->join('purchase_requests as request', 'request.id', '=', 'line.purchase_request_id')
            ->where('request.status', PurchaseRequestStatus::SUBMITTED->value)
            ->where('line.type', PurchaseRequestItemType::STOCK->value)
            ->whereIn('line.item_id', $itemIds)
            ->when($excludeRequestId !== null, fn ($query) => $query->where('request.id', '!=', $excludeRequestId))
            ->when($lock, fn ($query) => $query->lockForUpdate())
            ->get(['line.item_id', 'line.requested_quantity']);
        foreach ($pending as $line) {
            $available[$line->item_id] -= (int) $line->requested_quantity;
        }

        $allocations = DB::table('purchase_order_request_items as allocation')
            ->join('purchase_order_items as line', 'line.id', '=', 'allocation.purchase_order_item_id')
            ->join('purchase_orders as orders', 'orders.id', '=', 'line.purchase_order_id')
            ->whereIn('orders.status', [PurchaseOrderStatus::DRAFT->value, PurchaseOrderStatus::ORDERED->value, PurchaseOrderStatus::PARTIALLY_RECEIVED->value])
            ->where('line.item_type', PurchaseRequestItemType::STOCK->value)
            ->whereIn('line.item_id', $itemIds)
            ->when($lock, fn ($query) => $query->lockForUpdate())
            ->get(['line.item_id', 'allocation.purchase_order_item_id', 'allocation.purchase_request_item_id', 'allocation.allocated_quantity']);
        $received = DB::table('receipt_items as line')
            ->join('receipts as receipt', 'receipt.id', '=', 'line.receipt_id')
            ->where('receipt.status', ReceiptStatus::CONFIRMED->value)
            ->whereIn('line.purchase_order_item_id', $allocations->pluck('purchase_order_item_id'))
            ->when($lock, fn ($query) => $query->lockForUpdate())
            ->get(['line.purchase_order_item_id', 'line.purchase_request_item_id', 'line.received_quantity'])
            ->groupBy(fn ($line) => $line->purchase_order_item_id.':'.$line->purchase_request_item_id);
        foreach ($allocations as $allocation) {
            $key = $allocation->purchase_order_item_id.':'.$allocation->purchase_request_item_id;
            $quantityReceived = (int) ($received->get($key)?->sum('received_quantity') ?? 0);
            $available[$allocation->item_id] -= max(0, (int) $allocation->allocated_quantity - $quantityReceived);
        }

        return array_map(fn (int $quantity): int => max(0, $quantity), $available);
    }
}

<?php

namespace App\Actions\Inventory;

use App\Enums\PurchaseRequestItemType;
use App\Enums\ReceiptStatus;
use App\Models\Receipt;
use App\Models\ReceiptItem;
use App\Models\Store;
use App\Support\Decimal;
use Illuminate\Support\Collection;

class ListPendingStockReceipts
{
    /** @return Collection<int, array<string, mixed>> */
    public function handle(Store $store): Collection
    {
        return Receipt::query()->whereBelongsTo($store)
            ->where('status', ReceiptStatus::CONFIRMED)->whereNull('stock_applied_at')
            ->with([
                'purchaseOrder:id,number,supplier_id,status',
                'purchaseOrder.supplier:id,code,name',
                'receiver:id,name',
                'items:id,receipt_id,purchase_order_item_id,purchase_request_item_id,received_quantity',
                'items.purchaseOrderItem:id,item_type,item_id,name,unit_id',
                'items.purchaseOrderItem.item:id,sku,name',
                'items.purchaseOrderItem.item.stocks' => fn ($query) => $query->where('store_id', $store->id),
                'items.purchaseOrderItem.unit:id,name,symbol',
            ])->oldest('received_at')->limit(20)->get()
            ->map(fn (Receipt $receipt) => $this->present($receipt));
    }

    /** @return array<string, mixed> */
    private function present(Receipt $receipt): array
    {
        $stockLines = $receipt->items
            ->filter(fn (ReceiptItem $item) => $item->purchaseOrderItem->item_type === PurchaseRequestItemType::STOCK)
            ->groupBy(fn (ReceiptItem $item) => (int) $item->purchaseOrderItem->item_id)
            ->map(function (Collection $items): array {
                /** @var ReceiptItem $first */
                $first = $items->first();
                $item = $first->purchaseOrderItem->item;
                $received = $items->sum(fn (ReceiptItem $line) => Decimal::quantityMills($line->received_quantity));
                $current = Decimal::quantityMills((string) ($item->stocks->pluck('quantity')->first() ?: '0'));

                return [
                    'item_id' => $item->id, 'sku' => $item->sku, 'name' => $item->name,
                    'unit' => $first->purchaseOrderItem->unit->symbol,
                    'current_quantity' => Decimal::quantity($current),
                    'received_quantity' => Decimal::quantity($received),
                    'proposed_quantity' => Decimal::quantity($current + $received),
                ];
            })->values();
        $specialLines = $receipt->items
            ->filter(fn (ReceiptItem $item) => $item->purchaseOrderItem->item_type === PurchaseRequestItemType::SPECIAL)
            ->map(fn (ReceiptItem $item) => [
                'name' => $item->purchaseOrderItem->name,
                'unit' => $item->purchaseOrderItem->unit->symbol,
                'received_quantity' => $item->received_quantity,
            ])->values();

        return [
            'id' => $receipt->id, 'number' => $receipt->number,
            'received_at' => $receipt->received_at, 'notes' => $receipt->notes,
            'purchase_order' => $receipt->purchaseOrder,
            'receiver' => $receipt->receiver,
            'stock_lines' => $stockLines,
            'special_lines' => $specialLines,
        ];
    }
}

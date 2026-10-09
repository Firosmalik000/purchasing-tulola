<?php

namespace App\Actions\Reports;

use App\Enums\ManagementReportType;
use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemType;
use App\Enums\PurchaseRequestStatus;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseOrderRequestItem;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\ReceiptItem;
use App\Models\StockMovement;
use App\Models\StoreStock;
use App\Models\StoreStockStandard;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class BuildManagementReport
{
    /**
     * @param  array{report: string, date_from: string, date_to: string, store_id: int|null, category_id: int|null, order_id: int|null}  $filters
     * @return array<string, mixed>
     */
    public function handle(array $filters): array
    {
        $type = ManagementReportType::from($filters['report']);
        $content = match ($type) {
            ManagementReportType::PURCHASING_REQUEST => $this->purchasingRequest($filters),
            ManagementReportType::REQUEST_BY_STORE => $this->requestByStore($filters),
            ManagementReportType::ORDER => $this->orders($filters),
            ManagementReportType::OUTSTANDING_ORDER => $this->outstandingOrders($filters),
            ManagementReportType::RECEIVED_ORDER => $this->receivedOrders($filters),
            ManagementReportType::STOCK_BY_STORE => $this->stockByStore($filters),
            ManagementReportType::STOCK_VS_STANDARD => $this->stockVsStandard($filters),
            ManagementReportType::STOCK_UPDATE_HISTORY => $this->stockHistory($filters),
            ManagementReportType::SPECIAL_REQUEST => $this->specialRequests($filters),
        };

        return [
            'type' => $type->value,
            'title' => $type->label(),
            'description' => $type->description(),
            'is_snapshot' => $type->isSnapshot(),
            'period' => $type->isSnapshot() ? 'Posisi '.now()->format('d/m/Y H:i') : $this->date($filters['date_from']).' - '.$this->date($filters['date_to']),
            'generated_at' => now()->format('d/m/Y H:i'),
            'filters' => $filters,
            'columns' => $content['columns'],
            'rows' => $content['rows'],
            'summary' => $content['summary'] ?? [],
            'context' => $content['context'] ?? [],
            'signatures' => $content['signatures'] ?? [],
        ];
    }

    /** @return array{key: string, label: string, format: string, align: string} */
    private function column(string $key, string $label, string $format = 'text', string $align = 'left'): array
    {
        return compact('key', 'label', 'format', 'align');
    }

    /**
     * @param Builder<*> $query
     * @param  array<string, mixed>  $filters
     */
    private function dateRange(Builder $query, string $column, array $filters): void
    {
        $query->whereDate($column, '>=', $filters['date_from'])->whereDate($column, '<=', $filters['date_to']);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function purchasingRequest(array $filters): array
    {
        $query = PurchaseOrder::query()
            ->where('status', '!=', PurchaseOrderStatus::CANCELLED)
            ->with([
                'creator:id,name', 'items.item:id,sku,name,item_category_id', 'items.unit:id,symbol',
                'items.allocations.purchaseRequestItem.purchaseRequest.store:id,code,name',
                'items.allocations.purchaseRequestItem.purchaseRequest.requester:id,name',
            ]);
        $this->dateRange($query, 'order_date', $filters);
        $query->when($filters['order_id'], fn ($orders, $id) => $orders->whereKey($id));
        $order = $query->latest('order_date')->latest('id')->first();

        if (! $order) {
            return [
                'columns' => $this->purchasingRequestColumns(), 'rows' => [],
                'context' => [], 'signatures' => ['Requested By' => '—', 'Checked By' => 'Purchasing', 'Approved By' => 'Management'],
            ];
        }

        $rows = $order->items->values()->map(function (PurchaseOrderItem $line, int $index): array {
            $allocations = $line->allocations;
            $stock = $this->allocationSnapshots($allocations, 'current_stock_snapshot', $line->item_type);
            $standard = $this->allocationSnapshots($allocations, 'standard_stock_snapshot', $line->item_type);

            return [
                'no' => $index + 1,
                'item' => data_get($line, 'item.name', $line->name ?? '—'),
                'stock' => $stock,
                'standard_stock' => $standard,
                'quantity' => $line->quantity,
                'remarks' => $allocations->groupBy(fn ($allocation) => $allocation->purchaseRequestItem->purchaseRequest->store->code)
                    ->map(fn (Collection $entries, string $code) => $code.' '.$this->quantity($entries->sum('allocated_quantity')))
                    ->values()->implode(', '),
            ];
        })->all();

        $requests = $order->items->flatMap->allocations->map->purchaseRequestItem->map->purchaseRequest->unique('id');
        $types = $order->items->pluck('item_type')->unique()->map(fn ($type) => $type === PurchaseRequestItemType::STOCK ? 'Stock' : 'Special')->implode(', ');

        return [
            'columns' => $this->purchasingRequestColumns(),
            'rows' => $rows,
            'context' => [
                'Date' => $order->order_date->format('d/m/Y'),
                'PR No / Report No' => $requests->pluck('number')->implode(', ') ?: $order->number,
                'Ship To' => $requests->pluck('store.name')->unique()->implode(', ') ?: '—',
                'Requisitioner' => $requests->pluck('requester.name')->unique()->implode(', ') ?: '—',
                'Material / Type' => $types ?: '—',
                'Order No' => $order->number,
            ],
            'signatures' => [
                'Requested By' => $requests->pluck('requester.name')->unique()->implode(', ') ?: '—',
                'Checked By' => $order->creator->name,
                'Approved By' => 'Management',
            ],
        ];
    }

    /** @return list<array{key: string, label: string, format: string, align: string}> */
    private function purchasingRequestColumns(): array
    {
        return [
            $this->column('no', 'No', 'integer', 'center'), $this->column('item', 'Items'),
            $this->column('stock', 'Stock', 'text', 'right'), $this->column('standard_stock', 'Standard Stock', 'text', 'right'),
            $this->column('quantity', 'Qty', 'quantity', 'right'), $this->column('remarks', 'Remarks'),
        ];
    }

    /** @param Collection<int, PurchaseOrderRequestItem> $allocations */
    private function allocationSnapshots(Collection $allocations, string $field, PurchaseRequestItemType $type): string
    {
        if ($type === PurchaseRequestItemType::SPECIAL) {
            return '-';
        }

        return $allocations->map(function ($allocation) use ($field): string {
            $requestItem = $allocation->purchaseRequestItem;
            $value = $requestItem->{$field};
            $prefix = $requestItem->purchaseRequest->store->code;

            return $prefix.' '.($value === null ? '—' : $this->quantity($value));
        })->unique()->implode(', ');
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function requestByStore(array $filters): array
    {
        $query = PurchaseRequest::query()->with(['store:id,code,name', 'items:id,purchase_request_id,requested_quantity,approved_quantity'])
            ->whereNotIn('status', [PurchaseRequestStatus::DRAFT, PurchaseRequestStatus::CANCELLED]);
        $this->dateRange($query, 'created_at', $filters);
        $query->when($filters['store_id'], fn ($requests, $id) => $requests->where('store_id', $id));
        $groups = $query->get()->groupBy('store_id');
        $rows = $groups->map(function (Collection $requests): array {
            $items = $requests->flatMap->items;

            return ['store' => $requests->first()->store->code.' - '.$requests->first()->store->name, 'requests' => $requests->count(), 'lines' => $items->count(), 'requested' => $this->quantity($items->sum('requested_quantity')), 'approved' => $this->quantity($items->sum(fn ($item) => $item->approved_quantity ?? 0))];
        })->values()->all();

        return ['columns' => [$this->column('store', 'Toko'), $this->column('requests', 'Permintaan', 'integer', 'right'), $this->column('lines', 'Baris', 'integer', 'right'), $this->column('requested', 'Qty Diminta', 'quantity', 'right'), $this->column('approved', 'Qty Disetujui', 'quantity', 'right')], 'rows' => $rows];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function orders(array $filters): array
    {
        $query = PurchaseOrder::query()->with(['purchaseRequest.store:id,code,name'])->withCount('items');
        $this->dateRange($query, 'order_date', $filters);
        $rows = $query->latest('order_date')->get()->map(fn (PurchaseOrder $order) => ['date' => $order->order_date->format('d/m/Y'), 'number' => $order->number, 'request' => $order->purchaseRequest->number ?? 'Data lama', 'store' => data_get($order, 'purchaseRequest.store.code', '—'), 'status' => $order->status->label(), 'items' => $order->items_count])->all();

        return ['columns' => [$this->column('date', 'Tanggal'), $this->column('number', 'No. Order'), $this->column('request', 'No. Request'), $this->column('store', 'Toko'), $this->column('status', 'Status'), $this->column('items', 'Baris', 'integer', 'right')], 'rows' => $rows];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function outstandingOrders(array $filters): array
    {
        $query = PurchaseOrderItem::query()->with(['purchaseOrder:id,number,order_date,expected_date,status', 'item:id,name,item_category_id', 'unit:id,symbol'])->withSum('receiptItems as received_quantity', 'received_quantity')
            ->whereHas('purchaseOrder', fn ($orders) => $orders->whereNotIn('status', [PurchaseOrderStatus::DRAFT, PurchaseOrderStatus::CANCELLED]));
        $this->orderDateRange($query, $filters);
        $this->applyCategory($query, $filters);
        $rows = $query->get()->filter(fn ($line) => (float) $line->quantity > (float) ($line->received_quantity ?? 0))->map(fn ($line) => ['order' => $line->purchaseOrder->number, 'order_date' => $line->purchaseOrder->order_date->format('d/m/Y'), 'expected' => $line->purchaseOrder->expected_date?->format('d/m/Y') ?? '—', 'item' => data_get($line, 'item.name', $line->name ?? '—'), 'ordered' => $line->quantity, 'received' => $this->quantity($line->received_quantity ?? 0), 'outstanding' => $this->quantity((float) $line->quantity - (float) ($line->received_quantity ?? 0)), 'unit' => $line->unit->symbol])->values()->all();

        return ['columns' => [$this->column('order', 'No. Order'), $this->column('order_date', 'Tanggal'), $this->column('expected', 'Target'), $this->column('item', 'Item'), $this->column('ordered', 'Dikirim', 'quantity', 'right'), $this->column('received', 'Diterima', 'quantity', 'right'), $this->column('outstanding', 'Outstanding', 'quantity', 'right'), $this->column('unit', 'Unit')], 'rows' => $rows];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function receivedOrders(array $filters): array
    {
        $query = ReceiptItem::query()->with(['receipt:id,number,purchase_order_id,store_id,received_at,received_by', 'receipt.store:id,code,name', 'receipt.receiver:id,name', 'receipt.purchaseOrder:id,number', 'purchaseOrderItem.item:id,name,item_category_id', 'purchaseOrderItem.unit:id,symbol']);
        $query->whereHas('receipt', fn ($receipts) => $this->dateRange($receipts, 'received_at', $filters));
        $query->when($filters['store_id'], fn ($items, $id) => $items->whereHas('receipt', fn ($receipts) => $receipts->where('store_id', $id)));
        $query->when($filters['category_id'], fn ($items, $id) => $items->whereHas('purchaseOrderItem.item', fn ($products) => $products->where('item_category_id', $id)));
        $rows = $query->latest()->get()->map(fn ($line) => ['received_at' => $line->receipt->received_at->format('d/m/Y H:i'), 'receipt' => $line->receipt->number, 'order' => $line->receipt->purchaseOrder->number, 'store' => $line->receipt->store->code, 'item' => data_get($line, 'purchaseOrderItem.item.name', $line->purchaseOrderItem->name ?? '—'), 'quantity' => $line->received_quantity, 'unit' => $line->purchaseOrderItem->unit->symbol, 'receiver' => $line->receipt->receiver->name])->all();

        return ['columns' => [$this->column('received_at', 'Diterima'), $this->column('receipt', 'No. Penerimaan'), $this->column('order', 'No. Pesanan'), $this->column('store', 'Toko'), $this->column('item', 'Item'), $this->column('quantity', 'Qty', 'quantity', 'right'), $this->column('unit', 'Unit'), $this->column('receiver', 'Penerima')], 'rows' => $rows];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function stockByStore(array $filters): array
    {
        $query = StoreStock::query()->with(['store:id,code,name', 'item:id,sku,name,item_category_id,unit_id', 'item.category:id,name', 'item.unit:id,symbol']);
        $this->applyStockFilters($query, $filters);
        $rows = $query->get()->sortBy(fn ($stock) => $stock->store->code.$stock->item->name)->map(fn ($stock) => ['store' => $stock->store->code.' - '.$stock->store->name, 'sku' => $stock->item->sku, 'item' => $stock->item->name, 'category' => $stock->item->category->name, 'quantity' => $stock->quantity, 'unit' => $stock->item->unit->symbol, 'average_cost' => $stock->average_unit_cost, 'total_value' => $stock->total_value])->values()->all();

        return ['columns' => [$this->column('store', 'Toko'), $this->column('sku', 'SKU'), $this->column('item', 'Item'), $this->column('category', 'Kategori'), $this->column('quantity', 'Stok', 'quantity', 'right'), $this->column('unit', 'Unit'), $this->column('average_cost', 'Harga Rata-rata', 'currency', 'right'), $this->column('total_value', 'Total Nilai', 'currency', 'right')], 'rows' => $rows, 'summary' => [['label' => 'Total Nilai Stok', 'value' => $this->money(collect($rows)->sum('total_value')), 'format' => 'currency']]];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function stockVsStandard(array $filters): array
    {
        $query = StoreStockStandard::query()->with(['store:id,code,name', 'item:id,sku,name,item_category_id,unit_id', 'item.unit:id,symbol']);
        $this->applyStockFilters($query, $filters);
        $stocks = StoreStock::query()->get()->keyBy(fn ($stock) => $stock->store_id.'-'.$stock->item_id);
        $rows = $query->get()->map(function ($standard) use ($stocks): array {
            $stock = (float) data_get($stocks->get($standard->store_id.'-'.$standard->item_id), 'quantity', 0);
            $target = (float) $standard->standard_quantity;
            $difference = $stock - $target;

            return ['store' => $standard->store->code.' - '.$standard->store->name, 'sku' => $standard->item->sku, 'item' => $standard->item->name, 'stock' => $this->quantity($stock), 'standard' => $standard->standard_quantity, 'difference' => $this->quantity($difference), 'status' => $difference < 0 ? 'Di bawah standar' : ($difference > 0 ? 'Di atas standar' : 'Sesuai'), 'unit' => $standard->item->unit->symbol];
        })->sortBy('store')->values()->all();

        return ['columns' => [$this->column('store', 'Toko'), $this->column('sku', 'SKU'), $this->column('item', 'Item'), $this->column('stock', 'Stok', 'quantity', 'right'), $this->column('standard', 'Standar', 'quantity', 'right'), $this->column('difference', 'Selisih', 'quantity', 'right'), $this->column('status', 'Status'), $this->column('unit', 'Unit')], 'rows' => $rows];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function stockHistory(array $filters): array
    {
        $query = StockMovement::query()->with(['store:id,code,name', 'item:id,sku,name,item_category_id', 'creator:id,name', 'supplier:id,name']);
        $this->dateRange($query, 'created_at', $filters);
        $query->when($filters['store_id'], fn ($movements, $id) => $movements->where('store_id', $id));
        $query->when($filters['category_id'], fn ($movements, $id) => $movements->whereHas('item', fn ($items) => $items->where('item_category_id', $id)));
        $rows = $query->latest()->get()->map(fn ($movement) => ['date' => $movement->created_at->format('d/m/Y H:i'), 'store' => $movement->store->code, 'sku' => $movement->item->sku, 'item' => $movement->item->name, 'type' => $movement->movement_type->label(), 'previous' => $movement->previous_quantity, 'new' => $movement->new_quantity, 'difference' => $movement->quantity_difference, 'supplier' => data_get($movement, 'supplier.name', 'Internal / koreksi'), 'unit_cost' => $movement->unit_cost ?? 0, 'new_value' => $movement->new_value, 'reason' => $movement->reason, 'by' => data_get($movement, 'creator.name', 'Sistem')])->all();

        return ['columns' => [$this->column('date', 'Waktu'), $this->column('store', 'Toko'), $this->column('sku', 'SKU'), $this->column('item', 'Item'), $this->column('type', 'Tipe'), $this->column('previous', 'Sebelum', 'quantity', 'right'), $this->column('new', 'Sesudah', 'quantity', 'right'), $this->column('difference', 'Selisih', 'quantity', 'right'), $this->column('supplier', 'Supplier'), $this->column('unit_cost', 'Harga Satuan', 'currency', 'right'), $this->column('new_value', 'Nilai Akhir', 'currency', 'right'), $this->column('reason', 'Alasan'), $this->column('by', 'Oleh')], 'rows' => $rows];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function specialRequests(array $filters): array
    {
        $query = PurchaseRequestItem::query()->with(['purchaseRequest.store:id,code,name', 'purchaseRequest.requester:id,name', 'unit:id,symbol'])->where('type', PurchaseRequestItemType::SPECIAL)->whereHas('purchaseRequest', fn ($requests) => $requests->whereNotIn('status', [PurchaseRequestStatus::DRAFT, PurchaseRequestStatus::CANCELLED]));
        $this->dateRange($query, 'created_at', $filters);
        $query->when($filters['store_id'], fn ($items, $id) => $items->whereHas('purchaseRequest', fn ($requests) => $requests->where('store_id', $id)));
        $rows = $query->latest()->get()->map(fn ($line) => ['date' => $line->created_at->format('d/m/Y'), 'request' => $line->purchaseRequest->number, 'store' => $line->purchaseRequest->store->code, 'requisitioner' => $line->purchaseRequest->requester->name, 'item' => $line->name ?? '—', 'description' => $line->description ?? '—', 'requested' => $line->requested_quantity, 'approved' => $line->approved_quantity ?? '—', 'unit' => $line->unit->symbol, 'reason' => $line->reason ?? '—'])->all();

        return ['columns' => [$this->column('date', 'Tanggal'), $this->column('request', 'No. Permintaan'), $this->column('store', 'Toko'), $this->column('requisitioner', 'Pemohon'), $this->column('item', 'Item'), $this->column('description', 'Deskripsi'), $this->column('requested', 'Diminta', 'quantity', 'right'), $this->column('approved', 'Disetujui', 'quantity', 'right'), $this->column('unit', 'Unit'), $this->column('reason', 'Alasan')], 'rows' => $rows];
    }

    /**
     * @param Builder<*> $query
     * @param  array<string, mixed>  $filters
     */
    private function applyCategory(Builder $query, array $filters): void
    {
        $query->when($filters['category_id'], fn ($lines, $id) => $lines->whereHas('item', fn ($items) => $items->where('item_category_id', $id)));
    }

    /**
     * @param Builder<*> $query
     * @param  array<string, mixed>  $filters
     */
    private function applyStockFilters(Builder $query, array $filters): void
    {
        $query->when($filters['store_id'], fn ($stocks, $id) => $stocks->where('store_id', $id));
        $query->when($filters['category_id'], fn ($stocks, $id) => $stocks->whereHas('item', fn ($items) => $items->where('item_category_id', $id)));
    }

    /**
     * @param  Builder<PurchaseOrderItem>  $query
     * @param  array<string, mixed>  $filters
     */
    private function orderDateRange(Builder $query, array $filters): void
    {
        $query->whereHas('purchaseOrder', fn ($orders) => $this->dateRange($orders, 'order_date', $filters));
    }

    private function quantity(mixed $value): string
    {
        return number_format((float) $value, 3, '.', '');
    }

    private function money(mixed $value): string
    {
        return number_format((float) $value, 2, '.', '');
    }

    private function date(string $value): string
    {
        return Carbon::parse($value)->format('d/m/Y');
    }
}

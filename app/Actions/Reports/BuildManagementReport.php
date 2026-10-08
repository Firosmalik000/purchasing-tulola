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
            ManagementReportType::PURCHASE_BY_STORE => $this->purchaseByStore($filters),
            ManagementReportType::PURCHASE_BY_CATEGORY => $this->purchaseByCategory($filters),
            ManagementReportType::SPECIAL_REQUEST => $this->specialRequests($filters),
            ManagementReportType::PURCHASE_PRICE_HISTORY => $this->priceHistory($filters),
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
                'supplier:id,name', 'creator:id,name', 'items.item:id,sku,name,item_category_id', 'items.unit:id,symbol',
                'items.allocations.purchaseRequestItem.purchaseRequest.store:id,code,name',
                'items.allocations.purchaseRequestItem.purchaseRequest.requester:id,name',
            ]);
        $this->dateRange($query, 'order_date', $filters);
        $query->when($filters['order_id'], fn ($orders, $id) => $orders->whereKey($id));
        $order = $query->latest('order_date')->latest('id')->first();

        if (! $order) {
            return [
                'columns' => $this->purchasingRequestColumns(), 'rows' => [],
                'summary' => [['label' => 'Grand Total', 'value' => '0.00', 'format' => 'currency']],
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
                'unit_price' => $line->unit_price,
                'total' => $line->total,
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
            'summary' => [['label' => 'Grand Total', 'value' => $this->money($order->items->sum('total')), 'format' => 'currency']],
            'context' => [
                'Date' => $order->order_date->format('d/m/Y'),
                'PR No / Report No' => $requests->pluck('number')->implode(', ') ?: $order->number,
                'Ship To' => $requests->pluck('store.name')->unique()->implode(', ') ?: '—',
                'Requisitioner' => $requests->pluck('requester.name')->unique()->implode(', ') ?: '—',
                'Budget' => '—',
                'Payment Method' => $order->payment_method ?: '—',
                'Material / Type' => $types ?: '—',
                'TOP' => $order->payment_term ?: '—',
                'Supplier' => data_get($order, 'supplier.name', '—'),
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
            $this->column('quantity', 'Qty', 'quantity', 'right'), $this->column('unit_price', 'Unit Price', 'currency', 'right'),
            $this->column('total', 'Total', 'currency', 'right'), $this->column('remarks', 'Remarks'),
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
        $query = PurchaseOrder::query()->with(['supplier:id,name'])->withCount('items')->withSum('items as grand_total', 'total');
        $this->dateRange($query, 'order_date', $filters);
        $rows = $query->latest('order_date')->get()->map(fn (PurchaseOrder $order) => ['date' => $order->order_date->format('d/m/Y'), 'number' => $order->number, 'supplier' => data_get($order, 'supplier.name', '—'), 'status' => $order->status->label(), 'items' => $order->items_count, 'total' => $this->money($order->grand_total ?? 0), 'payment' => trim(($order->payment_method ?? '—').' / '.($order->payment_term ?? '—'))])->all();

        return ['columns' => [$this->column('date', 'Tanggal'), $this->column('number', 'No. Pesanan'), $this->column('supplier', 'Supplier'), $this->column('status', 'Status'), $this->column('items', 'Baris', 'integer', 'right'), $this->column('total', 'Total', 'currency', 'right'), $this->column('payment', 'Pembayaran / TOP')], 'rows' => $rows, 'summary' => [['label' => 'Total Pesanan', 'value' => $this->money(collect($rows)->sum('total')), 'format' => 'currency']]];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function outstandingOrders(array $filters): array
    {
        $query = PurchaseOrderItem::query()->with(['purchaseOrder:id,number,order_date,expected_date,status,supplier_id', 'purchaseOrder.supplier:id,name', 'item:id,name,item_category_id', 'unit:id,symbol'])->withSum('receiptItems as received_quantity', 'received_quantity')
            ->whereHas('purchaseOrder', fn ($orders) => $orders->whereNotIn('status', [PurchaseOrderStatus::DRAFT, PurchaseOrderStatus::CANCELLED]));
        $this->orderDateRange($query, $filters);
        $this->applyCategory($query, $filters);
        $rows = $query->get()->filter(fn ($line) => (float) $line->quantity > (float) ($line->received_quantity ?? 0))->map(fn ($line) => ['order' => $line->purchaseOrder->number, 'order_date' => $line->purchaseOrder->order_date->format('d/m/Y'), 'expected' => $line->purchaseOrder->expected_date?->format('d/m/Y') ?? '—', 'supplier' => data_get($line, 'purchaseOrder.supplier.name', '—'), 'item' => data_get($line, 'item.name', $line->name ?? '—'), 'ordered' => $line->quantity, 'received' => $this->quantity($line->received_quantity ?? 0), 'outstanding' => $this->quantity((float) $line->quantity - (float) ($line->received_quantity ?? 0)), 'unit' => $line->unit->symbol])->values()->all();

        return ['columns' => [$this->column('order', 'No. Pesanan'), $this->column('order_date', 'Tanggal'), $this->column('expected', 'Target'), $this->column('supplier', 'Supplier'), $this->column('item', 'Item'), $this->column('ordered', 'Dipesan', 'quantity', 'right'), $this->column('received', 'Diterima', 'quantity', 'right'), $this->column('outstanding', 'Outstanding', 'quantity', 'right'), $this->column('unit', 'Unit')], 'rows' => $rows];
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
        $rows = $query->get()->sortBy(fn ($stock) => $stock->store->code.$stock->item->name)->map(fn ($stock) => ['store' => $stock->store->code.' - '.$stock->store->name, 'sku' => $stock->item->sku, 'item' => $stock->item->name, 'category' => $stock->item->category->name, 'quantity' => $stock->quantity, 'unit' => $stock->item->unit->symbol])->values()->all();

        return ['columns' => [$this->column('store', 'Toko'), $this->column('sku', 'SKU'), $this->column('item', 'Item'), $this->column('category', 'Kategori'), $this->column('quantity', 'Stok', 'quantity', 'right'), $this->column('unit', 'Unit')], 'rows' => $rows];
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
        $query = StockMovement::query()->with(['store:id,code,name', 'item:id,sku,name,item_category_id', 'creator:id,name']);
        $this->dateRange($query, 'created_at', $filters);
        $query->when($filters['store_id'], fn ($movements, $id) => $movements->where('store_id', $id));
        $query->when($filters['category_id'], fn ($movements, $id) => $movements->whereHas('item', fn ($items) => $items->where('item_category_id', $id)));
        $rows = $query->latest()->get()->map(fn ($movement) => ['date' => $movement->created_at->format('d/m/Y H:i'), 'store' => $movement->store->code, 'sku' => $movement->item->sku, 'item' => $movement->item->name, 'type' => $movement->movement_type->label(), 'previous' => $movement->previous_quantity, 'new' => $movement->new_quantity, 'difference' => $movement->quantity_difference, 'reason' => $movement->reason, 'by' => data_get($movement, 'creator.name', 'Sistem')])->all();

        return ['columns' => [$this->column('date', 'Waktu'), $this->column('store', 'Toko'), $this->column('sku', 'SKU'), $this->column('item', 'Item'), $this->column('type', 'Tipe'), $this->column('previous', 'Sebelum', 'quantity', 'right'), $this->column('new', 'Sesudah', 'quantity', 'right'), $this->column('difference', 'Selisih', 'quantity', 'right'), $this->column('reason', 'Alasan'), $this->column('by', 'Oleh')], 'rows' => $rows];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function purchaseByStore(array $filters): array
    {
        $query = PurchaseOrderItem::query()->with(['purchaseOrder:id,order_date,status', 'allocations.purchaseRequestItem.purchaseRequest.store:id,code,name'])
            ->whereHas('purchaseOrder', fn ($orders) => $orders->whereNotIn('status', [PurchaseOrderStatus::DRAFT, PurchaseOrderStatus::CANCELLED]));
        $this->orderDateRange($query, $filters);
        $this->applyCategory($query, $filters);
        $allocations = $query->get()->flatMap(fn ($line) => $line->allocations->map(fn ($allocation) => ['store' => $allocation->purchaseRequestItem->purchaseRequest->store, 'quantity' => (float) $allocation->allocated_quantity, 'value' => (float) $allocation->allocated_quantity * (float) $line->unit_price]));
        if ($filters['store_id']) {
            $allocations = $allocations->where('store.id', $filters['store_id']);
        }
        $rows = $allocations->groupBy('store.id')->map(fn (Collection $group) => ['store' => $group->first()['store']->code.' - '.$group->first()['store']->name, 'lines' => $group->count(), 'quantity' => $this->quantity($group->sum('quantity')), 'total' => $this->money($group->sum('value'))])->values()->all();

        return ['columns' => [$this->column('store', 'Toko'), $this->column('lines', 'Baris', 'integer', 'right'), $this->column('quantity', 'Qty', 'quantity', 'right'), $this->column('total', 'Nilai Pembelian', 'currency', 'right')], 'rows' => $rows, 'summary' => [['label' => 'Total Pembelian', 'value' => $this->money(collect($rows)->sum('total')), 'format' => 'currency']]];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function purchaseByCategory(array $filters): array
    {
        $query = PurchaseOrderItem::query()->with(['item.category:id,name'])->whereHas('purchaseOrder', fn ($orders) => $orders->whereNotIn('status', [PurchaseOrderStatus::DRAFT, PurchaseOrderStatus::CANCELLED]));
        $this->orderDateRange($query, $filters);
        $this->applyCategory($query, $filters);
        $rows = $query->get()->groupBy(fn (PurchaseOrderItem $line): string => $line->item_id === null ? 'Special' : $line->item->category->name)->map(fn (Collection $group, string $category) => ['category' => $category, 'lines' => $group->count(), 'quantity' => $this->quantity($group->sum('quantity')), 'total' => $this->money($group->sum('total'))])->values()->all();

        return ['columns' => [$this->column('category', 'Kategori'), $this->column('lines', 'Baris', 'integer', 'right'), $this->column('quantity', 'Qty', 'quantity', 'right'), $this->column('total', 'Nilai Pembelian', 'currency', 'right')], 'rows' => $rows, 'summary' => [['label' => 'Total Pembelian', 'value' => $this->money(collect($rows)->sum('total')), 'format' => 'currency']]];
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
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function priceHistory(array $filters): array
    {
        $query = PurchaseOrderItem::query()->with(['purchaseOrder:id,number,order_date,status,supplier_id', 'purchaseOrder.supplier:id,name', 'item:id,sku,name,item_category_id', 'unit:id,symbol'])
            ->where('item_type', PurchaseRequestItemType::STOCK)->where('unit_price', '>', 0)
            ->whereHas('purchaseOrder', fn ($orders) => $orders->where('status', '!=', PurchaseOrderStatus::CANCELLED));
        $this->orderDateRange($query, $filters);
        $this->applyCategory($query, $filters);
        $rows = $query->get()->sortByDesc(fn ($line) => $line->purchaseOrder->order_date)->map(fn ($line) => ['date' => $line->purchaseOrder->order_date->format('d/m/Y'), 'order' => $line->purchaseOrder->number, 'sku' => data_get($line, 'item.sku', '—'), 'item' => data_get($line, 'item.name', '—'), 'supplier' => data_get($line, 'purchaseOrder.supplier.name', '—'), 'quantity' => $line->quantity, 'unit' => $line->unit->symbol, 'unit_price' => $line->unit_price])->values()->all();

        return ['columns' => [$this->column('date', 'Tanggal'), $this->column('order', 'No. Pesanan'), $this->column('sku', 'SKU'), $this->column('item', 'Item'), $this->column('supplier', 'Supplier'), $this->column('quantity', 'Qty', 'quantity', 'right'), $this->column('unit', 'Unit'), $this->column('unit_price', 'Harga Satuan', 'currency', 'right')], 'rows' => $rows];
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

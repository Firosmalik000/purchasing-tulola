<?php

namespace App\Http\Controllers\Store;

use App\Actions\Receipts\ConfirmReceipt;
use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemType;
use App\Enums\ReceiptStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Store\ConfirmReceiptRequest;
use App\Http\Requests\Store\FilterIncomingOrdersRequest;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderRequestItem;
use App\Models\Receipt;
use App\Models\ReceiptItem;
use App\Models\Store;
use App\Services\PurchasingNotificationService;
use App\Support\Paging;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class IncomingOrderController extends Controller
{
    public function index(FilterIncomingOrdersRequest $request): Response
    {
        $stores = $this->assignedStores($request);
        $store = $this->selectedStore($stores, (int) ($request->validated('store_id') ?? 0));
        $status = (string) ($request->validated('status') ?? '');
        $dateFrom = $request->validated('date_from') ?? now()->startOfMonth()->toDateString();
        $dateTo = $request->validated('date_to') ?? now()->endOfMonth()->toDateString();
        $orders = PurchaseOrder::query()
            ->whereIn('status', $status !== '' ? [$status] : $this->visibleStatuses())
            ->whereHas('items.allocations.purchaseRequestItem.purchaseRequest', fn (Builder $query) => $query->where('store_id', $store->id))
            ->when($dateFrom, fn ($query) => $query->whereDate('order_date', '>=', $dateFrom))
            ->when($dateTo, fn ($query) => $query->whereDate('order_date', '<=', $dateTo))
            ->with([
                'items:id,purchase_order_id,item_type,item_id,name,unit_id',
                'items.item:id,sku,name',
                'items.unit:id,name,symbol',
                'items.allocations' => fn ($query) => $query->whereHas('purchaseRequestItem.purchaseRequest', fn ($requests) => $requests->where('store_id', $store->id)),
                'items.allocations.purchaseRequestItem.purchaseRequest:id,store_id',
                'receipts' => fn ($query) => $query->where('store_id', $store->id)->where('status', ReceiptStatus::CONFIRMED),
                'receipts.items:id,receipt_id,purchase_order_item_id,purchase_request_item_id,received_quantity',
            ])
            ->latest('order_date')->paginate(Paging::perPage($request))->withQueryString()
            ->through(fn (PurchaseOrder $order) => $this->summary($order));

        return Inertia::render('store/incoming/index', [
            'orders' => $orders,
            'stores' => $stores,
            'selectedStoreId' => $store->id,
            'statuses' => collect($this->visibleStatuses())->map(fn (string $value) => [
                'value' => $value, 'label' => PurchaseOrderStatus::from($value)->label(),
            ]),
            'filters' => [
                'status' => $status,
                'date_from' => (string) $dateFrom,
                'date_to' => (string) $dateTo,
            ],
        ]);
    }

    public function show(Request $request, PurchaseOrder $purchaseOrder): Response
    {
        $stores = $this->assignedStores($request);
        $store = $this->selectedStore($stores, $request->integer('store_id'));
        Gate::authorize('create', [Receipt::class, $store]);
        abort_unless(in_array($purchaseOrder->status->value, $this->visibleStatuses(), true), 404);

        $this->loadForStore($purchaseOrder, $store);
        abort_if($purchaseOrder->items->flatMap->allocations->isEmpty(), 404);

        return Inertia::render('store/incoming/show', [
            'purchaseOrder' => $this->detail($purchaseOrder),
            'store' => $store->only(['id', 'code', 'name']),
        ]);
    }

    public function store(ConfirmReceiptRequest $request, PurchaseOrder $purchaseOrder, ConfirmReceipt $action, PurchasingNotificationService $notifications): RedirectResponse
    {
        $store = Store::query()->findOrFail($request->integer('store_id'));
        $receipt = $action->handle($purchaseOrder, $store, $request->user(), $request->validated());
        $notifications->sendGoodsReceiptConfirmed($receipt);

        return to_route('store.incoming.show', ['purchase_order' => $purchaseOrder, 'store_id' => $store->id])
            ->with('success', "Penerimaan {$receipt->number} berhasil dikonfirmasi dan email bukti penerimaan telah dikirimkan ke pusat.");
    }

    /** @return Collection<int, Store> */
    private function assignedStores(Request $request): Collection
    {
        return $request->user()->stores()->wherePivot('is_active', true)
            ->where('stores.is_active', true)->orderBy('name')->get(['stores.id', 'code', 'name', 'stores.is_active']);
    }

    /** @param Collection<int, Store> $stores */
    private function selectedStore(Collection $stores, int $storeId): Store
    {
        abort_if($stores->isEmpty(), 403, 'Akun belum ditugaskan ke toko aktif.');
        $selected = $storeId > 0 ? $stores->firstWhere('id', $storeId) : $stores->first();
        abort_unless($selected instanceof Store, 403);

        return $selected;
    }

    /** @return list<string> */
    private function visibleStatuses(): array
    {
        return [
            PurchaseOrderStatus::DRAFT->value,
            PurchaseOrderStatus::ORDERED->value,
            PurchaseOrderStatus::PARTIALLY_RECEIVED->value,
            PurchaseOrderStatus::COMPLETED->value,
            PurchaseOrderStatus::CANCELLED->value,
        ];
    }

    private function loadForStore(PurchaseOrder $order, Store $store): void
    {
        $order->load([
            'items:id,purchase_order_id,item_type,item_id,name,unit_id',
            'items.item:id,sku,name',
            'items.unit:id,name,symbol',
            'items.allocations' => fn ($query) => $query->whereHas('purchaseRequestItem.purchaseRequest', fn ($requests) => $requests->where('store_id', $store->id)),
            'items.allocations.purchaseRequestItem.purchaseRequest:id,store_id,number',
            'receipts' => fn ($query) => $query->where('store_id', $store->id)->where('status', ReceiptStatus::CONFIRMED)->latest('received_at'),
            'receipts.receiver:id,name',
            'receipts.items:id,receipt_id,purchase_order_item_id,purchase_request_item_id,ordered_quantity,received_quantity',
            'receipts.items.purchaseOrderItem:id,purchase_order_id,item_type,item_id,name,unit_id',
            'receipts.items.purchaseOrderItem.item:id,sku,name',
            'receipts.items.purchaseOrderItem.unit:id,name,symbol',
        ]);
    }

    /** @return array<string, mixed> */
    private function summary(PurchaseOrder $order): array
    {
        $allocations = $order->items->flatMap->allocations;
        $ordered = $allocations->sum(fn (PurchaseOrderRequestItem $item) => $item->allocated_quantity);
        $received = $order->receipts->flatMap->items->sum(fn (ReceiptItem $item) => $item->received_quantity);

        return [
            'id' => $order->id, 'number' => $order->number, 'order_date' => $order->order_date,
            'expected_date' => $order->expected_date, 'status' => $order->status,
            'line_count' => $allocations->count(),
            'ordered_quantity' => $ordered,
            'received_quantity' => $received,
            'outstanding_quantity' => max($ordered - $received, 0),
        ];
    }

    /** @return array<string, mixed> */
    private function detail(PurchaseOrder $order): array
    {
        $receivedByAllocation = $order->receipts->flatMap->items
            ->groupBy(fn (ReceiptItem $item) => "{$item->purchase_order_item_id}:{$item->purchase_request_item_id}")
            ->map(fn (Collection $items) => $items->sum(fn (ReceiptItem $item) => $item->received_quantity));
        $lines = $order->items->flatMap(function ($orderItem) use ($receivedByAllocation) {
            return $orderItem->allocations->map(function (PurchaseOrderRequestItem $allocation) use ($orderItem, $receivedByAllocation): array {
                $received = (int) $receivedByAllocation->get("{$orderItem->id}:{$allocation->purchase_request_item_id}", 0);
                $ordered = $allocation->allocated_quantity;

                return [
                    'allocation_id' => $allocation->id,
                    'purchase_order_item_id' => $orderItem->id,
                    'type' => $orderItem->item_type,
                    'name' => $orderItem->item_type === PurchaseRequestItemType::STOCK ? $orderItem->item->name : $orderItem->name,
                    'sku' => $orderItem->item_type === PurchaseRequestItemType::STOCK ? $orderItem->item->sku : null,
                    'unit' => $orderItem->unit,
                    'request_number' => $allocation->purchaseRequestItem->purchaseRequest->number,
                    'ordered_quantity' => $ordered,
                    'received_quantity' => $received,
                    'outstanding_quantity' => max($ordered - $received, 0),
                ];
            });
        })->values();

        $totalStoreOrdered = $lines->sum('ordered_quantity');
        $chronologicalReceipts = $order->receipts->sortBy('id')->values();
        $runningTotal = 0;
        $receiptMeta = [];
        foreach ($chronologicalReceipts as $r) {
            $thisReceiptQty = $r->items->sum('received_quantity');
            $runningTotal += $thisReceiptQty;
            $isComplete = $totalStoreOrdered > 0 && $runningTotal >= $totalStoreOrdered;
            $receiptMeta[$r->id] = [
                'total_quantity' => $thisReceiptQty,
                'cumulative_quantity' => $runningTotal,
                'is_partial' => ! $isComplete,
            ];
        }

        return [
            'id' => $order->id, 'number' => $order->number, 'order_date' => $order->order_date,
            'expected_date' => $order->expected_date, 'status' => $order->status,
            'notes' => $order->notes, 'lines' => $lines,
            'can_receive' => in_array($order->status, [PurchaseOrderStatus::ORDERED, PurchaseOrderStatus::PARTIALLY_RECEIVED], true)
                && $lines->contains(fn (array $line) => $line['outstanding_quantity'] > 0),
            'receipts' => $order->receipts->map(function ($receipt) use ($receiptMeta) {
                $meta = $receiptMeta[$receipt->id] ?? [
                    'total_quantity' => $receipt->items->sum('received_quantity'),
                    'is_partial' => true,
                ];
                $items = $receipt->items->map(function (ReceiptItem $ri): array {
                    $orderItem = $ri->purchaseOrderItem;
                    $itemName = $orderItem ? ($orderItem->item_type === PurchaseRequestItemType::STOCK ? ($orderItem->item->name ?? '') : ($orderItem->name ?? '')) : 'Item';
                    $sku = $orderItem?->item?->sku;
                    $unit = $orderItem?->unit?->symbol ?? 'pcs';

                    return [
                        'id' => $ri->id,
                        'name' => $itemName,
                        'sku' => $sku,
                        'unit' => $unit,
                        'received_quantity' => $ri->received_quantity,
                        'ordered_quantity' => $ri->ordered_quantity,
                    ];
                })->values();

                return [
                    'id' => $receipt->id,
                    'number' => $receipt->number,
                    'received_at' => $receipt->received_at,
                    'notes' => $receipt->notes,
                    'status' => $receipt->status,
                    'receiver' => $receipt->receiver,
                    'is_partial' => $meta['is_partial'],
                    'total_quantity' => $meta['total_quantity'],
                    'items' => $items,
                ];
            })->values(),
        ];
    }
}

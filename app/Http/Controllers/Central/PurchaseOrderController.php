<?php

namespace App\Http\Controllers\Central;

use App\Actions\Orders\CancelPurchaseOrder;
use App\Actions\Orders\PlacePurchaseOrder;
use App\Actions\Orders\UpdatePurchaseOrder;
use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Central\FilterPurchaseOrdersRequest;
use App\Http\Requests\Central\UpdatePurchaseOrderRequest;
use App\Models\PurchaseOrder;
use App\Services\PurchasingNotificationService;
use App\Support\Paging;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    public function index(FilterPurchaseOrdersRequest $request): Response
    {
        $filters = $request->validated();
        $keyword = trim((string) ($filters['keyword'] ?? ''));
        $dateFrom = $filters['date_from'] ?? now()->startOfMonth()->toDateString();
        $dateTo = $filters['date_to'] ?? now()->endOfMonth()->toDateString();

        return Inertia::render('central/orders/index', [
            'orders' => PurchaseOrder::query()->with(['purchaseRequest.store:id,code,name', 'creator:id,name'])->withCount('items')
                ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
                ->when($dateFrom, fn ($query) => $query->whereDate('order_date', '>=', $dateFrom))
                ->when($dateTo, fn ($query) => $query->whereDate('order_date', '<=', $dateTo))
                ->when($keyword !== '', fn ($query) => $query->where(fn ($search) => $search
                    ->where('number', 'like', "%{$keyword}%")
                    ->orWhereHas('purchaseRequest', fn ($requests) => $requests->where('number', 'like', "%{$keyword}%")
                        ->orWhereHas('store', fn ($stores) => $stores->where('name', 'like', "%{$keyword}%")->orWhere('code', 'like', "%{$keyword}%")))))
                ->orderByRaw('CASE WHEN status = ? THEN 0 ELSE 1 END', [PurchaseOrderStatus::DRAFT->value])
                ->latest('order_date')
                ->latest('created_at')
                ->latest('id')
                ->paginate(Paging::perPage($request))->withQueryString(),
            'statuses' => collect(PurchaseOrderStatus::cases())->map(fn ($status) => ['value' => $status->value, 'label' => $status->label()]),
            'filters' => [
                'status' => (string) ($filters['status'] ?? ''),
                'keyword' => $keyword,
                'date_from' => (string) $dateFrom,
                'date_to' => (string) $dateTo,
            ],
        ]);
    }

    public function show(Request $request, PurchaseOrder $purchaseOrder): Response
    {
        Gate::authorize('view', $purchaseOrder);
        $purchaseOrder->load([
            'purchaseRequest.store:id,code,name',
            'purchaseRequest.items:id,purchase_request_id,type,name,unit_id,requested_quantity,approved_quantity,bank_quantity,bank_ordered_at,status',
            'purchaseRequest.items.unit:id,name,symbol',
            'creator:id,name',
            'items.item:id,sku,name',
            'items.unit:id,name,symbol',
            'items.allocations.purchaseRequestItem.purchaseRequest.store:id,code,name',
            'receipts.store:id,code,name',
            'receipts.receiver:id,name',
            'receipts.items',
        ]);

        return Inertia::render('central/orders/show', [
            'purchaseOrder' => $purchaseOrder,
            'canUpdate' => $request->user()->can('update', $purchaseOrder),
            'canPlace' => $request->user()->can('place', $purchaseOrder),
            'canCancel' => $request->user()->can('cancel', $purchaseOrder),
        ]);
    }

    public function update(UpdatePurchaseOrderRequest $request, PurchaseOrder $purchaseOrder, UpdatePurchaseOrder $action): RedirectResponse
    {
        $action->handle($purchaseOrder, $request->user(), $request->validated());

        return back()->with('success', 'Order dalam proses berhasil diperbarui.');
    }

    public function place(Request $request, PurchaseOrder $purchaseOrder, PlacePurchaseOrder $action, PurchasingNotificationService $notifications): RedirectResponse
    {
        Gate::authorize('place', $purchaseOrder);
        $order = $action->handle($purchaseOrder);
        $notifications->sendPurchaseOrderPlaced($order);

        $destinationName = $purchaseOrder->purchaseRequest?->store?->name ?? 'toko';

        return back()->with('success', "Order internal {$purchaseOrder->number} berhasil dikirim ke {$destinationName} dan sekarang menunggu penerimaan toko.");
    }

    public function cancel(Request $request, PurchaseOrder $purchaseOrder, CancelPurchaseOrder $action): RedirectResponse
    {
        Gate::authorize('cancel', $purchaseOrder);
        $action->handle($purchaseOrder);

        return to_route('central.orders.show', $purchaseOrder)->with('success', 'Order dibatalkan.');
    }

    public function print(Request $request, PurchaseOrder $purchaseOrder): HttpResponse
    {
        Gate::authorize('view', $purchaseOrder);
        $orderData = $this->prepareOrderPrintData($purchaseOrder);

        return response()->view('orders.print', [
            'order' => $orderData,
            'purchaseOrder' => $purchaseOrder,
            'print' => true,
            'autoPrint' => $request->boolean('auto_print', false),
        ]);
    }

    public function pdf(Request $request, PurchaseOrder $purchaseOrder): HttpResponse
    {
        Gate::authorize('view', $purchaseOrder);
        $orderData = $this->prepareOrderPrintData($purchaseOrder);

        $options = new Options();
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isRemoteEnabled', false);

        $dompdf = new Dompdf($options);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->loadHtml(view('orders.print', [
            'order' => $orderData,
            'purchaseOrder' => $purchaseOrder,
            'print' => false,
            'autoPrint' => false,
        ])->render());
        $dompdf->render();

        $filename = 'Order-'.$purchaseOrder->number.'.pdf';

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function prepareOrderPrintData(PurchaseOrder $purchaseOrder): array
    {
        $purchaseOrder->loadMissing([
            'purchaseRequest.store:id,code,name,address',
            'creator:id,name',
            'items.item:id,sku,name,item_category_id',
            'items.item.category:id,name',
            'items.unit:id,name,symbol',
            'items.allocations.purchaseRequestItem.purchaseRequest.store:id,code,name,address',
            'receipts.store:id,code,name',
            'receipts.receiver:id,name',
            'receipts.items',
        ]);

        $targetStore = $purchaseOrder->purchaseRequest?->store;
        if (! $targetStore) {
            $firstAllocatedStore = $purchaseOrder->items
                ->flatMap(fn ($item) => $item->allocations)
                ->map(fn ($alloc) => $alloc->purchaseRequestItem?->purchaseRequest?->store)
                ->filter()
                ->first();
            $targetStore = $firstAllocatedStore;
        }

        $items = $purchaseOrder->items->map(function ($item, int $index) use ($purchaseOrder) {
            $isStock = $item->item_type === PurchaseRequestItemType::STOCK;
            $name = $isStock ? ($item->item?->name ?? '—') : ($item->name ?? 'Permintaan Khusus');
            $sku = $isStock ? ($item->item?->sku ?? '—') : 'KHUSUS';
            $categoryName = $isStock ? ($item->item?->category?->name ?? 'Stok Reguler') : 'Permintaan Khusus';

            $receivedQty = (int) ($purchaseOrder->receipts ?? collect())->reduce(function ($sum, $receipt) use ($item) {
                return $sum + (int) collect($receipt->items ?? [])
                    ->where('purchase_order_item_id', $item->id)
                    ->sum('received_quantity');
            }, 0);

            $orderedQty = (int) $item->quantity;
            $isComplete = $receivedQty >= $orderedQty;
            $isPartial = $receivedQty > 0 && ! $isComplete;

            $statusLabel = match (true) {
                $isComplete => 'Lengkap',
                $isPartial => 'Sebagian',
                default => 'Belum Diterima',
            };

            return [
                'no' => $index + 1,
                'id' => $item->id,
                'sku' => $sku,
                'name' => $name,
                'category' => $categoryName,
                'type' => $item->item_type->value ?? (string) $item->item_type,
                'type_label' => $isStock ? 'Stok Reguler' : 'Item Khusus',
                'quantity' => $orderedQty,
                'unit' => $item->unit?->symbol ?? 'pcs',
                'received_quantity' => $receivedQty,
                'status_label' => $statusLabel,
            ];
        })->values()->all();

        $totalItems = count($items);
        $totalOrdered = (int) array_sum(array_column($items, 'quantity'));
        $totalReceived = (int) array_sum(array_column($items, 'received_quantity'));

        return [
            'id' => $purchaseOrder->id,
            'number' => $purchaseOrder->number,
            'order_date' => $purchaseOrder->order_date?->translatedFormat('d F Y') ?? ($purchaseOrder->order_date?->format('d/m/Y') ?? '—'),
            'order_date_raw' => $purchaseOrder->order_date?->format('d/m/Y') ?? '—',
            'expected_date' => $purchaseOrder->expected_date?->translatedFormat('d F Y') ?? ($purchaseOrder->expected_date?->format('d/m/Y') ?? '—'),
            'status' => $purchaseOrder->status->value,
            'status_label' => $purchaseOrder->status->label(),
            'notes' => $purchaseOrder->notes,
            'request_number' => $purchaseOrder->purchaseRequest?->number ?? '—',
            'target_store' => $targetStore ? [
                'code' => $targetStore->code,
                'name' => $targetStore->name,
                'address' => $targetStore->address ?? null,
            ] : null,
            'target_store_name' => $targetStore ? "{$targetStore->code} — {$targetStore->name}" : 'Internal / Pusat',
            'creator_name' => $purchaseOrder->creator?->name ?? 'Staff Central',
            'items' => $items,
            'total_items' => $totalItems,
            'total_ordered' => $totalOrdered,
            'total_received' => $totalReceived,
            'printed_at' => now()->translatedFormat('d F Y, H:i').' WIB',
            'printed_by' => auth()->user()?->name ?? 'Sistem',
        ];
    }
}

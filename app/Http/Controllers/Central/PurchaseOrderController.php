<?php

namespace App\Http\Controllers\Central;

use App\Actions\Orders\AdvancePurchaseOrder;
use App\Actions\Orders\CreatePurchaseOrder;
use App\Actions\Orders\PlacePurchaseOrder;
use App\Actions\Orders\UpdatePurchaseOrder;
use App\Enums\PurchaseOrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Central\CreatePurchaseOrderRequest;
use App\Http\Requests\Central\FilterPurchaseOrdersRequest;
use App\Http\Requests\Central\UpdatePurchaseOrderRequest;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    public function index(FilterPurchaseOrdersRequest $request): Response
    {
        $filters = $request->validated();
        $keyword = trim((string) ($filters['keyword'] ?? ''));

        return Inertia::render('central/orders/index', [
            'orders' => PurchaseOrder::query()->with(['supplier:id,code,name', 'creator:id,name'])->withCount('items')->withSum('items as grand_total', 'total')
                ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
                ->when($filters['supplier_id'] ?? null, fn ($query, $supplierId) => $query->where('supplier_id', $supplierId))
                ->when($keyword !== '', fn ($query) => $query->where(fn ($search) => $search->where('number', 'like', "%{$keyword}%")->orWhereHas('supplier', fn ($suppliers) => $suppliers->where('name', 'like', "%{$keyword}%"))))
                ->latest()->paginate(15)->withQueryString(),
            'suppliers' => Supplier::query()->orderBy('name')->get(['id', 'code', 'name']),
            'statuses' => collect(PurchaseOrderStatus::cases())->map(fn ($status) => ['value' => $status->value, 'label' => $status->label()]),
            'filters' => ['status' => (string) ($filters['status'] ?? ''), 'supplier_id' => (string) ($filters['supplier_id'] ?? ''), 'keyword' => $keyword],
        ]);
    }

    public function store(CreatePurchaseOrderRequest $request, CreatePurchaseOrder $action): RedirectResponse
    {
        $order = $action->handle($request->user(), $request->validated());

        return to_route('central.orders.show', $order)->with('success', 'Draft pesanan berhasil dibuat.');
    }

    public function show(Request $request, PurchaseOrder $purchaseOrder): Response
    {
        Gate::authorize('view', $purchaseOrder);
        $purchaseOrder->load(['supplier', 'creator:id,name', 'items.item:id,sku,name', 'items.unit:id,name,symbol', 'items.allocations.purchaseRequestItem.purchaseRequest.store:id,code,name']);

        return Inertia::render('central/orders/show', [
            'purchaseOrder' => $purchaseOrder,
            'suppliers' => Supplier::query()->where('is_active', true)->orderBy('name')->get(['id', 'code', 'name', 'payment_term']),
            'grandTotal' => number_format((float) $purchaseOrder->items->sum('total'), 2, '.', ''),
            'canUpdate' => $request->user()->can('update', $purchaseOrder),
            'canPlace' => $request->user()->can('place', $purchaseOrder),
            'canAdvance' => $request->user()->can('advance', $purchaseOrder),
            'canCancel' => $request->user()->can('cancel', $purchaseOrder),
        ]);
    }

    public function update(UpdatePurchaseOrderRequest $request, PurchaseOrder $purchaseOrder, UpdatePurchaseOrder $action): RedirectResponse
    {
        $action->handle($purchaseOrder, $request->user(), $request->validated());

        return back()->with('success', 'Draft pesanan berhasil diperbarui.');
    }

    public function place(Request $request, PurchaseOrder $purchaseOrder, PlacePurchaseOrder $action, \App\Services\PurchasingNotificationService $notifications): RedirectResponse
    {
        Gate::authorize('place', $purchaseOrder);
        $order = $action->handle($purchaseOrder, $request->user());
        $notifications->sendPurchaseOrderPlaced($order);

        return back()->with('success', 'Pesanan berhasil ditandai Dipesan dan notifikasi telah dikirim ke cabang terkait.');
    }

    public function waitForReceipt(PurchaseOrder $purchaseOrder, AdvancePurchaseOrder $action): RedirectResponse
    {
        Gate::authorize('advance', $purchaseOrder);
        $action->handle($purchaseOrder, PurchaseOrderStatus::WAITING_RECEIPT);

        return back()->with('success', 'Pesanan menunggu penerimaan toko.');
    }

    public function cancel(PurchaseOrder $purchaseOrder, AdvancePurchaseOrder $action): RedirectResponse
    {
        Gate::authorize('cancel', $purchaseOrder);
        $action->handle($purchaseOrder, PurchaseOrderStatus::CANCELLED);

        return to_route('central.orders.show', $purchaseOrder)->with('success', 'Draft pesanan dibatalkan.');
    }
}

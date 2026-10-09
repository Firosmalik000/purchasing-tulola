<?php

namespace App\Http\Controllers\Central;

use App\Actions\Orders\CancelPurchaseOrder;
use App\Actions\Orders\PlacePurchaseOrder;
use App\Actions\Orders\UpdatePurchaseOrder;
use App\Enums\PurchaseOrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Central\FilterPurchaseOrdersRequest;
use App\Http\Requests\Central\UpdatePurchaseOrderRequest;
use App\Models\PurchaseOrder;
use App\Services\PurchasingNotificationService;
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
            'orders' => PurchaseOrder::query()->with(['purchaseRequest.store:id,code,name', 'creator:id,name'])->withCount('items')
                ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
                ->when($keyword !== '', fn ($query) => $query->where(fn ($search) => $search
                    ->where('number', 'like', "%{$keyword}%")
                    ->orWhereHas('purchaseRequest', fn ($requests) => $requests->where('number', 'like', "%{$keyword}%")
                        ->orWhereHas('store', fn ($stores) => $stores->where('name', 'like', "%{$keyword}%")->orWhere('code', 'like', "%{$keyword}%")))))
                ->latest()->paginate(\App\Support\Paging::perPage($request))->withQueryString(),
            'statuses' => collect(PurchaseOrderStatus::cases())->map(fn ($status) => ['value' => $status->value, 'label' => $status->label()]),
            'filters' => ['status' => (string) ($filters['status'] ?? ''), 'keyword' => $keyword],
        ]);
    }

    public function show(Request $request, PurchaseOrder $purchaseOrder): Response
    {
        Gate::authorize('view', $purchaseOrder);
        $purchaseOrder->load(['purchaseRequest.store:id,code,name', 'creator:id,name', 'items.item:id,sku,name', 'items.unit:id,name,symbol', 'items.allocations.purchaseRequestItem.purchaseRequest.store:id,code,name']);

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
        $order = $action->handle($purchaseOrder, $request->user());
        $notifications->sendPurchaseOrderPlaced($order);

        return back()->with('success', 'Order internal dikirim dan sekarang menunggu penerimaan toko.');
    }

    public function cancel(Request $request, PurchaseOrder $purchaseOrder, CancelPurchaseOrder $action): RedirectResponse
    {
        Gate::authorize('cancel', $purchaseOrder);
        $action->handle($purchaseOrder, $request->user());

        return to_route('central.orders.show', $purchaseOrder)->with('success', 'Order dibatalkan.');
    }
}

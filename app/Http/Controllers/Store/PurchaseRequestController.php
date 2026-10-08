<?php

namespace App\Http\Controllers\Store;

use App\Actions\Requests\SavePurchaseRequestDraft;
use App\Actions\Requests\SubmitPurchaseRequest;
use App\Enums\PurchaseRequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Store\SavePurchaseRequestRequest;
use App\Models\Item;
use App\Models\PurchaseRequest;
use App\Models\Store;
use App\Models\Unit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $storeIds = $request->user()->stores()->wherePivot('is_active', true)->where('stores.is_active', true)->pluck('stores.id');
        $status = $request->string('status')->toString();

        return Inertia::render('store/requests/index', [
            'requests' => PurchaseRequest::query()->whereIn('store_id', $storeIds)->with(['store:id,code,name'])->withCount('items')
                ->when($status !== '', fn ($query) => $query->where('status', $status))->latest()->paginate(15)->withQueryString(),
            'statuses' => collect(PurchaseRequestStatus::cases())->map(fn ($value) => ['value' => $value->value, 'label' => $value->label()]),
            'filters' => ['status' => $status],
        ]);
    }

    public function create(Request $request): Response
    {
        $stores = $this->assignedStores($request);
        abort_if($stores->isEmpty(), 403, 'Akun belum ditugaskan ke toko aktif.');
        $storeId = $request->integer('store_id') ?: $stores->first()->id;
        abort_unless($stores->contains('id', $storeId), 403);

        return Inertia::render('store/requests/form', $this->formProps($stores, $storeId));
    }

    public function store(SavePurchaseRequestRequest $request, SavePurchaseRequestDraft $action): RedirectResponse
    {
        $store = Store::findOrFail($request->integer('store_id'));
        $purchaseRequest = $action->handle($store, $request->user(), $request->validated());

        return to_route('store.requests.edit', $purchaseRequest)->with('success', 'Draft permintaan berhasil disimpan.');
    }

    public function show(Request $request, PurchaseRequest $purchaseRequest): Response
    {
        Gate::authorize('view', $purchaseRequest);
        $purchaseRequest->load(['store:id,code,name', 'items.item:id,sku,name', 'items.unit:id,name,symbol', 'statusHistories.changer:id,name']);

        return Inertia::render('store/requests/show', ['purchaseRequest' => $purchaseRequest]);
    }

    public function edit(Request $request, PurchaseRequest $purchaseRequest): Response
    {
        Gate::authorize('update', $purchaseRequest);
        $stores = $this->assignedStores($request);

        return Inertia::render('store/requests/form', [
            ...$this->formProps($stores, $purchaseRequest->store_id),
            'purchaseRequest' => $purchaseRequest->load(['items.item:id,sku,name', 'items.unit:id,name,symbol']),
        ]);
    }

    public function update(SavePurchaseRequestRequest $request, PurchaseRequest $purchaseRequest, SavePurchaseRequestDraft $action): RedirectResponse
    {
        Gate::authorize('update', $purchaseRequest);
        $action->handle($purchaseRequest->store, $request->user(), $request->validated(), $purchaseRequest);

        return back()->with('success', 'Draft permintaan berhasil diperbarui.');
    }

    public function submit(Request $request, PurchaseRequest $purchaseRequest, SubmitPurchaseRequest $action, \App\Services\PurchasingNotificationService $notifications): RedirectResponse
    {
        Gate::authorize('update', $purchaseRequest);
        $submitted = $action->handle($purchaseRequest, $request->user());
        $notifications->sendPurchaseRequestSubmitted($submitted);

        return to_route('store.requests.show', $purchaseRequest)->with('success', 'Permintaan berhasil diajukan ke pusat dan notifikasi email telah terkirim.');
    }

    /** @return Collection<int, Store> */
    private function assignedStores(Request $request): Collection
    {
        return $request->user()->stores()->wherePivot('is_active', true)->where('stores.is_active', true)->orderBy('name')->get(['stores.id', 'code', 'name']);
    }

    /**
     * @param  Collection<int, Store>  $stores
     * @return array<string, mixed>
     */
    private function formProps(Collection $stores, int $storeId): array
    {
        return [
            'stores' => $stores,
            'selectedStoreId' => $storeId,
            'items' => Item::query()->where('is_active', true)->with(['unit:id,name,symbol', 'stocks' => fn ($query) => $query->where('store_id', $storeId), 'stockStandards' => fn ($query) => $query->where('store_id', $storeId)])->orderBy('name')->get(['id', 'sku', 'name', 'unit_id']),
            'units' => Unit::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'symbol']),
            'purchaseRequest' => null,
        ];
    }
}

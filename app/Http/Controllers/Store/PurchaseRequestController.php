<?php

namespace App\Http\Controllers\Store;

use App\Actions\Requests\SavePurchaseRequestDraft;
use App\Actions\Requests\SubmitPurchaseRequest;
use App\Enums\PurchaseRequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Store\SavePurchaseRequestRequest;
use App\Models\Item;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\Store;
use App\Models\Unit;
use App\Services\PurchasingNotificationService;
use App\Support\Paging;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PurchaseRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $stores = $this->assignedStores($request);
        abort_if($stores->isEmpty(), 403, 'Akun belum ditugaskan ke toko aktif.');
        $storeId = $request->integer('store_id') ?: $stores->first()->id;
        abort_unless($stores->contains('id', $storeId), 403);
        $status = $request->string('status')->toString();
        $dateFrom = $request->filled('date_from') ? $request->string('date_from')->toString() : now()->startOfMonth()->toDateString();
        $dateTo = $request->filled('date_to') ? $request->string('date_to')->toString() : now()->endOfMonth()->toDateString();

        return Inertia::render('store/requests/index', [
            'requests' => PurchaseRequest::query()->where('store_id', $storeId)->with(['store:id,code,name'])->withCount('items')
                ->when($status !== '', fn ($query) => $query->where('status', $status))
                ->when($dateFrom, fn ($query) => $query->whereDate('created_at', '>=', $dateFrom))
                ->when($dateTo, fn ($query) => $query->whereDate('created_at', '<=', $dateTo))
                ->latest()->paginate(Paging::perPage($request))->withQueryString(),
            'stores' => $stores,
            'selectedStoreId' => $storeId,
            'statuses' => collect(PurchaseRequestStatus::cases())->map(fn ($value) => ['value' => $value->value, 'label' => $value->label()]),
            'filters' => [
                'status' => $status,
                'store_id' => (string) $storeId,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
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

    public function store(SavePurchaseRequestRequest $request, SavePurchaseRequestDraft $action, SubmitPurchaseRequest $submitAction, PurchasingNotificationService $notifications): RedirectResponse
    {
        $store = Store::findOrFail($request->integer('store_id'));
        $purchaseRequest = $action->handle($store, $request->user(), $request->validated());

        if ($request->input('action') === 'submit' || $request->boolean('submit_immediately')) {
            $submitted = $submitAction->handle($purchaseRequest, $request->user());
            $notifications->sendPurchaseRequestSubmitted($submitted);

            return to_route('store.requests.show', $purchaseRequest)->with('success', 'Permintaan berhasil disimpan, diajukan ke pusat, dan notifikasi email telah terkirim.');
        }

        return to_route('store.requests.index')->with('success', 'Draft permintaan berhasil disimpan.');
    }

    public function show(Request $request, PurchaseRequest $purchaseRequest): Response
    {
        Gate::authorize('view', $purchaseRequest);
        $purchaseRequest->load([
            'store:id,code,name',
            'purchaseOrder:id,purchase_request_id,number,status,expected_date',
            'items.item:id,sku,name',
            'items.unit:id,name,symbol',
            'statusHistories' => fn ($query) => $query
                ->whereNotIn('to_status', ['ORDERED', 'COMPLETED'])
                ->where(fn ($history) => $history
                    ->where('notes', '!=', 'Order internal dibatalkan.')
                    ->orWhereNull('notes')),
            'statusHistories.changer:id,name',
        ]);

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

    public function update(SavePurchaseRequestRequest $request, PurchaseRequest $purchaseRequest, SavePurchaseRequestDraft $action, SubmitPurchaseRequest $submitAction, PurchasingNotificationService $notifications): RedirectResponse
    {
        Gate::authorize('update', $purchaseRequest);
        $action->handle($purchaseRequest->store, $request->user(), $request->validated(), $purchaseRequest);

        if ($request->input('action') === 'submit' || $request->boolean('submit_immediately')) {
            $submitted = $submitAction->handle($purchaseRequest, $request->user());
            $notifications->sendPurchaseRequestSubmitted($submitted);

            return to_route('store.requests.show', $purchaseRequest)->with('success', 'Permintaan berhasil diperbarui, diajukan ke pusat, dan notifikasi email telah terkirim.');
        }

        return to_route('store.requests.index')->with('success', 'Draft permintaan berhasil diperbarui.');
    }

    public function submit(Request $request, PurchaseRequest $purchaseRequest, SubmitPurchaseRequest $action, PurchasingNotificationService $notifications): RedirectResponse
    {
        Gate::authorize('update', $purchaseRequest);
        $submitted = $action->handle($purchaseRequest, $request->user());
        $notifications->sendPurchaseRequestSubmitted($submitted);

        return to_route('store.requests.show', $purchaseRequest)->with('success', 'Permintaan berhasil diajukan ke pusat dan notifikasi email telah terkirim.');
    }

    public function sampleImage(PurchaseRequestItem $purchaseRequestItem): StreamedResponse
    {
        Gate::authorize('view', $purchaseRequestItem->purchaseRequest);
        abort_unless($purchaseRequestItem->sample_image_path, 404);
        abort_unless(Storage::disk('local')->exists($purchaseRequestItem->sample_image_path), 404);

        return Storage::disk('local')->response($purchaseRequestItem->sample_image_path);
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
            'items' => Item::query()
                ->where('items.is_active', true)
                ->with([
                    'category:id,name,code',
                    'unit:id,name,symbol',
                    'stocks' => fn ($query) => $query->where('store_id', $storeId),
                    'stockStandards' => fn ($query) => $query->where('store_id', $storeId),
                ])
                ->leftJoin('item_categories', 'item_categories.id', '=', 'items.item_category_id')
                ->orderBy('item_categories.id')
                ->orderBy('items.name')
                ->select('items.*')
                ->get(),
            'units' => Unit::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'symbol']),
            'purchaseRequest' => null,
        ];
    }
}

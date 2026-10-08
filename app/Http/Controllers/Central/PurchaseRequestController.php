<?php

namespace App\Http\Controllers\Central;

use App\Actions\Requests\ListCentralPurchaseRequests;
use App\Actions\Requests\ProcessPurchaseRequest;
use App\Actions\Requests\RejectPurchaseRequest;
use App\Enums\PurchaseRequestItemType;
use App\Enums\PurchaseRequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Central\FilterPurchaseRequestsRequest;
use App\Http\Requests\Central\ProcessPurchaseRequestRequest;
use App\Http\Requests\Central\RejectPurchaseRequestRequest;
use App\Models\PurchaseRequest;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseRequestController extends Controller
{
    public function index(FilterPurchaseRequestsRequest $request, ListCentralPurchaseRequests $query): Response
    {
        $filters = $request->validated();

        return Inertia::render('central/requests/index', [
            'requests' => $query->handle($filters),
            'stores' => Store::query()->orderBy('name')->get(['id', 'code', 'name']),
            'statuses' => collect(PurchaseRequestStatus::cases())
                ->reject(fn (PurchaseRequestStatus $status) => $status === PurchaseRequestStatus::DRAFT)
                ->map(fn (PurchaseRequestStatus $status) => ['value' => $status->value, 'label' => $status->label()])
                ->values(),
            'types' => collect(PurchaseRequestItemType::cases())->map(fn (PurchaseRequestItemType $type) => [
                'value' => $type->value,
                'label' => $type === PurchaseRequestItemType::STOCK ? 'Stok Reguler' : 'Permintaan Khusus',
            ]),
            'filters' => [
                'store_id' => (string) ($filters['store_id'] ?? ''),
                'status' => (string) ($filters['status'] ?? ''),
                'type' => (string) ($filters['type'] ?? ''),
                'date_from' => (string) ($filters['date_from'] ?? ''),
                'date_to' => (string) ($filters['date_to'] ?? ''),
                'keyword' => (string) ($filters['keyword'] ?? ''),
            ],
        ]);
    }

    public function show(Request $request, PurchaseRequest $purchaseRequest): Response
    {
        Gate::authorize('view', $purchaseRequest);
        $purchaseRequest->load([
            'store:id,code,name',
            'requester:id,name,email',
            'items.item:id,sku,name',
            'items.unit:id,name,symbol',
            'statusHistories.changer:id,name',
        ]);

        return Inertia::render('central/requests/show', [
            'purchaseRequest' => $purchaseRequest,
            'canProcess' => $request->user()->can('process', $purchaseRequest),
            'canReject' => $request->user()->can('reject', $purchaseRequest),
        ]);
    }

    public function process(ProcessPurchaseRequestRequest $request, PurchaseRequest $purchaseRequest, ProcessPurchaseRequest $action): RedirectResponse
    {
        $action->handle($purchaseRequest, $request->user(), $request->validated('items'), $request->validated('notes'));

        return to_route('central.requests.show', $purchaseRequest)->with('success', 'Permintaan berhasil diproses.');
    }

    public function reject(RejectPurchaseRequestRequest $request, PurchaseRequest $purchaseRequest, RejectPurchaseRequest $action): RedirectResponse
    {
        $action->handle($purchaseRequest, $request->user(), $request->validated('reason'));

        return to_route('central.requests.show', $purchaseRequest)->with('success', 'Permintaan berhasil ditolak.');
    }
}

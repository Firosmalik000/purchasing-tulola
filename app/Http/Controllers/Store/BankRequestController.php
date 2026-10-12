<?php

namespace App\Http\Controllers\Store;

use App\Enums\PurchaseRequestItemStatus;
use App\Enums\PurchaseRequestItemType;
use App\Http\Controllers\Controller;
use App\Models\PurchaseRequestItem;
use App\Models\Store;
use App\Support\Paging;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BankRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $stores = $this->assignedStores($request);
        abort_if($stores->isEmpty(), 403, 'Akun belum ditugaskan ke toko aktif.');

        $storeId = $request->integer('store_id') ?: $stores->first()->id;
        abort_unless($stores->contains('id', $storeId), 403);

        $statusFilter = $request->input('status', 'pending');
        $keyword = trim((string) $request->input('keyword', ''));
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $baseQuery = PurchaseRequestItem::query()
            ->where('purchase_request_items.type', PurchaseRequestItemType::SPECIAL)
            ->whereHas('purchaseRequest', fn ($pr) => $pr->where('store_id', $storeId))
            ->where(function ($q) {
                $q->where('purchase_request_items.bank_quantity', '>', 0)
                    ->orWhere('purchase_request_items.status', PurchaseRequestItemStatus::BANK_PERMINTAAN);
            });

        // Summary metrics for this store
        $pendingQuery = (clone $baseQuery)->whereNull('purchase_request_items.bank_ordered_at');
        $orderedQuery = (clone $baseQuery)->whereNotNull('purchase_request_items.bank_ordered_at');

        $pendingItemsCount = (clone $pendingQuery)->count('purchase_request_items.id');
        $pendingQuantitySum = (int) (clone $pendingQuery)->sum(
            DB::raw('CASE WHEN purchase_request_items.bank_quantity > 0 THEN purchase_request_items.bank_quantity ELSE COALESCE(purchase_request_items.approved_quantity, purchase_request_items.requested_quantity) END')
        );
        $orderedItemsCount = (clone $orderedQuery)->count('purchase_request_items.id');

        $query = (clone $baseQuery)
            ->select('purchase_request_items.*')
            ->with([
                'purchaseRequest:id,number,store_id,requested_by,created_at,required_date',
                'purchaseRequest.store:id,code,name',
                'purchaseRequest.requester:id,name',
                'unit:id,name,symbol',
                'orderAllocations.purchaseOrderItem.purchaseOrder:id,number,status,order_date',
            ])
            ->when($statusFilter === 'pending', function ($q) {
                $q->whereNull('purchase_request_items.bank_ordered_at');
            })
            ->when($statusFilter === 'ordered', function ($q) {
                $q->whereNotNull('purchase_request_items.bank_ordered_at');
            })
            ->when($keyword !== '', function ($q) use ($keyword) {
                $q->where(function ($sub) use ($keyword) {
                    $sub->where('purchase_request_items.name', 'like', "%{$keyword}%")
                        ->orWhere('purchase_request_items.description', 'like', "%{$keyword}%")
                        ->orWhere('purchase_request_items.reason', 'like', "%{$keyword}%")
                        ->orWhereHas('purchaseRequest', fn ($pr) => $pr->where('number', 'like', "%{$keyword}%"));
                });
            })
            ->when($dateFrom, function ($q, $from) {
                $q->whereHas('purchaseRequest', fn ($pr) => $pr->whereDate('created_at', '>=', $from));
            })
            ->when($dateTo, function ($q, $to) {
                $q->whereHas('purchaseRequest', fn ($pr) => $pr->whereDate('created_at', '<=', $to));
            })
            ->latest('purchase_request_items.id');

        return Inertia::render('store/bank-requests/index', [
            'items' => $query->paginate(Paging::perPage($request))->withQueryString(),
            'stores' => $stores,
            'selectedStoreId' => $storeId,
            'stats' => [
                'pending_items' => $pendingItemsCount,
                'pending_quantity' => $pendingQuantitySum,
                'ordered_items' => $orderedItemsCount,
            ],
            'filters' => [
                'status' => $statusFilter,
                'store_id' => (string) $storeId,
                'keyword' => $keyword,
                'date_from' => (string) ($dateFrom ?? ''),
                'date_to' => (string) ($dateTo ?? ''),
            ],
        ]);
    }

    /** @return Collection<int, Store> */
    private function assignedStores(Request $request): Collection
    {
        return $request->user()->stores()
            ->wherePivot('is_active', true)
            ->where('stores.is_active', true)
            ->orderBy('name')
            ->get(['stores.id', 'code', 'name']);
    }
}

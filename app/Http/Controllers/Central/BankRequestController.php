<?php

namespace App\Http\Controllers\Central;

use App\Actions\Orders\CreateOrderFromBankRequests;
use App\Enums\PurchaseRequestItemStatus;
use App\Enums\PurchaseRequestItemType;
use App\Http\Controllers\Controller;
use App\Models\PurchaseRequestItem;
use App\Models\Store;
use App\Support\Paging;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class BankRequestController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('access-central');

        $storeId = $request->input('store_id');
        $keyword = trim((string) $request->input('keyword', ''));
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $baseQuery = PurchaseRequestItem::query()
            ->where('purchase_request_items.type', PurchaseRequestItemType::SPECIAL)
            ->where(function ($q) {
                $q->where(function ($sub) {
                    $sub->where('purchase_request_items.bank_quantity', '>', 0)
                        ->whereNull('purchase_request_items.bank_ordered_at');
                })->orWhere(function ($sub) {
                    $sub->where('purchase_request_items.status', PurchaseRequestItemStatus::BANK_PERMINTAAN)
                        ->whereNull('purchase_request_items.bank_ordered_at')
                        ->whereDoesntHave('orderAllocations');
                });
            });

        // Summary metrics
        $totalItemsCount = (clone $baseQuery)->count('purchase_request_items.id');
        $totalQuantitySum = (int) (clone $baseQuery)->sum(\Illuminate\Support\Facades\DB::raw('CASE WHEN purchase_request_items.bank_quantity > 0 THEN purchase_request_items.bank_quantity ELSE COALESCE(purchase_request_items.approved_quantity, purchase_request_items.requested_quantity) END'));
        $distinctStoresCount = (clone $baseQuery)
            ->join('purchase_requests', 'purchase_requests.id', '=', 'purchase_request_items.purchase_request_id')
            ->distinct('purchase_requests.store_id')
            ->count('purchase_requests.store_id');

        $query = (clone $baseQuery)
            ->select('purchase_request_items.*')
            ->with([
                'purchaseRequest:id,number,store_id,requested_by,created_at,required_date',
                'purchaseRequest.store:id,code,name',
                'purchaseRequest.requester:id,name',
                'unit:id,name,symbol',
            ])
            ->when($storeId, function ($q, $id) {
                $q->whereHas('purchaseRequest', fn ($pr) => $pr->where('store_id', $id));
            })
            ->when($keyword !== '', function ($q) use ($keyword) {
                $q->where(function ($sub) use ($keyword) {
                    $sub->where('name', 'like', "%{$keyword}%")
                        ->orWhere('description', 'like', "%{$keyword}%")
                        ->orWhere('reason', 'like', "%{$keyword}%")
                        ->orWhereHas('purchaseRequest', fn ($pr) => $pr->where('number', 'like', "%{$keyword}%"));
                });
            })
            ->when($dateFrom, function ($q, $from) {
                $q->whereHas('purchaseRequest', fn ($pr) => $pr->whereDate('created_at', '>=', $from));
            })
            ->when($dateTo, function ($q, $to) {
                $q->whereHas('purchaseRequest', fn ($pr) => $pr->whereDate('created_at', '<=', $to));
            })
            ->latest('id');

        return Inertia::render('central/bank-requests/index', [
            'items' => $query->paginate(Paging::perPage($request))->withQueryString(),
            'stores' => Store::query()->orderBy('name')->get(['id', 'code', 'name']),
            'stats' => [
                'total_items' => $totalItemsCount,
                'total_quantity' => $totalQuantitySum,
                'total_stores' => $distinctStoresCount,
            ],
            'filters' => [
                'store_id' => (string) ($storeId ?? ''),
                'keyword' => $keyword,
                'date_from' => (string) ($dateFrom ?? ''),
                'date_to' => (string) ($dateTo ?? ''),
            ],
        ]);
    }

    public function createOrder(Request $request, CreateOrderFromBankRequests $action): RedirectResponse
    {
        Gate::authorize('access-central');

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'integer'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1'],
            'expected_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ], [
            'items.required' => 'Pilih minimal satu item dari Bank Permintaan.',
            'items.min' => 'Pilih minimal satu item dari Bank Permintaan.',
        ]);

        $orders = $action->handle(
            $validated['items'],
            $request->user(),
            $validated['expected_date'] ?? null,
            $validated['notes'] ?? null,
        );

        $count = $orders->count();
        $message = $count === 1
            ? "Order {$orders->first()->number} berhasil dibuat dari Bank Permintaan."
            : "{$count} Order internal berhasil dibuat dari Bank Permintaan.";

        if ($count === 1) {
            return to_route('central.orders.show', $orders->first())->with('success', $message);
        }

        return to_route('central.orders.index')->with('success', $message);
    }
}

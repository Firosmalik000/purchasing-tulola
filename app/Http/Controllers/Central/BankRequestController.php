<?php

namespace App\Http\Controllers\Central;

use App\Actions\Orders\CreateOrderFromBankRequests;
use App\Enums\PurchaseRequestItemStatus;
use App\Enums\PurchaseRequestItemType;
use App\Http\Controllers\Controller;
use App\Models\PurchaseRequestItem;
use App\Models\Store;
use App\Services\BankRequestExportService;
use App\Support\Paging;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BankRequestController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('access-central');

        $storeId = $request->input('store_id');
        $keyword = trim((string) $request->input('keyword', ''));
        $dateFrom = $this->normalizeDate($request->input('date_from'));
        $dateTo = $this->normalizeDate($request->input('date_to'));

        $filters = [
            'store_id' => $storeId,
            'keyword' => $keyword,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
        ];

        $baseQuery = $this->buildBaseQuery();

        // Summary metrics
        $totalItemsCount = (clone $baseQuery)->count('purchase_request_items.id');
        $totalQuantitySum = (int) (clone $baseQuery)->sum(DB::raw('CASE WHEN purchase_request_items.bank_quantity > 0 THEN purchase_request_items.bank_quantity ELSE COALESCE(purchase_request_items.approved_quantity, purchase_request_items.requested_quantity) END'));
        $distinctStoresCount = (clone $baseQuery)
            ->join('purchase_requests', 'purchase_requests.id', '=', 'purchase_request_items.purchase_request_id')
            ->distinct('purchase_requests.store_id')
            ->count('purchase_requests.store_id');

        $query = $this->buildFilteredQuery($filters);

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

    public function excel(Request $request, BankRequestExportService $exportService): StreamedResponse
    {
        Gate::authorize('access-central');

        $storeId = $request->input('store_id');
        $keyword = trim((string) $request->input('keyword', ''));
        $dateFrom = $this->normalizeDate($request->input('date_from'));
        $dateTo = $this->normalizeDate($request->input('date_to'));

        $filters = [
            'store_id' => $storeId,
            'keyword' => $keyword,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
        ];

        $query = $this->buildFilteredQuery($filters);

        return $exportService->downloadExcel($query, $filters, $request->user());
    }

    public function csv(Request $request, BankRequestExportService $exportService): StreamedResponse
    {
        Gate::authorize('access-central');

        $storeId = $request->input('store_id');
        $keyword = trim((string) $request->input('keyword', ''));
        $dateFrom = $this->normalizeDate($request->input('date_from'));
        $dateTo = $this->normalizeDate($request->input('date_to'));

        $filters = [
            'store_id' => $storeId,
            'keyword' => $keyword,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
        ];

        $query = $this->buildFilteredQuery($filters);

        return $exportService->downloadCsv($query, $filters, $request->user());
    }

    /**
     * @return Builder<PurchaseRequestItem>
     */
    private function buildBaseQuery(): Builder
    {
        return PurchaseRequestItem::query()
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
    }

    /**
     * @param  array{store_id: mixed, keyword: string, date_from: ?string, date_to: ?string}  $filters
     * @return Builder<PurchaseRequestItem>
     */
    private function buildFilteredQuery(array $filters): Builder
    {
        $storeId = $filters['store_id'] ?? null;
        $keyword = $filters['keyword'] ?? '';
        $dateFrom = $filters['date_from'] ?? null;
        $dateTo = $filters['date_to'] ?? null;

        return $this->buildBaseQuery()
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
    }

    /**
     * Normalize date string (dd/mm/yyyy, yyyy-mm-dd, etc.) to YYYY-MM-DD.
     */
    private function normalizeDate(?string $date): ?string
    {
        if (blank($date)) {
            return null;
        }

        $trimmed = trim($date);

        // Match DD/MM/YYYY or DD-MM-YYYY
        if (preg_match('/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/', $trimmed, $matches)) {
            $day = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
            $month = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
            $year = $matches[3];

            if (checkdate((int) $month, (int) $day, (int) $year)) {
                return "{$year}-{$month}-{$day}";
            }
        }

        // Match YYYY-MM-DD or YYYY/MM/DD
        if (preg_match('/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/', $trimmed, $matches)) {
            $year = $matches[1];
            $month = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
            $day = str_pad($matches[3], 2, '0', STR_PAD_LEFT);

            if (checkdate((int) $month, (int) $day, (int) $year)) {
                return "{$year}-{$month}-{$day}";
            }
        }

        try {
            return Carbon::parse($trimmed)->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }
    }

    public function createOrder(Request $request, CreateOrderFromBankRequests $action): RedirectResponse
    {
        Gate::authorize('access-central');

        if ($request->filled('expected_date')) {
            $request->merge([
                'expected_date' => $this->normalizeDate($request->input('expected_date')),
            ]);
        }

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'integer'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1'],
            'expected_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ], [
            'items.required' => 'Pilih minimal satu item dari Bank Permintaan.',
            'items.min' => 'Pilih minimal satu item dari Bank Permintaan.',
            'items.*.id.required' => 'Identitas item bank permintaan wajib ada.',
            'items.*.quantity.integer' => 'Jumlah item wajib berupa bilangan bulat.',
            'items.*.quantity.min' => 'Jumlah item minimal 1.',
            'expected_date.date' => 'Format estimasi tanggal kedatangan tidak valid.',
            'notes.string' => 'Catatan harus berupa teks.',
            'notes.max' => 'Catatan maksimal 2000 karakter.',
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

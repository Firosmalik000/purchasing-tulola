<?php

namespace App\Http\Controllers\Store;

use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestStatus;
use App\Enums\ReceiptStatus;
use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\Receipt;
use App\Models\StoreStock;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StoreDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $storeIds = $user->stores()->wherePivot('is_active', true)->pluck('stores.id')->all();

        $selectedMonth = $request->integer('month', Carbon::now()->month);
        $selectedYear = $request->integer('year', Carbon::now()->year);

        if ($selectedMonth < 1 || $selectedMonth > 12) {
            $selectedMonth = Carbon::now()->month;
        }
        if ($selectedYear < 2020 || $selectedYear > 2035) {
            $selectedYear = Carbon::now()->year;
        }

        $targetDate = Carbon::createFromDate($selectedYear, $selectedMonth, 1);
        $monthStart = $targetDate->copy()->startOfMonth();
        $monthEnd = $targetDate->copy()->endOfMonth();

        $myDrafts = PurchaseRequest::query()
            ->whereIn('store_id', $storeIds)
            ->where('status', PurchaseRequestStatus::DRAFT)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->count();

        $submittedRequests = PurchaseRequest::query()
            ->whereIn('store_id', $storeIds)
            ->where('status', PurchaseRequestStatus::SUBMITTED)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->count();

        $processedRequests = PurchaseRequest::query()
            ->whereIn('store_id', $storeIds)
            ->where('status', PurchaseRequestStatus::PROCESSED)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->count();

        // Incoming POs waiting for receipt in this period
        $incomingOrders = PurchaseOrder::query()
            ->whereIn('status', [PurchaseOrderStatus::ORDERED, PurchaseOrderStatus::PARTIALLY_RECEIVED])
            ->where(function ($query) use ($storeIds) {
                $query->whereHas('purchaseRequest', fn ($q) => $q->whereIn('store_id', $storeIds))
                    ->orWhereHas('items.allocations.purchaseRequestItem.purchaseRequest', fn ($q) => $q->whereIn('store_id', $storeIds));
            })
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->count();

        // Completed receipts in this period
        $confirmedReceipts = Receipt::query()
            ->whereIn('store_id', $storeIds)
            ->where('status', ReceiptStatus::CONFIRMED)
            ->whereBetween('received_at', [$monthStart, $monthEnd])
            ->count();

        // Stock below standard in assigned stores
        $lowStockCount = StoreStock::query()
            ->whereIn('store_stocks.store_id', $storeIds)
            ->join('items', 'items.id', '=', 'store_stocks.item_id')
            ->where('items.is_active', true)
            ->leftJoin('store_stock_standards', function ($join) {
                $join->on('store_stocks.store_id', '=', 'store_stock_standards.store_id')
                    ->on('store_stocks.item_id', '=', 'store_stock_standards.item_id');
            })
            ->whereRaw('store_stocks.quantity < COALESCE(store_stock_standards.standard_quantity, items.min_stock, 0)')
            ->whereRaw('COALESCE(store_stock_standards.standard_quantity, items.min_stock, 0) > 0')
            ->count();

        // Trend requests and completed orders last 6 months up to selected period
        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = $targetDate->copy()->subMonths($i);
            $mStart = $month->copy()->startOfMonth();
            $mEnd = $month->copy()->endOfMonth();

            $reqCount = PurchaseRequest::query()
                ->whereIn('store_id', $storeIds)
                ->where('status', '!=', PurchaseRequestStatus::DRAFT)
                ->whereBetween('created_at', [$mStart, $mEnd])
                ->count();

            $completedOrderCount = PurchaseOrder::query()
                ->where('status', PurchaseOrderStatus::COMPLETED)
                ->where(function ($query) use ($storeIds) {
                    $query->whereHas('purchaseRequest', fn ($q) => $q->whereIn('store_id', $storeIds))
                        ->orWhereHas('items.allocations.purchaseRequestItem.purchaseRequest', fn ($q) => $q->whereIn('store_id', $storeIds));
                })
                ->whereBetween('created_at', [$mStart, $mEnd])
                ->count();

            $monthlyTrend[] = [
                'month' => $month->translatedFormat('M'),
                'requests' => $reqCount,
                'orders' => $completedOrderCount,
            ];
        }

        // Top 3 most frequently requested items in this store for the period
        $topRequestedItems = PurchaseRequestItem::query()
            ->join('purchase_requests', 'purchase_requests.id', '=', 'purchase_request_items.purchase_request_id')
            ->leftJoin('items', 'items.id', '=', 'purchase_request_items.item_id')
            ->leftJoin('item_categories', 'item_categories.id', '=', 'items.item_category_id')
            ->leftJoin('units', 'units.id', '=', 'purchase_request_items.unit_id')
            ->whereIn('purchase_requests.store_id', $storeIds)
            ->whereNotIn('purchase_requests.status', [PurchaseRequestStatus::DRAFT, PurchaseRequestStatus::CANCELLED])
            ->whereBetween('purchase_requests.created_at', [$monthStart, $monthEnd])
            ->selectRaw("
                COALESCE(items.id, 0) as item_id,
                COALESCE(items.name, purchase_request_items.name) as item_name,
                COALESCE(items.sku, '-') as sku,
                COALESCE(item_categories.name, 'Lainnya') as category_name,
                COALESCE(units.symbol, 'pcs') as unit,
                COUNT(purchase_request_items.id) as request_count,
                SUM(purchase_request_items.requested_quantity) as total_quantity
            ")
            ->groupByRaw("COALESCE(items.id, 0), COALESCE(items.name, purchase_request_items.name), COALESCE(items.sku, '-'), COALESCE(item_categories.name, 'Lainnya'), COALESCE(units.symbol, 'pcs')")
            ->orderByDesc('total_quantity')
            ->orderByDesc('request_count')
            ->take(3)
            ->get()
            ->map(fn ($row) => [
                'item_id' => (int) $row->item_id,
                'name' => (string) $row->item_name,
                'sku' => (string) $row->sku,
                'category' => (string) $row->category_name,
                'unit' => (string) $row->unit,
                'request_count' => (int) $row->request_count,
                'total_quantity' => (int) $row->total_quantity,
            ]);

        // Recent Requests for the period
        $recentRequests = PurchaseRequest::query()
            ->whereIn('store_id', $storeIds)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->with(['store:id,name,code'])
            ->latest()
            ->take(5)
            ->get(['id', 'number', 'store_id', 'status', 'required_date', 'created_at']);

        // Recent Receipts for the period
        $recentReceipts = Receipt::query()
            ->whereIn('store_id', $storeIds)
            ->whereBetween('received_at', [$monthStart, $monthEnd])
            ->with(['purchaseOrder:id,number'])
            ->latest('received_at')
            ->take(5)
            ->get(['id', 'number', 'purchase_order_id', 'status', 'received_at']);

        return Inertia::render('store/dashboard', [
            'metrics' => [
                'myDrafts' => $myDrafts,
                'submittedRequests' => $submittedRequests,
                'processedRequests' => $processedRequests,
                'incomingOrders' => $incomingOrders,
                'confirmedReceipts' => $confirmedReceipts,
                'lowStockCount' => $lowStockCount,
            ],
            'selectedPeriod' => [
                'month' => $selectedMonth,
                'year' => $selectedYear,
            ],
            'monthlyTrend' => $monthlyTrend,
            'topRequestedItems' => $topRequestedItems,
            'recentRequests' => $recentRequests,
            'recentReceipts' => $recentReceipts,
        ]);
    }
}

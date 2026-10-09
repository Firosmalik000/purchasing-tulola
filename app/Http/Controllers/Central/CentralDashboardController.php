<?php

namespace App\Http\Controllers\Central;

use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestStatus;
use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\StoreStock;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CentralDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
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

        // Metric counts for the selected period
        $pendingRequests = PurchaseRequest::query()
            ->where('status', PurchaseRequestStatus::SUBMITTED)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->count();

        $processedRequests = PurchaseRequest::query()
            ->where('status', PurchaseRequestStatus::PROCESSED)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->count();

        $activeOrders = PurchaseOrder::query()
            ->whereIn('status', [
                PurchaseOrderStatus::ORDERED,
                PurchaseOrderStatus::PARTIALLY_RECEIVED,
            ])
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->count();

        $completedOrders = PurchaseOrder::query()
            ->where('status', PurchaseOrderStatus::COMPLETED)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->count();

        // Stock alert count: stock < standard for active items & stores
        $stockAlerts = StoreStock::query()
            ->join('items', 'items.id', '=', 'store_stocks.item_id')
            ->join('stores', 'stores.id', '=', 'store_stocks.store_id')
            ->leftJoin('store_stock_standards', function ($join) {
                $join->on('store_stocks.store_id', '=', 'store_stock_standards.store_id')
                    ->on('store_stocks.item_id', '=', 'store_stock_standards.item_id');
            })
            ->where('items.is_active', true)
            ->where('stores.is_active', true)
            ->whereRaw('store_stocks.quantity < COALESCE(store_stock_standards.standard_quantity, items.min_stock, 0)')
            ->whereRaw('COALESCE(store_stock_standards.standard_quantity, items.min_stock, 0) > 0')
            ->count();

        // 6 Months Trend for Requests vs Completed PO up to selected period
        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = $targetDate->copy()->subMonths($i);
            $mStart = $month->copy()->startOfMonth();
            $mEnd = $month->copy()->endOfMonth();

            $reqCount = PurchaseRequest::query()
                ->where('status', '!=', PurchaseRequestStatus::DRAFT)
                ->whereBetween('created_at', [$mStart, $mEnd])
                ->count();
            $poCount = PurchaseOrder::query()
                ->where('status', PurchaseOrderStatus::COMPLETED)
                ->whereBetween('created_at', [$mStart, $mEnd])
                ->count();

            $monthlyTrend[] = [
                'month' => $month->translatedFormat('M'),
                'requests' => $reqCount,
                'orders' => $poCount,
            ];
        }

        // Top 3 most frequently requested items across all stores for the selected period
        $topRequestedItems = PurchaseRequestItem::query()
            ->join('purchase_requests', 'purchase_requests.id', '=', 'purchase_request_items.purchase_request_id')
            ->leftJoin('items', 'items.id', '=', 'purchase_request_items.item_id')
            ->leftJoin('item_categories', 'item_categories.id', '=', 'items.item_category_id')
            ->leftJoin('units', 'units.id', '=', 'purchase_request_items.unit_id')
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

        // Status Distribution
        $requestStatusDist = [
            ['name' => 'Menunggu Review', 'count' => $pendingRequests, 'color' => '#f59e0b'],
            ['name' => 'Disetujui/Proses', 'count' => $processedRequests, 'color' => '#6366f1'],
            ['name' => 'Pesanan Aktif', 'count' => $activeOrders, 'color' => '#8b5cf6'],
            ['name' => 'Selesai/Diterima', 'count' => $completedOrders, 'color' => '#10b981'],
        ];

        // Recent Requests (last 5, excluding drafts) in the period
        $recentRequests = PurchaseRequest::query()
            ->where('status', '!=', PurchaseRequestStatus::DRAFT)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->with(['store:id,name,code', 'requester:id,name'])
            ->latest()
            ->take(5)
            ->get(['id', 'number', 'store_id', 'requested_by', 'status', 'created_at']);

        // Recent POs (last 5) in the period
        $recentOrders = PurchaseOrder::query()
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->with(['purchaseRequest.store:id,code,name'])
            ->latest()
            ->take(5)
            ->get(['id', 'number', 'purchase_request_id', 'status', 'order_date', 'expected_date']);

        return Inertia::render('central/dashboard', [
            'metrics' => [
                'pendingRequests' => $pendingRequests,
                'processedRequests' => $processedRequests,
                'activeOrders' => $activeOrders,
                'completedOrders' => $completedOrders,
                'stockAlerts' => $stockAlerts,
            ],
            'selectedPeriod' => [
                'month' => $selectedMonth,
                'year' => $selectedYear,
            ],
            'monthlyTrend' => $monthlyTrend,
            'topRequestedItems' => $topRequestedItems,
            'requestStatusDist' => $requestStatusDist,
            'recentRequests' => $recentRequests,
            'recentOrders' => $recentOrders,
        ]);
    }
}

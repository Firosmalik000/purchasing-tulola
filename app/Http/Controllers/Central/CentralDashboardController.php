<?php

namespace App\Http\Controllers\Central;

use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestStatus;
use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\Receipt;
use App\Models\Store;
use App\Models\StoreStock;
use App\Models\StoreStockStandard;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class CentralDashboardController extends Controller
{
    public function __invoke(): Response
    {
        // Metric counts
        $pendingRequests = PurchaseRequest::query()->where('status', PurchaseRequestStatus::SUBMITTED)->count();
        $processedRequests = PurchaseRequest::query()->where('status', PurchaseRequestStatus::PROCESSED)->count();
        $activeOrders = PurchaseOrder::query()->whereIn('status', [
            PurchaseOrderStatus::ORDERED,
            PurchaseOrderStatus::WAITING_RECEIPT,
            PurchaseOrderStatus::PARTIALLY_RECEIVED,
        ])->count();
        $completedOrders = PurchaseOrder::query()->where('status', PurchaseOrderStatus::RECEIVED)->count();

        // Stock alert count: stock < standard
        $stockAlerts = StoreStock::query()
            ->join('store_stock_standards', function ($join) {
                $join->on('store_stocks.store_id', '=', 'store_stock_standards.store_id')
                    ->on('store_stocks.item_id', '=', 'store_stock_standards.item_id');
            })
            ->whereRaw('store_stocks.quantity < store_stock_standards.standard_quantity')
            ->count();

        // 7 Months Trend for Requests vs PO
        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthStart = $month->copy()->startOfMonth();
            $monthEnd = $month->copy()->endOfMonth();

            $reqCount = PurchaseRequest::query()->whereBetween('created_at', [$monthStart, $monthEnd])->count();
            $poCount = PurchaseOrder::query()->whereBetween('created_at', [$monthStart, $monthEnd])->count();

            $monthlyTrend[] = [
                'month' => $month->translatedFormat('M'),
                'requests' => $reqCount,
                'orders' => $poCount,
            ];
        }

        // Status Distribution
        $requestStatusDist = [
            ['name' => 'Menunggu Review', 'count' => $pendingRequests, 'color' => '#f59e0b'],
            ['name' => 'Disetujui/Proses', 'count' => $processedRequests, 'color' => '#6366f1'],
            ['name' => 'Pesanan Aktif', 'count' => $activeOrders, 'color' => '#8b5cf6'],
            ['name' => 'Selesai/Diterima', 'count' => $completedOrders, 'color' => '#10b981'],
        ];

        // Recent Requests (last 5)
        $recentRequests = PurchaseRequest::query()
            ->with(['store:id,name,code', 'requester:id,name'])
            ->latest()
            ->take(5)
            ->get(['id', 'number', 'store_id', 'requested_by', 'status', 'created_at']);

        // Recent POs (last 5)
        $recentOrders = PurchaseOrder::query()
            ->with(['supplier:id,name'])
            ->latest()
            ->take(5)
            ->get(['id', 'number', 'supplier_id', 'status', 'order_date', 'expected_date']);

        return Inertia::render('central/dashboard', [
            'metrics' => [
                'pendingRequests' => $pendingRequests,
                'processedRequests' => $processedRequests,
                'activeOrders' => $activeOrders,
                'completedOrders' => $completedOrders,
                'stockAlerts' => $stockAlerts,
            ],
            'monthlyTrend' => $monthlyTrend,
            'requestStatusDist' => $requestStatusDist,
            'recentRequests' => $recentRequests,
            'recentOrders' => $recentOrders,
        ]);
    }
}

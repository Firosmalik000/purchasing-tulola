<?php

namespace App\Http\Controllers\Store;

use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestStatus;
use App\Enums\ReceiptStatus;
use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\Receipt;
use App\Models\StoreStock;
use App\Models\StoreStockStandard;
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

        $myDrafts = PurchaseRequest::query()->whereIn('store_id', $storeIds)->where('status', PurchaseRequestStatus::DRAFT)->count();
        $submittedRequests = PurchaseRequest::query()->whereIn('store_id', $storeIds)->where('status', PurchaseRequestStatus::SUBMITTED)->count();
        $processedRequests = PurchaseRequest::query()->whereIn('store_id', $storeIds)->where('status', PurchaseRequestStatus::PROCESSED)->count();

        // Incoming POs waiting for receipt
        $incomingOrders = PurchaseOrder::query()
            ->whereIn('status', [PurchaseOrderStatus::WAITING_RECEIPT, PurchaseOrderStatus::PARTIALLY_RECEIVED])
            ->whereHas('items.allocations.purchaseRequestItem.purchaseRequest', fn ($q) => $q->whereIn('store_id', $storeIds))
            ->count();

        // Completed receipts
        $confirmedReceipts = Receipt::query()->whereIn('store_id', $storeIds)->where('status', ReceiptStatus::CONFIRMED)->count();

        // Stock below standard in assigned stores
        $lowStockCount = StoreStock::query()
            ->whereIn('store_stocks.store_id', $storeIds)
            ->join('store_stock_standards', function ($join) {
                $join->on('store_stocks.store_id', '=', 'store_stock_standards.store_id')
                    ->on('store_stocks.item_id', '=', 'store_stock_standards.item_id');
            })
            ->whereRaw('store_stocks.quantity < store_stock_standards.standard_quantity')
            ->count();

        // Trend requests last 6 months
        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthStart = $month->copy()->startOfMonth();
            $monthEnd = $month->copy()->endOfMonth();

            $reqCount = PurchaseRequest::query()->whereIn('store_id', $storeIds)->whereBetween('created_at', [$monthStart, $monthEnd])->count();
            $recCount = Receipt::query()->whereIn('store_id', $storeIds)->whereBetween('created_at', [$monthStart, $monthEnd])->count();

            $monthlyTrend[] = [
                'month' => $month->translatedFormat('M'),
                'requests' => $reqCount,
                'receipts' => $recCount,
            ];
        }

        // Recent Requests
        $recentRequests = PurchaseRequest::query()
            ->whereIn('store_id', $storeIds)
            ->with(['store:id,name,code'])
            ->latest()
            ->take(5)
            ->get(['id', 'number', 'store_id', 'status', 'required_date', 'created_at']);

        // Recent Receipts
        $recentReceipts = Receipt::query()
            ->whereIn('store_id', $storeIds)
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
            'monthlyTrend' => $monthlyTrend,
            'recentRequests' => $recentRequests,
            'recentReceipts' => $recentReceipts,
        ]);
    }
}

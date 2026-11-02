<?php

namespace Tests\Feature;

use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\Receipt;
use App\Models\StoreStock;
use App\Models\User;
use Database\Seeders\LocalDashboardDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class LocalDashboardSimulationTest extends TestCase
{
    use RefreshDatabase;

    public function test_real_workflow_data_reconciles_with_both_dashboards_and_inventory(): void
    {
        Mail::fake();
        $this->seed(LocalDashboardDemoSeeder::class);
        $this->assertDatabaseCount('purchase_requests', 13);
        $this->assertDatabaseCount('purchase_orders', 6);
        $this->assertDatabaseCount('receipts', 4);
        $this->assertDatabaseCount('stock_movements', 12);

        $admin = User::where('email', 'demo.admin@tulola.test')->firstOrFail();
        $central = $this->actingAs($admin)->get(route('central.dashboard'))->assertOk()->viewData('page')['props'];
        $this->assertSame(['pendingRequests' => 3, 'processedRequests' => 7, 'activeOrders' => 3, 'completedOrders' => 2, 'stockAlerts' => 2], $central['metrics']);
        $this->assertSame(11, collect($central['requestStatusDist'])->sum('count'));
        $this->assertSame(['Draft' => 1, 'Diajukan' => 2, 'Disetujui' => 6, 'Ditolak' => 1, 'Dibatalkan' => 1], collect($central['requestStatusDist'])->pluck('count', 'name')->all());
        $this->assertSame(10, collect($central['monthlyTrend'])->last()['requests']);
        $this->assertSame(2, collect($central['monthlyTrend'])->last()['orders']);
        $this->assertSame('Demo Item Rutin', $central['topRequestedItems'][0]['name']);
        $this->assertSame(5, $central['topRequestedItems'][0]['request_count']);
        $this->assertSame(28, $central['topRequestedItems'][0]['total_quantity']);
        $this->assertSame('Demo Item Karton', $central['topRequestedItems'][1]['name']);
        $combined = PurchaseOrder::whereNull('purchase_request_id')->firstOrFail();
        $combinedRow = collect($central['recentOrders'])->firstWhere('id', $combined->id);
        $this->assertCount(2, $combinedRow['sources']);

        $a = $this->actingAs(User::where('email', 'demo.a@tulola.test')->firstOrFail())->get(route('store.dashboard'))->assertOk()->viewData('page')['props'];
        $this->assertSame(1, $a['metrics']['myDrafts']);
        $this->assertSame(2, $a['metrics']['submittedRequests']);
        $this->assertSame(3, $a['metrics']['incomingOrders']);
        $this->assertSame(3, $a['metrics']['confirmedReceipts']);
        $this->assertSame(6, collect($a['monthlyTrend'])->last()['requests']);
        $this->assertSame(1, collect($a['monthlyTrend'])->last()['orders']);
        $this->assertSame(4, $a['topRequestedItems'][0]['request_count']);
        $this->assertSame(26, $a['topRequestedItems'][0]['total_quantity']);
        $this->assertNotEmpty($a['recentReceipts'][0]['purchase_order']['number']);

        $b = $this->actingAs(User::where('email', 'demo.b@tulola.test')->firstOrFail())->get(route('store.dashboard'))->assertOk()->viewData('page')['props'];
        $this->assertSame(0, $b['metrics']['myDrafts']);
        $this->assertSame(1, $b['metrics']['submittedRequests']);
        $this->assertSame(0, $b['metrics']['incomingOrders']);
        $this->assertSame(1, $b['metrics']['confirmedReceipts']);
        $this->assertSame('Demo Item Karton', $b['topRequestedItems'][0]['name']);
        $this->assertSame(9, $b['topRequestedItems'][0]['total_quantity']);

        foreach ([['HO-JKT', 'DEMO-FREQ', 988], ['HO-JKT', 'DEMO-BULK', 993], ['DEMO-A', 'DEMO-FREQ', 12], ['DEMO-B', 'DEMO-BULK', 7]] as [$store, $sku, $quantity]) {
            $stock = StoreStock::whereHas('store', fn ($q) => $q->where('code', $store))->whereHas('item', fn ($q) => $q->where('sku', $sku))->firstOrFail();
            $this->assertSame($quantity, $stock->quantity);
            $this->assertSame($quantity * 1000, $stock->total_value);
        }

        $previous = now()->subMonthNoOverflow();
        $past = $this->actingAs($admin)->get(route('central.dashboard', ['month' => $previous->month, 'year' => $previous->year]))->assertOk()->viewData('page')['props'];
        $this->assertSame(3, $past['metrics']['pendingRequests']);
        $this->assertSame(3, $past['metrics']['activeOrders']);
        $this->assertSame(2, collect($past['requestStatusDist'])->sum('count'));
        $this->assertSame(2, collect($past['monthlyTrend'])->last()['requests']);
        $this->assertSame(0, collect($past['monthlyTrend'])->last()['orders']);

        $this->seed(LocalDashboardDemoSeeder::class);
        $this->assertSame(13, PurchaseRequest::count());
        $this->assertSame(6, PurchaseOrder::count());
        $this->assertSame(4, Receipt::count());
        Mail::assertNothingSent();
    }
}

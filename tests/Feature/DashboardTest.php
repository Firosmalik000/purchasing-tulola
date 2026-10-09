<?php

namespace Tests\Feature;

use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemType;
use App\Enums\UserRole;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\Store;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_store_pic_is_sent_to_store_dashboard(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->get(route('dashboard'))->assertRedirect(route('store.dashboard'));
        $this->get(route('store.dashboard'))->assertOk();
        $this->get(route('central.dashboard'))->assertForbidden();
    }

    public function test_central_user_is_sent_to_central_dashboard(): void
    {
        $user = User::factory()->centralAdmin()->create();
        $this->actingAs($user);

        $this->get(route('dashboard'))->assertRedirect(route('central.dashboard'));
        $this->get(route('central.dashboard'))->assertOk();
        $this->get(route('store.dashboard'))->assertForbidden();
    }

    public function test_inactive_user_cannot_enter_a_portal(): void
    {
        $user = User::factory()->inactive()->create();
        $this->actingAs($user);

        $this->get(route('dashboard'))->assertRedirect(route('login'));
        $this->assertGuest();
    }

    public function test_super_admin_has_system_management_permissions(): void
    {
        $user = User::factory()->create(['role' => UserRole::SUPER_ADMIN]);

        $this->assertTrue($user->can('manage-stores'));
        $this->assertTrue($user->can('manage-users'));
        $this->assertTrue($user->can('manage-inventory'));
    }

    public function test_central_dashboard_tracks_only_completed_orders_in_trend_and_returns_top_3_items(): void
    {
        $admin = User::factory()->centralAdmin()->create();
        $storeA = Store::factory()->create(['code' => 'STA', 'name' => 'Store Alpha']);
        $storeB = Store::factory()->create(['code' => 'STB', 'name' => 'Store Beta']);

        $unit = Unit::create(['name' => 'Piece', 'symbol' => 'pcs', 'is_active' => true]);
        $cat = ItemCategory::create(['name' => 'Ops', 'code' => 'OPS', 'is_active' => true]);

        $item1 = Item::create(['sku' => 'SKU-1', 'name' => 'Item Satu', 'item_category_id' => $cat->id, 'unit_id' => $unit->id, 'is_active' => true]);
        $item2 = Item::create(['sku' => 'SKU-2', 'name' => 'Item Dua', 'item_category_id' => $cat->id, 'unit_id' => $unit->id, 'is_active' => true]);
        $item3 = Item::create(['sku' => 'SKU-3', 'name' => 'Item Tiga', 'item_category_id' => $cat->id, 'unit_id' => $unit->id, 'is_active' => true]);
        $item4 = Item::create(['sku' => 'SKU-4', 'name' => 'Item Empat', 'item_category_id' => $cat->id, 'unit_id' => $unit->id, 'is_active' => true]);

        // PR for Store A
        $prA = PurchaseRequest::factory()->submitted()->create(['store_id' => $storeA->id]);
        $prA->items()->create(['type' => PurchaseRequestItemType::STOCK, 'item_id' => $item1->id, 'unit_id' => $unit->id, 'requested_quantity' => 50]);
        $prA->items()->create(['type' => PurchaseRequestItemType::STOCK, 'item_id' => $item3->id, 'unit_id' => $unit->id, 'requested_quantity' => 20]);

        // PR for Store B
        $prB = PurchaseRequest::factory()->submitted()->create(['store_id' => $storeB->id]);
        $prB->items()->create(['type' => PurchaseRequestItemType::STOCK, 'item_id' => $item2->id, 'unit_id' => $unit->id, 'requested_quantity' => 35]);
        $prB->items()->create(['type' => PurchaseRequestItemType::STOCK, 'item_id' => $item4->id, 'unit_id' => $unit->id, 'requested_quantity' => 5]);

        // Completed PO (should be tracked in trend)
        PurchaseOrder::create([
            'number' => 'PO-COMPLETED-1',
            'purchase_request_id' => $prA->id,
            'order_date' => now()->toDateString(),
            'status' => PurchaseOrderStatus::COMPLETED,
            'created_by' => $admin->id,
        ]);

        // Active/In-progress PO (should NOT be counted in trend)
        PurchaseOrder::create([
            'number' => 'PO-ORDERED-1',
            'purchase_request_id' => $prB->id,
            'order_date' => now()->toDateString(),
            'status' => PurchaseOrderStatus::ORDERED,
            'created_by' => $admin->id,
        ]);

        $response = $this->actingAs($admin)->get(route('central.dashboard'));
        $response->assertOk();

        $monthlyTrend = $response->viewData('page')['props']['monthlyTrend'];
        $currentMonth = end($monthlyTrend);
        $this->assertSame(1, $currentMonth['orders'], 'Only completed order should be counted in trend');
        $this->assertSame(2, $currentMonth['requests'], 'Both submitted PRs should be counted');

        $topItems = $response->viewData('page')['props']['topRequestedItems'];
        $this->assertCount(3, $topItems);
        $this->assertSame('Item Satu', $topItems[0]['name']);
        $this->assertSame(50, $topItems[0]['total_quantity']);
        $this->assertSame('Item Dua', $topItems[1]['name']);
        $this->assertSame(35, $topItems[1]['total_quantity']);
        $this->assertSame('Item Tiga', $topItems[2]['name']);
        $this->assertSame(20, $topItems[2]['total_quantity']);

        $selectedPeriod = $response->viewData('page')['props']['selectedPeriod'];
        $this->assertSame(now()->month, $selectedPeriod['month']);
        $this->assertSame(now()->year, $selectedPeriod['year']);

        // Test filtering by a past month where there were no requests
        $pastResponse = $this->actingAs($admin)->get(route('central.dashboard', ['month' => 1, 'year' => 2025]));
        $pastResponse->assertOk();
        $this->assertSame(1, $pastResponse->viewData('page')['props']['selectedPeriod']['month']);
        $this->assertSame(2025, $pastResponse->viewData('page')['props']['selectedPeriod']['year']);
        $this->assertSame(0, $pastResponse->viewData('page')['props']['metrics']['pendingRequests']);
        $this->assertCount(0, $pastResponse->viewData('page')['props']['topRequestedItems']);
    }

    public function test_store_dashboard_tracks_only_completed_orders_in_trend_and_scopes_top_items(): void
    {
        $admin = User::factory()->centralAdmin()->create();
        $storeA = Store::factory()->create(['code' => 'STA', 'name' => 'Store Alpha']);
        $storeB = Store::factory()->create(['code' => 'STB', 'name' => 'Store Beta']);

        $picA = User::factory()->create(['role' => UserRole::STORE_PIC]);
        $storeA->users()->attach($picA, ['is_pic' => true, 'is_active' => true]);

        $unit = Unit::create(['name' => 'Piece', 'symbol' => 'pcs', 'is_active' => true]);
        $cat = ItemCategory::create(['name' => 'Ops', 'code' => 'OPS', 'is_active' => true]);

        $item1 = Item::create(['sku' => 'SKU-1', 'name' => 'Item Satu', 'item_category_id' => $cat->id, 'unit_id' => $unit->id, 'is_active' => true]);
        $item2 = Item::create(['sku' => 'SKU-2', 'name' => 'Item Dua', 'item_category_id' => $cat->id, 'unit_id' => $unit->id, 'is_active' => true]);
        $item3 = Item::create(['sku' => 'SKU-3', 'name' => 'Item Tiga', 'item_category_id' => $cat->id, 'unit_id' => $unit->id, 'is_active' => true]);

        // Store A requests
        $prA = PurchaseRequest::factory()->submitted()->create(['store_id' => $storeA->id, 'requested_by' => $picA->id]);
        $prA->items()->create(['type' => PurchaseRequestItemType::STOCK, 'item_id' => $item1->id, 'unit_id' => $unit->id, 'requested_quantity' => 10]);
        $prA->items()->create(['type' => PurchaseRequestItemType::STOCK, 'item_id' => $item3->id, 'unit_id' => $unit->id, 'requested_quantity' => 5]);

        // Store B requests (should not be in Store A dashboard)
        $prB = PurchaseRequest::factory()->submitted()->create(['store_id' => $storeB->id]);
        $prB->items()->create(['type' => PurchaseRequestItemType::STOCK, 'item_id' => $item2->id, 'unit_id' => $unit->id, 'requested_quantity' => 100]);

        // Store A completed order
        PurchaseOrder::create([
            'number' => 'PO-STA-COMPLETED',
            'purchase_request_id' => $prA->id,
            'order_date' => now()->toDateString(),
            'status' => PurchaseOrderStatus::COMPLETED,
            'created_by' => $admin->id,
        ]);

        // Store B completed order
        PurchaseOrder::create([
            'number' => 'PO-STB-COMPLETED',
            'purchase_request_id' => $prB->id,
            'order_date' => now()->toDateString(),
            'status' => PurchaseOrderStatus::COMPLETED,
            'created_by' => $admin->id,
        ]);

        $response = $this->actingAs($picA)->get(route('store.dashboard'));
        $response->assertOk();

        $monthlyTrend = $response->viewData('page')['props']['monthlyTrend'];
        $currentMonth = end($monthlyTrend);
        $this->assertSame(1, $currentMonth['orders'], 'Only Store A completed order should be counted');
        $this->assertSame(1, $currentMonth['requests'], 'Only Store A submitted PR should be counted');

        $topItems = $response->viewData('page')['props']['topRequestedItems'];
        $this->assertCount(2, $topItems);
        $this->assertSame('Item Satu', $topItems[0]['name']);
        $this->assertSame(10, $topItems[0]['total_quantity']);
        $this->assertSame('Item Tiga', $topItems[1]['name']);
        $this->assertSame(5, $topItems[1]['total_quantity']);

        $selectedPeriod = $response->viewData('page')['props']['selectedPeriod'];
        $this->assertSame(now()->month, $selectedPeriod['month']);
        $this->assertSame(now()->year, $selectedPeriod['year']);
    }
}

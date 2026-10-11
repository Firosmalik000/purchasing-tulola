<?php

namespace Tests\Feature\Central;

use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemType;
use App\Enums\StockMovementType;
use App\Enums\UserRole;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\StoreStock;
use App\Models\StoreStockStandard;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use App\Services\CriticalStockService;
use Database\Seeders\ItemCategorySeeder;
use Database\Seeders\ItemSeeder;
use Database\Seeders\UnitSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MasterDataManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_central_admin_can_manage_item_master(): void
    {
        $user = User::factory()->centralAdmin()->create();
        $category = ItemCategory::create(['name' => 'Cleaning', 'code' => 'CLN', 'is_active' => true]);
        $unit = Unit::create(['name' => 'Pack', 'symbol' => 'pack', 'is_active' => true]);

        $this->actingAs($user)->post(route('central.items.store'), [
            'sku' => 'CLN-TISSUE-BASAH', 'name' => 'Tissue Basah',
            'item_category_id' => $category->id, 'unit_id' => $unit->id,
            'cost_price' => 25000, 'min_stock' => 5, 'target_stock' => 20, 'is_active' => true,
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('items', ['sku' => 'CLN-TISSUE-BASAH', 'cost_price' => 25000, 'min_stock' => 5, 'target_stock' => 20]);
        $this->assertDatabaseHas('activity_logs', ['action' => 'item.created']);
    }

    public function test_critical_stock_service_detects_items_at_or_below_min_stock(): void
    {
        $admin = User::factory()->centralAdmin()->create();
        $store = Store::create(['code' => 'HO-JKT', 'name' => 'Head Office Jakarta', 'is_active' => true]);
        $category = ItemCategory::create(['name' => 'Packaging', 'code' => 'PKG', 'is_active' => true]);
        $unit = Unit::create(['name' => 'Pcs', 'symbol' => 'pcs', 'is_active' => true]);

        $item = Item::create([
            'sku' => 'PKG-BOX-01', 'name' => 'Box Perhiasan',
            'item_category_id' => $category->id, 'unit_id' => $unit->id,
            'min_stock' => 10, 'target_stock' => 50, 'is_active' => true,
        ]);

        StoreStock::create([
            'store_id' => $store->id,
            'item_id' => $item->id,
            'quantity' => 4,
        ]);

        // Buat toko cabang dengan stok 0
        $branchStore = Store::create(['code' => 'PP', 'name' => 'Pacific Place', 'is_active' => true]);
        StoreStock::create([
            'store_id' => $branchStore->id,
            'item_id' => $item->id,
            'quantity' => 0,
        ]);

        $summary = app(CriticalStockService::class)->getSummaryForUser($admin);
        // Hanya mendeteksi stok Gudang Pusat (HO-JKT), cabang (PP) tidak diikutkan
        $this->assertEquals(1, $summary['count']);
        $this->assertEquals('PKG-BOX-01', $summary['items'][0]['sku']);
        $this->assertEquals($store->id, $summary['items'][0]['store_id']);
        $this->assertEquals(4, $summary['items'][0]['current_stock']);
        $this->assertEquals(10, $summary['items'][0]['min_stock']);
        $this->assertEquals(50, $summary['items'][0]['target_stock']);

        // Akun Store PIC tidak menerima notifikasi stok kritis karena cabang tidak tracking stok
        $pic = User::factory()->storePic()->create();
        $picSummary = app(CriticalStockService::class)->getSummaryForUser($pic);
        $this->assertEquals(0, $picSummary['count']);
        $this->assertEmpty($picSummary['items']);
    }

    public function test_store_pic_cannot_manage_master_data(): void
    {
        $this->actingAs(User::factory()->create())->post(route('central.item-categories.store'), [
            'name' => 'Blocked', 'code' => 'BLK', 'is_active' => true,
        ])->assertForbidden();
    }

    public function test_item_cost_and_minimum_stock_must_be_whole_numbers(): void
    {
        $user = User::factory()->centralAdmin()->create();
        $category = ItemCategory::create(['name' => 'Cleaning', 'code' => 'CLN', 'is_active' => true]);
        $unit = Unit::create(['name' => 'Pack', 'symbol' => 'pack', 'is_active' => true]);

        $this->actingAs($user)->post(route('central.items.store'), [
            'sku' => 'CLN-FRACTIONAL',
            'name' => 'Fractional Item',
            'item_category_id' => $category->id,
            'unit_id' => $unit->id,
            'cost_price' => '25000.50',
            'min_stock' => '2.99',
            'is_active' => true,
        ])->assertSessionHasErrors(['cost_price', 'min_stock']);

        $this->assertDatabaseMissing('items', ['sku' => 'CLN-FRACTIONAL']);
    }

    public function test_duplicate_sku_is_rejected(): void
    {
        $user = User::factory()->centralAdmin()->create();
        $category = ItemCategory::create(['name' => 'ATK', 'code' => 'ATK', 'is_active' => true]);
        $unit = Unit::create(['name' => 'Pcs', 'symbol' => 'pcs', 'is_active' => true]);
        Item::create(['sku' => 'ATK-001', 'name' => 'Pen', 'item_category_id' => $category->id, 'unit_id' => $unit->id, 'is_active' => true]);

        $this->actingAs($user)->post(route('central.items.store'), [
            'sku' => 'ATK-001', 'name' => 'Duplicate', 'item_category_id' => $category->id, 'unit_id' => $unit->id, 'is_active' => true,
        ])->assertSessionHasErrors('sku');
    }

    public function test_starter_seeders_are_idempotent_and_do_not_seed_prices(): void
    {
        $this->seed([UnitSeeder::class, ItemCategorySeeder::class, ItemSeeder::class]);
        $this->seed([UnitSeeder::class, ItemCategorySeeder::class, ItemSeeder::class]);

        $this->assertDatabaseCount('item_categories', 6);
        $this->assertDatabaseCount('units', 8);
        $this->assertDatabaseCount('items', 32);
        $this->assertFalse(
            collect((new Item)->getConnection()->getSchemaBuilder()->getColumnListing('items'))->contains('price'),
        );
    }

    public function test_purchasing_user_can_create_supplier(): void
    {
        $user = User::factory()->create(['role' => UserRole::PURCHASING]);
        $this->actingAs($user)->post(route('central.suppliers.store'), [
            'code' => 'SUP-001', 'name' => 'Supplier Satu', 'email' => 'sales@example.com', 'is_active' => true,
        ])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('suppliers', ['code' => 'SUP-001']);
    }

    public function test_central_admin_can_update_and_deactivate_master_data(): void
    {
        $user = User::factory()->centralAdmin()->create();
        $category = ItemCategory::create(['name' => 'Old', 'code' => 'OLD', 'is_active' => true]);
        $unit = Unit::create(['name' => 'Old Unit', 'symbol' => 'old', 'is_active' => true]);
        $item = Item::create(['sku' => 'OLD-001', 'name' => 'Old Item', 'item_category_id' => $category->id, 'unit_id' => $unit->id, 'is_active' => true]);
        $supplier = Supplier::create(['code' => 'OLD-SUP', 'name' => 'Old Supplier', 'is_active' => true]);

        $this->actingAs($user)->put(route('central.items.update', $item), [
            'sku' => 'UPD-001', 'name' => 'Updated Item', 'item_category_id' => $category->id,
            'unit_id' => $unit->id, 'is_active' => false,
        ])->assertSessionHasNoErrors();
        $this->actingAs($user)->put(route('central.item-categories.update', $category), [
            'name' => 'Updated Category', 'code' => 'UPD', 'is_active' => false,
        ])->assertSessionHasNoErrors();
        $this->actingAs($user)->put(route('central.units.update', $unit), [
            'name' => 'Updated Unit', 'symbol' => 'upd', 'is_active' => false,
        ])->assertSessionHasNoErrors();
        $this->actingAs($user)->put(route('central.suppliers.update', $supplier), [
            'code' => 'UPD-SUP', 'name' => 'Updated Supplier', 'contact_person' => 'Contact',
            'phone' => '08123456789', 'email' => 'supplier@example.com', 'address' => 'Jakarta',
            'is_active' => false,
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('item_categories', ['id' => $category->id, 'code' => 'UPD', 'is_active' => false]);
        $this->assertDatabaseHas('units', ['id' => $unit->id, 'symbol' => 'upd', 'is_active' => false]);
        $this->assertDatabaseHas('items', ['id' => $item->id, 'sku' => 'UPD-001', 'is_active' => false]);
        $this->assertDatabaseHas('suppliers', ['id' => $supplier->id, 'code' => 'UPD-SUP', 'is_active' => false]);
        $this->assertDatabaseHas('activity_logs', ['action' => 'item_category.updated', 'entity_id' => $category->id]);
        $this->assertDatabaseHas('activity_logs', ['action' => 'unit.updated', 'entity_id' => $unit->id]);
        $this->assertDatabaseHas('activity_logs', ['action' => 'item.updated', 'entity_id' => $item->id]);
        $this->assertDatabaseHas('activity_logs', ['action' => 'supplier.updated', 'entity_id' => $supplier->id]);
    }

    public function test_central_admin_can_delete_unused_item(): void
    {
        $user = User::factory()->centralAdmin()->create();
        $category = ItemCategory::create(['name' => 'Tools', 'code' => 'TLS', 'is_active' => true]);
        $unit = Unit::create(['name' => 'Pcs', 'symbol' => 'pcs', 'is_active' => true]);
        $item = Item::create([
            'sku' => 'TLS-DEL-01',
            'name' => 'Item to Delete',
            'item_category_id' => $category->id,
            'unit_id' => $unit->id,
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->delete(route('central.items.destroy', $item))
            ->assertRedirect()
            ->assertSessionHas('success', 'Item berhasil dihapus.');

        $this->assertDatabaseMissing('items', ['id' => $item->id]);
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'item.deleted',
            'entity_id' => $item->id,
        ]);
    }

    public function test_central_admin_can_delete_item_with_zero_stock_and_standards(): void
    {
        $user = User::factory()->centralAdmin()->create();
        $store = Store::create(['code' => 'HO-JKT', 'name' => 'Head Office Jakarta', 'is_active' => true]);
        $category = ItemCategory::create(['name' => 'Hardware', 'code' => 'HDW', 'is_active' => true]);
        $unit = Unit::create(['name' => 'Pcs', 'symbol' => 'pcs', 'is_active' => true]);
        $item = Item::create([
            'sku' => 'HDW-ZERO-01',
            'name' => 'Zero Stock Item',
            'item_category_id' => $category->id,
            'unit_id' => $unit->id,
            'is_active' => true,
        ]);

        StoreStock::create([
            'store_id' => $store->id,
            'item_id' => $item->id,
            'quantity' => 0,
        ]);

        StoreStockStandard::create([
            'store_id' => $store->id,
            'item_id' => $item->id,
            'standard_quantity' => 10,
        ]);

        $this->actingAs($user)
            ->delete(route('central.items.destroy', $item))
            ->assertRedirect()
            ->assertSessionHas('success', 'Item berhasil dihapus.');

        $this->assertDatabaseMissing('items', ['id' => $item->id]);
        $this->assertDatabaseMissing('store_stocks', ['item_id' => $item->id]);
        $this->assertDatabaseMissing('store_stock_standards', ['item_id' => $item->id]);
    }

    public function test_central_admin_cannot_delete_item_with_active_positive_stock(): void
    {
        $user = User::factory()->centralAdmin()->create();
        $store = Store::create(['code' => 'HO-JKT', 'name' => 'Head Office Jakarta', 'is_active' => true]);
        $category = ItemCategory::create(['name' => 'Packaging', 'code' => 'PKG', 'is_active' => true]);
        $unit = Unit::create(['name' => 'Pcs', 'symbol' => 'pcs', 'is_active' => true]);
        $item = Item::create([
            'sku' => 'PKG-LOCKED',
            'name' => 'Locked Item',
            'item_category_id' => $category->id,
            'unit_id' => $unit->id,
            'is_active' => true,
        ]);

        StoreStock::create([
            'store_id' => $store->id,
            'item_id' => $item->id,
            'quantity' => 10,
        ]);

        $this->actingAs($user)
            ->delete(route('central.items.destroy', $item))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('items', ['id' => $item->id]);
    }

    public function test_central_admin_cannot_delete_item_referenced_by_purchase_request(): void
    {
        $user = User::factory()->centralAdmin()->create();
        $store = Store::create(['code' => 'HO-JKT', 'name' => 'Head Office Jakarta', 'is_active' => true]);
        $category = ItemCategory::create(['name' => 'Cleaning', 'code' => 'CLN', 'is_active' => true]);
        $unit = Unit::create(['name' => 'Pcs', 'symbol' => 'pcs', 'is_active' => true]);
        $item = Item::create([
            'sku' => 'CLN-PR-LOCKED',
            'name' => 'Item in PR',
            'item_category_id' => $category->id,
            'unit_id' => $unit->id,
            'is_active' => true,
        ]);

        $pr = PurchaseRequest::factory()->create([
            'store_id' => $store->id,
            'requested_by' => $user->id,
        ]);

        PurchaseRequestItem::create([
            'purchase_request_id' => $pr->id,
            'type' => PurchaseRequestItemType::STOCK,
            'item_id' => $item->id,
            'unit_id' => $unit->id,
            'requested_quantity' => 5,
        ]);

        $this->actingAs($user)
            ->delete(route('central.items.destroy', $item))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('items', ['id' => $item->id]);
    }

    public function test_central_admin_cannot_delete_item_referenced_by_purchase_order(): void
    {
        $user = User::factory()->centralAdmin()->create();
        $supplier = Supplier::create(['code' => 'SUP-PO', 'name' => 'Supplier PO', 'is_active' => true]);
        $category = ItemCategory::create(['name' => 'Stationery', 'code' => 'STY', 'is_active' => true]);
        $unit = Unit::create(['name' => 'Pcs', 'symbol' => 'pcs', 'is_active' => true]);
        $item = Item::create([
            'sku' => 'STY-PO-LOCKED',
            'name' => 'Item in PO',
            'item_category_id' => $category->id,
            'unit_id' => $unit->id,
            'is_active' => true,
        ]);

        $po = PurchaseOrder::factory()->create([
            'created_by' => $user->id,
        ]);

        PurchaseOrderItem::create([
            'purchase_order_id' => $po->id,
            'item_type' => 'STOCK',
            'item_id' => $item->id,
            'unit_id' => $unit->id,
            'quantity' => 2,
            'unit_price' => 25000,
            'total' => 50000,
        ]);

        $this->actingAs($user)
            ->delete(route('central.items.destroy', $item))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('items', ['id' => $item->id]);
    }

    public function test_central_admin_cannot_delete_item_with_stock_movement_history(): void
    {
        $user = User::factory()->centralAdmin()->create();
        $store = Store::create(['code' => 'HO-JKT', 'name' => 'Head Office Jakarta', 'is_active' => true]);
        $category = ItemCategory::create(['name' => 'Materials', 'code' => 'MAT', 'is_active' => true]);
        $unit = Unit::create(['name' => 'Gr', 'symbol' => 'gr', 'is_active' => true]);
        $item = Item::create([
            'sku' => 'MAT-MV-LOCKED',
            'name' => 'Item with Movement',
            'item_category_id' => $category->id,
            'unit_id' => $unit->id,
            'is_active' => true,
        ]);

        StockMovement::create([
            'store_id' => $store->id,
            'item_id' => $item->id,
            'previous_quantity' => 0,
            'new_quantity' => 0,
            'quantity_difference' => 0,
            'movement_type' => StockMovementType::CORRECTION->value,
            'reason' => 'Opname saldo nol',
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->delete(route('central.items.destroy', $item))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('items', ['id' => $item->id]);
    }

    public function test_store_pic_cannot_delete_item(): void
    {
        $pic = User::factory()->storePic()->create();
        $category = ItemCategory::create(['name' => 'Stationery', 'code' => 'STY', 'is_active' => true]);
        $unit = Unit::create(['name' => 'Pcs', 'symbol' => 'pcs', 'is_active' => true]);
        $item = Item::create([
            'sku' => 'STY-001',
            'name' => 'Protected Item',
            'item_category_id' => $category->id,
            'unit_id' => $unit->id,
            'is_active' => true,
        ]);

        $this->actingAs($pic)
            ->delete(route('central.items.destroy', $item))
            ->assertForbidden();

        $this->assertDatabaseHas('items', ['id' => $item->id]);
    }

    public function test_unauthenticated_user_cannot_delete_item(): void
    {
        $category = ItemCategory::create(['name' => 'Stationery', 'code' => 'STY', 'is_active' => true]);
        $unit = Unit::create(['name' => 'Pcs', 'symbol' => 'pcs', 'is_active' => true]);
        $item = Item::create([
            'sku' => 'STY-GUEST',
            'name' => 'Guest Protected Item',
            'item_category_id' => $category->id,
            'unit_id' => $unit->id,
            'is_active' => true,
        ]);

        $this->delete(route('central.items.destroy', $item))
            ->assertRedirect(route('login'));

        $this->assertDatabaseHas('items', ['id' => $item->id]);
    }
}

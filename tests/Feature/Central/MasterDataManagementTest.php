<?php

namespace Tests\Feature\Central;

use App\Enums\UserRole;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
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
            'cost_price' => 25000, 'min_stock' => 5, 'is_active' => true,
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('items', ['sku' => 'CLN-TISSUE-BASAH', 'cost_price' => 25000, 'min_stock' => 5]);
        $this->assertDatabaseHas('activity_logs', ['action' => 'item.created']);
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
}

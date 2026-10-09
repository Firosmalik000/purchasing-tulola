<?php

namespace Tests\Feature\Central;

use App\Enums\StockMovementType;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\Store;
use App\Models\StoreStock;
use App\Models\StoreStockStandard;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_central_stock_update_creates_movement_with_actor_and_difference(): void
    {
        [$store, $item] = $this->inventoryContext();
        $admin = User::factory()->centralAdmin()->create();

        $this->actingAs($admin)->put(route('central.inventory.stock.update'), [
            'store_id' => $store->id, 'item_id' => $item->id, 'quantity' => '19.000',
            'movement_type' => StockMovementType::OPENING_BALANCE->value, 'reason' => 'Saldo awal',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('store_stocks', ['store_id' => $store->id, 'item_id' => $item->id, 'quantity' => 19]);
        $this->assertDatabaseHas('stock_movements', ['previous_quantity' => 0, 'new_quantity' => 19, 'quantity_difference' => 19, 'created_by' => $admin->id]);
    }

    public function test_standard_update_is_separate_and_audited(): void
    {
        [$store, $item] = $this->inventoryContext();
        $admin = User::factory()->centralAdmin()->create();
        $this->actingAs($admin)->put(route('central.inventory.standard.update'), [
            'store_id' => $store->id, 'item_id' => $item->id, 'standard_quantity' => '68.000',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('store_stock_standards', ['standard_quantity' => 68]);
        $this->assertDatabaseCount('stock_movements', 0);
        $this->assertDatabaseHas('activity_logs', ['action' => 'stock_standard.updated']);
    }

    public function test_stock_update_records_supplier_cost_and_total_value(): void
    {
        [$store, $item] = $this->inventoryContext();
        $admin = User::factory()->centralAdmin()->create();
        $supplier = Supplier::create(['code' => 'SUP-01', 'name' => 'Supplier Stok', 'is_active' => true]);

        $this->actingAs($admin)->put(route('central.inventory.stock.update'), [
            'store_id' => $store->id, 'item_id' => $item->id, 'quantity' => '10.000',
            'supplier_id' => $supplier->id, 'unit_cost' => '12500.00',
            'movement_type' => StockMovementType::OPENING_BALANCE->value, 'reason' => 'Stok masuk',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('store_stocks', [
            'store_id' => $store->id, 'item_id' => $item->id,
            'quantity' => 10, 'average_unit_cost' => 12500, 'total_value' => 125000,
        ]);
        $this->assertDatabaseHas('stock_movements', [
            'supplier_id' => $supplier->id, 'unit_cost' => 12500,
            'movement_value' => 125000, 'new_value' => 125000,
        ]);
    }

    public function test_fractional_stock_reduction_preserves_negative_movement_and_value(): void
    {
        [$store, $item] = $this->inventoryContext();
        $admin = User::factory()->centralAdmin()->create();

        $this->actingAs($admin)->put(route('central.inventory.stock.update'), [
            'store_id' => $store->id, 'item_id' => $item->id, 'quantity' => '1.000',
            'unit_cost' => '100.00', 'movement_type' => StockMovementType::OPENING_BALANCE->value,
            'reason' => 'Saldo awal',
        ])->assertSessionHasNoErrors();

        $this->actingAs($admin)->put(route('central.inventory.stock.update'), [
            'store_id' => $store->id, 'item_id' => $item->id, 'quantity' => '0.500',
            'movement_type' => StockMovementType::CORRECTION->value, 'reason' => 'Koreksi setengah unit',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('store_stocks', [
            'store_id' => $store->id, 'item_id' => $item->id,
            'quantity' => 0.5, 'average_unit_cost' => 100, 'total_value' => 50,
        ]);
        $this->assertDatabaseHas('stock_movements', [
            'new_quantity' => 0.5, 'quantity_difference' => -0.5,
            'movement_value' => -50, 'previous_value' => 100, 'new_value' => 50,
        ]);
    }

    public function test_store_pic_cannot_update_stock_or_standard(): void
    {
        [$store, $item] = $this->inventoryContext();
        $pic = User::factory()->create();
        $store->users()->attach($pic, ['is_pic' => true, 'is_active' => true]);

        $payload = ['store_id' => $store->id, 'item_id' => $item->id, 'quantity' => 5, 'movement_type' => 'MANUAL_UPDATE', 'reason' => 'Blocked'];
        $this->actingAs($pic)->put(route('central.inventory.stock.update'), $payload)->assertForbidden();
        $this->actingAs($pic)->put(route('central.inventory.standard.update'), ['store_id' => $store->id, 'item_id' => $item->id, 'standard_quantity' => 10])->assertForbidden();
    }

    public function test_store_pic_can_only_view_assigned_store_inventory(): void
    {
        [$store] = $this->inventoryContext();
        $other = Store::factory()->create();
        $pic = User::factory()->create();
        $store->users()->attach($pic, ['is_pic' => true, 'is_active' => true]);

        $this->actingAs($pic)->get(route('store.inventory.index', ['store_id' => $store->id]))->assertOk();
        $this->actingAs($pic)->get(route('store.inventory.index', ['store_id' => $other->id]))->assertForbidden();
    }

    public function test_duplicate_store_item_stock_and_standard_are_database_rejected(): void
    {
        [$store, $item] = $this->inventoryContext();
        StoreStock::create(['store_id' => $store->id, 'item_id' => $item->id, 'quantity' => 1]);
        StoreStockStandard::create(['store_id' => $store->id, 'item_id' => $item->id, 'standard_quantity' => 2]);

        $this->expectException(QueryException::class);
        StoreStock::create(['store_id' => $store->id, 'item_id' => $item->id, 'quantity' => 3]);
    }

    /** @return array{Store, Item} */
    private function inventoryContext(): array
    {
        $store = Store::factory()->create();
        $category = ItemCategory::create(['name' => 'Cleaning', 'code' => 'CLN', 'is_active' => true]);
        $unit = Unit::create(['name' => 'Pack', 'symbol' => 'pack', 'is_active' => true]);
        $item = Item::create(['sku' => 'CLN-TISSUE-BASAH', 'name' => 'Tissue Basah', 'item_category_id' => $category->id, 'unit_id' => $unit->id, 'is_active' => true]);

        return [$store, $item];
    }
}

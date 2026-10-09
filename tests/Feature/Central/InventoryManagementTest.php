<?php

namespace Tests\Feature\Central;

use App\Enums\StockMovementType;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\StockMovement;
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
            'store_id' => $store->id, 'item_id' => $item->id, 'quantity' => '19',
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
            'store_id' => $store->id, 'item_id' => $item->id, 'standard_quantity' => '68',
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
            'store_id' => $store->id, 'item_id' => $item->id, 'quantity' => '10',
            'supplier_id' => $supplier->id, 'unit_cost' => '12500',
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

    public function test_stock_reduction_preserves_negative_movement_and_value(): void
    {
        [$store, $item] = $this->inventoryContext();
        $admin = User::factory()->centralAdmin()->create();

        $this->actingAs($admin)->put(route('central.inventory.stock.update'), [
            'store_id' => $store->id, 'item_id' => $item->id, 'quantity' => '2',
            'unit_cost' => '100', 'movement_type' => StockMovementType::OPENING_BALANCE->value,
            'reason' => 'Saldo awal',
        ])->assertSessionHasNoErrors();

        $this->actingAs($admin)->put(route('central.inventory.stock.update'), [
            'store_id' => $store->id, 'item_id' => $item->id, 'quantity' => '1',
            'movement_type' => StockMovementType::CORRECTION->value, 'reason' => 'Koreksi satu unit',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('store_stocks', [
            'store_id' => $store->id, 'item_id' => $item->id,
            'quantity' => 1, 'average_unit_cost' => 100, 'total_value' => 100,
        ]);
        $this->assertDatabaseHas('stock_movements', [
            'new_quantity' => 1, 'quantity_difference' => -1,
            'movement_value' => -100, 'previous_value' => 200, 'new_value' => 100,
        ]);
    }

    public function test_stock_standard_and_unit_cost_must_be_whole_numbers(): void
    {
        [$store, $item] = $this->inventoryContext();
        $admin = User::factory()->centralAdmin()->create();

        $this->actingAs($admin)->put(route('central.inventory.stock.update'), [
            'store_id' => $store->id,
            'item_id' => $item->id,
            'quantity' => '2.99',
            'unit_cost' => '12500.50',
            'movement_type' => StockMovementType::CORRECTION->value,
            'reason' => 'Koreksi',
        ])->assertSessionHasErrors(['quantity', 'unit_cost']);

        $this->actingAs($admin)->put(route('central.inventory.standard.update'), [
            'store_id' => $store->id,
            'item_id' => $item->id,
            'standard_quantity' => '3.5',
        ])->assertSessionHasErrors('standard_quantity');

        $this->assertDatabaseCount('store_stocks', 0);
        $this->assertDatabaseCount('store_stock_standards', 0);
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

    public function test_bulk_stock_addition_increments_multiple_items_and_uses_master_price_fallback(): void
    {
        [$store, $item1] = $this->inventoryContext();
        $admin = User::factory()->centralAdmin()->create();
        $category = ItemCategory::first();
        $unit = Unit::first();
        $item2 = Item::create([
            'sku' => 'CLN-SABUN-01', 'name' => 'Sabun Cuci',
            'item_category_id' => $category->id, 'unit_id' => $unit->id,
            'cost_price' => 50000, 'min_stock' => 10, 'is_active' => true,
        ]);
        $supplier = Supplier::create(['code' => 'SUP-BULK', 'name' => 'Supplier Bulk', 'is_active' => true]);

        // item1 has no initial cost_price, but we provide unit_cost = 15000
        // item2 has master cost_price = 50000, and we leave unit_cost empty
        $response = $this->actingAs($admin)->post(route('central.inventory.stock.bulk'), [
            'store_id' => $store->id,
            'movement_type' => StockMovementType::STOCK_IN->value,
            'reason' => 'Pengiriman kolektif dari pusat',
            'supplier_id' => $supplier->id,
            'items' => [
                ['item_id' => $item1->id, 'quantity' => 10, 'unit_cost' => 15000],
                ['item_id' => $item2->id, 'quantity' => 5, 'unit_cost' => null],
            ],
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('store_stocks', [
            'store_id' => $store->id, 'item_id' => $item1->id,
            'quantity' => 10, 'average_unit_cost' => 15000, 'total_value' => 150000,
        ]);
        $this->assertDatabaseHas('store_stocks', [
            'store_id' => $store->id, 'item_id' => $item2->id,
            'quantity' => 5, 'average_unit_cost' => 50000, 'total_value' => 250000,
        ]);
        $this->assertDatabaseHas('stock_movements', [
            'store_id' => $store->id, 'item_id' => $item1->id,
            'movement_type' => StockMovementType::STOCK_IN->value,
            'quantity_difference' => 10, 'unit_cost' => 15000,
        ]);
        $this->assertDatabaseHas('stock_movements', [
            'store_id' => $store->id, 'item_id' => $item2->id,
            'movement_type' => StockMovementType::STOCK_IN->value,
            'quantity_difference' => 5, 'unit_cost' => 50000,
        ]);
    }

    public function test_store_pic_cannot_perform_bulk_stock_addition(): void
    {
        [$store, $item] = $this->inventoryContext();
        $pic = User::factory()->create();
        $store->users()->attach($pic, ['is_pic' => true, 'is_active' => true]);

        $payload = [
            'store_id' => $store->id,
            'movement_type' => StockMovementType::STOCK_IN->value,
            'reason' => 'Attempted bulk',
            'items' => [['item_id' => $item->id, 'quantity' => 10]],
        ];
        $this->actingAs($pic)->post(route('central.inventory.stock.bulk'), $payload)->assertForbidden();
    }

    public function test_central_inventory_index_locks_to_central_store_and_filters_movements_by_month_date_range(): void
    {
        $admin = User::factory()->centralAdmin()->create();
        $centralStore = Store::factory()->create(['code' => 'HO-JKT', 'name' => 'Head Office Jakarta']);
        $branchStore = Store::factory()->create(['code' => 'PP', 'name' => 'Pacific Place']);

        $category = ItemCategory::create(['name' => 'Stationery', 'code' => 'STN', 'is_active' => true]);
        $unit = Unit::create(['name' => 'Pcs', 'symbol' => 'pcs', 'is_active' => true]);
        $item = Item::create(['sku' => 'STN-PULPEN', 'name' => 'Pulpen Hitam', 'item_category_id' => $category->id, 'unit_id' => $unit->id, 'is_active' => true]);

        // Movement for central store within current month
        $m1 = new StockMovement([
            'store_id' => $centralStore->id,
            'item_id' => $item->id,
            'previous_quantity' => 0,
            'new_quantity' => 50,
            'quantity_difference' => 50,
            'movement_type' => StockMovementType::STOCK_IN->value,
            'reason' => 'Stok bulan ini',
            'created_by' => $admin->id,
        ]);
        $m1->created_at = now()->startOfMonth()->addDays(2);
        $m1->save();

        // Movement for central store in past month
        $m2 = new StockMovement([
            'store_id' => $centralStore->id,
            'item_id' => $item->id,
            'previous_quantity' => 0,
            'new_quantity' => 20,
            'quantity_difference' => 20,
            'movement_type' => StockMovementType::STOCK_IN->value,
            'reason' => 'Stok bulan lalu',
            'created_by' => $admin->id,
        ]);
        $m2->created_at = now()->subMonth()->startOfMonth()->addDay();
        $m2->save();

        // Movement for branch store
        $m3 = new StockMovement([
            'store_id' => $branchStore->id,
            'item_id' => $item->id,
            'previous_quantity' => 0,
            'new_quantity' => 30,
            'quantity_difference' => 30,
            'movement_type' => StockMovementType::STOCK_IN->value,
            'reason' => 'Stok cabang',
            'created_by' => $admin->id,
        ]);
        $m3->created_at = now()->startOfMonth()->addDays(3);
        $m3->save();

        $response = $this->actingAs($admin)->get(route('central.inventory.index', [
            'tab' => 'history',
        ]))->assertOk();

        $response->assertInertia(fn ($page) => $page
            ->component('central/inventory/index')
            ->where('selectedStoreId', $centralStore->id)
            ->has('movements.data', 1)
            ->where('movements.data.0.reason', 'Stok bulan ini')
            ->has('filters.date_from')
            ->has('filters.date_to')
        );
    }

    public function test_bulk_stock_addition_is_grouped_as_single_request_row_in_history_with_item_details(): void
    {
        $admin = User::factory()->centralAdmin()->create();
        $centralStore = Store::factory()->create(['code' => 'HO-JKT', 'name' => 'Head Office Jakarta']);
        $category = ItemCategory::create(['name' => 'Cleaning', 'code' => 'CLN', 'is_active' => true]);
        $unit = Unit::create(['name' => 'Pcs', 'symbol' => 'pcs', 'is_active' => true]);
        $item1 = Item::create(['sku' => 'ITM-01', 'name' => 'Barang 1', 'item_category_id' => $category->id, 'unit_id' => $unit->id, 'is_active' => true]);
        $item2 = Item::create(['sku' => 'ITM-02', 'name' => 'Barang 2', 'item_category_id' => $category->id, 'unit_id' => $unit->id, 'is_active' => true]);
        $supplier = Supplier::create(['code' => 'SUP-BATCH', 'name' => 'Supplier Batch', 'is_active' => true]);

        // Add 2 items collectively in 1 request
        $this->actingAs($admin)->post(route('central.inventory.stock.bulk'), [
            'store_id' => $centralStore->id,
            'movement_type' => StockMovementType::STOCK_IN->value,
            'reason' => 'Pengadaan massal awal bulan',
            'supplier_id' => $supplier->id,
            'items' => [
                ['item_id' => $item1->id, 'quantity' => 10, 'unit_cost' => 5000],
                ['item_id' => $item2->id, 'quantity' => 20, 'unit_cost' => 10000],
            ],
        ])->assertSessionHasNoErrors();

        // Stock movements table has 2 rows
        $this->assertDatabaseCount('stock_movements', 2);
        // But stock batches table has 1 row
        $this->assertDatabaseCount('stock_batches', 1);

        // When viewing history tab, it must appear as 1 row representing the request
        $response = $this->actingAs($admin)->get(route('central.inventory.index', [
            'tab' => 'history',
        ]))->assertOk();

        $response->assertInertia(fn ($page) => $page
            ->component('central/inventory/index')
            ->has('movements.data', 1)
            ->where('movements.data.0.total_items', 2)
            ->where('movements.data.0.quantity_difference', 30)
            ->where('movements.data.0.reason', 'Pengadaan massal awal bulan')
            ->has('movements.data.0.batch_number')
            ->has('movements.data.0.items', 2)
            ->where('movements.data.0.items.0.sku', 'ITM-01')
            ->where('movements.data.0.items.1.sku', 'ITM-02')
        );
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

<?php

namespace Tests\Feature;

use App\Actions\Inventory\UpdateStoreStock;
use App\Enums\StockMovementType;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\StoreStock;
use App\Models\StoreStockStandard;
use App\Models\Unit;
use App\Models\User;
use Database\Seeders\LocalStockSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocalStockSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_stock_is_audited_and_rerunning_preserves_manual_testing_changes(): void
    {
        $admin = User::factory()->centralAdmin()->create();
        $central = Store::factory()->create(['code' => 'HO-JKT']);
        $branch = Store::factory()->create(['code' => 'PP']);
        $category = ItemCategory::create(['code' => 'TEST', 'name' => 'Test']);
        $unit = Unit::create(['symbol' => 'pcs', 'name' => 'Piece']);
        foreach (range(1, 4) as $number) {
            Item::create(['sku' => "TEST-{$number}", 'name' => "Item {$number}", 'item_category_id' => $category->id, 'unit_id' => $unit->id, 'is_active' => true]);
        }

        $this->seed(LocalStockSeeder::class);

        $this->assertDatabaseCount('store_stocks', 8);
        $this->assertDatabaseCount('stock_movements', 8);
        $this->assertDatabaseCount('store_stock_standards', 8);
        $this->assertSame([0, 3, 10, 25], StoreStock::where('store_id', $branch->id)->orderBy('item_id')->pluck('quantity')->all());
        $this->assertSame(800, (int) StoreStock::where('store_id', $central->id)->sum('quantity'));
        $this->assertSame(800000, (int) StoreStock::where('store_id', $central->id)->sum('total_value'));
        $this->assertSame(8, StockMovement::where('created_by', $admin->id)->count());

        $item = Item::where('sku', 'TEST-1')->firstOrFail();
        $this->assertNull($item->cost_price);
        $this->assertNull($item->min_stock);
        $this->assertNull($item->target_stock);
        app(UpdateStoreStock::class)->handle($central, $item, '150', StockMovementType::MANUAL_UPDATE, 'Manual test', actor: $admin);
        StoreStockStandard::where('store_id', $branch->id)->where('item_id', $item->id)->update(['standard_quantity' => 40]);
        $this->seed(LocalStockSeeder::class);

        $this->assertDatabaseCount('stock_movements', 9);
        $this->assertDatabaseCount('store_stock_standards', 8);
        $this->assertSame(150, StoreStock::where('store_id', $central->id)->where('item_id', $item->id)->firstOrFail()->quantity);
        $this->assertDatabaseHas('store_stock_standards', ['store_id' => $branch->id, 'item_id' => $item->id, 'standard_quantity' => 40]);
        $this->assertNull(auth()->user());
    }

    public function test_demo_and_inactive_data_are_excluded(): void
    {
        User::factory()->centralAdmin()->create();
        $central = Store::factory()->create(['code' => 'HO-JKT']);
        Store::factory()->create(['code' => 'DEMO-A']);
        Store::factory()->create(['code' => 'INACTIVE', 'is_active' => false]);
        $category = ItemCategory::create(['code' => 'TEST', 'name' => 'Test']);
        $unit = Unit::create(['symbol' => 'pcs', 'name' => 'Piece']);
        foreach ([['MASTER', true], ['DEMO-ITEM', true], ['INACTIVE', false]] as [$sku, $active]) {
            Item::create(['sku' => $sku, 'name' => $sku, 'item_category_id' => $category->id, 'unit_id' => $unit->id, 'is_active' => $active]);
        }

        $this->seed(LocalStockSeeder::class);

        $this->assertDatabaseCount('store_stocks', 1);
        $this->assertDatabaseHas('store_stocks', ['store_id' => $central->id, 'quantity' => 200]);
        $this->assertDatabaseCount('stock_movements', 1);
    }

    public function test_production_is_rejected_before_data_is_written(): void
    {
        $this->app->instance('env', 'production');

        try {
            $this->expectException(\RuntimeException::class);
            $this->expectExceptionMessage('local/testing');
            app(LocalStockSeeder::class)->run();
        } finally {
            $this->app->instance('env', 'testing');
            $this->assertDatabaseCount('store_stocks', 0);
            $this->assertDatabaseCount('stock_movements', 0);
        }
    }
}

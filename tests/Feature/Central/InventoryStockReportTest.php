<?php

namespace Tests\Feature\Central;

use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\Store;
use App\Models\StoreStock;
use App\Models\StoreStockStandard;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryStockReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_inventory_report_routes(): void
    {
        $this->get(route('central.inventory.print'))->assertRedirect(route('login'));
        $this->get(route('central.inventory.pdf'))->assertRedirect(route('login'));
        $this->get(route('central.inventory.excel'))->assertRedirect(route('login'));
        $this->get(route('central.inventory.csv'))->assertRedirect(route('login'));
    }

    public function test_store_pic_cannot_access_central_inventory_reports(): void
    {
        $storeUser = User::factory()->storePic()->create();

        $this->actingAs($storeUser)->get(route('central.inventory.print'))->assertForbidden();
        $this->actingAs($storeUser)->get(route('central.inventory.pdf'))->assertForbidden();
        $this->actingAs($storeUser)->get(route('central.inventory.excel'))->assertForbidden();
        $this->actingAs($storeUser)->get(route('central.inventory.csv'))->assertForbidden();
    }

    public function test_central_admin_can_render_inventory_print_sheet(): void
    {
        [$store, $item] = $this->setupInventoryContext();
        $admin = User::factory()->centralAdmin()->create();

        $response = $this->actingAs($admin)->get(route('central.inventory.print'));

        $response->assertOk();
        $response->assertViewIs('reports.inventory-stock');
        $response->assertViewHas('print', true);
        $response->assertViewHas('report');
        $response->assertSeeText('TULOLA JEWELRY');
        $response->assertSeeText($item->sku);
        $response->assertSeeText($item->name);
        $response->assertSeeText('Cetak Lembar');
    }

    public function test_central_admin_can_download_inventory_pdf(): void
    {
        [$store, $item] = $this->setupInventoryContext();
        $admin = User::factory()->centralAdmin()->create();

        $response = $this->actingAs($admin)->get(route('central.inventory.pdf'));

        $response->assertOk();
        $this->assertStringContainsString('application/pdf', $response->headers->get('Content-Type') ?? '');
        $this->assertStringContainsString('attachment;', $response->headers->get('Content-Disposition') ?? '');
        $this->assertStringContainsString('.pdf', $response->headers->get('Content-Disposition') ?? '');
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_central_admin_can_export_inventory_excel(): void
    {
        [$store, $item] = $this->setupInventoryContext();
        $admin = User::factory()->centralAdmin()->create();

        $response = $this->actingAs($admin)->get(route('central.inventory.excel'));

        $response->assertOk();
        $this->assertStringContainsString('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', $response->headers->get('Content-Type') ?? '');
        $this->assertStringContainsString('.xlsx', $response->headers->get('Content-Disposition') ?? '');
    }

    public function test_central_admin_can_export_inventory_csv(): void
    {
        [$store, $item] = $this->setupInventoryContext();
        $admin = User::factory()->centralAdmin()->create();

        $response = $this->actingAs($admin)->get(route('central.inventory.csv'));

        $response->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type') ?? '');
        $this->assertStringContainsString('.csv', $response->headers->get('Content-Disposition') ?? '');

        $content = $response->streamedContent();
        $this->assertStringContainsString($item->sku, $content);
        $this->assertStringContainsString($item->name, $content);
        $this->assertStringContainsString('TOTAL', $content);
    }

    public function test_inventory_report_search_filter_isolates_records(): void
    {
        [$store, $itemA] = $this->setupInventoryContext('SKU-ALPHA', 'Anting Mutiara');
        $itemB = Item::create([
            'sku' => 'SKU-BETA',
            'name' => 'Gelang Perak',
            'item_category_id' => $itemA->item_category_id,
            'unit_id' => $itemA->unit_id,
            'cost_price' => 200000,
            'is_active' => true,
        ]);

        $admin = User::factory()->centralAdmin()->create();

        $response = $this->actingAs($admin)->get(route('central.inventory.print', ['search' => 'Anting']));

        $response->assertOk();
        $response->assertSeeText('SKU-ALPHA');
        $response->assertDontSeeText('SKU-BETA');
    }

    /**
     * @return array{Store, Item}
     */
    private function setupInventoryContext(string $sku = 'TL-RING-01', string $name = 'Cincin Emas Tulola'): array
    {
        $store = Store::query()->firstOrCreate(
            ['code' => 'HO-JKT'],
            ['name' => 'Head Office Jakarta (Gudang Pusat)', 'address' => 'Jakarta', 'is_active' => true]
        );

        $category = ItemCategory::firstOrCreate(
            ['code' => 'JWL'],
            ['name' => 'Jewelry', 'is_active' => true]
        );

        $unit = Unit::firstOrCreate(
            ['symbol' => 'pcs'],
            ['name' => 'Pieces', 'is_active' => true]
        );

        $item = Item::create([
            'sku' => $sku,
            'name' => $name,
            'item_category_id' => $category->id,
            'unit_id' => $unit->id,
            'cost_price' => 500000,
            'min_stock' => 5,
            'target_stock' => 20,
            'is_active' => true,
        ]);

        StoreStock::create([
            'store_id' => $store->id,
            'item_id' => $item->id,
            'quantity' => 15,
            'average_unit_cost' => 500000,
            'total_value' => 7500000,
        ]);

        StoreStockStandard::create([
            'store_id' => $store->id,
            'item_id' => $item->id,
            'standard_quantity' => 20,
            'min_quantity' => 5,
        ]);

        return [$store, $item];
    }
}

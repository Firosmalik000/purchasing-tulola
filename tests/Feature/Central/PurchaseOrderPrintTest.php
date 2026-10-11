<?php

namespace Tests\Feature\Central;

use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemType;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseRequest;
use App\Models\Store;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseOrderPrintTest extends TestCase
{
    use RefreshDatabase;

    public function test_central_user_can_view_order_print_template(): void
    {
        $admin = User::factory()->centralAdmin()->create(['name' => 'Admin Purchasing']);
        $store = Store::factory()->create(['name' => 'Tulola Store Senayan', 'code' => 'SS-01']);
        $category = ItemCategory::create(['code' => 'SLV', 'name' => 'Silver Jewelry']);
        $unit = Unit::create(['name' => 'Pieces', 'symbol' => 'pcs']);
        $item = Item::create([
            'sku' => 'SLV-RING-001',
            'name' => 'Subeng Classic Ring',
            'item_category_id' => $category->id,
            'unit_id' => $unit->id,
            'is_active' => true,
        ]);

        $request = PurchaseRequest::factory()->create([
            'number' => 'REQ-202610-0012',
            'store_id' => $store->id,
        ]);

        $order = PurchaseOrder::factory()->create([
            'number' => 'PO-202610-0005',
            'purchase_request_id' => $request->id,
            'order_date' => now()->toDateString(),
            'expected_date' => now()->addDays(3)->toDateString(),
            'notes' => 'Harap kirim dengan kemasan khusus dan segel aman.',
            'status' => PurchaseOrderStatus::ORDERED,
            'created_by' => $admin->id,
        ]);

        PurchaseOrderItem::create([
            'purchase_order_id' => $order->id,
            'item_type' => PurchaseRequestItemType::STOCK,
            'item_id' => $item->id,
            'name' => null,
            'unit_id' => $unit->id,
            'quantity' => 15,
        ]);

        PurchaseOrderItem::create([
            'purchase_order_id' => $order->id,
            'item_type' => PurchaseRequestItemType::SPECIAL,
            'item_id' => null,
            'name' => 'Box Beludru Custom Logo',
            'unit_id' => $unit->id,
            'quantity' => 2,
        ]);

        $response = $this->actingAs($admin)->get(route('central.orders.print', $order));

        $response->assertOk();
        $response->assertViewIs('orders.print');
        $response->assertSee('PO-202610-0005');
        $response->assertSee('Tulola Store Senayan');
        $response->assertSee('SS-01');
        $response->assertSee('REQ-202610-0012');
        $response->assertSee('Subeng Classic Ring');
        $response->assertSee('SLV-RING-001');
        $response->assertSee('Box Beludru Custom Logo');
        $response->assertSee('Harap kirim dengan kemasan khusus dan segel aman.');
        $response->assertSee('Dibuat Oleh');
        $response->assertSee('Diterima Oleh');
        $response->assertSee('Format Cetak A4 (Maks. 2 Lembar)');
    }

    public function test_central_user_can_download_order_pdf(): void
    {
        $admin = User::factory()->centralAdmin()->create();
        $category = ItemCategory::create(['code' => 'SLV', 'name' => 'Silver Jewelry']);
        $unit = Unit::create(['name' => 'Pieces', 'symbol' => 'pcs']);
        $item = Item::create([
            'sku' => 'SLV-RING-002',
            'name' => 'Classic Ring 2',
            'item_category_id' => $category->id,
            'unit_id' => $unit->id,
            'is_active' => true,
        ]);

        $order = PurchaseOrder::factory()->create([
            'number' => 'PO-202610-0005',
            'order_date' => now()->toDateString(),
            'status' => PurchaseOrderStatus::ORDERED,
            'created_by' => $admin->id,
        ]);

        PurchaseOrderItem::create([
            'purchase_order_id' => $order->id,
            'item_type' => PurchaseRequestItemType::STOCK,
            'item_id' => $item->id,
            'unit_id' => $unit->id,
            'quantity' => 10,
        ]);

        $response = $this->actingAs($admin)->get(route('central.orders.pdf', $order));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringContainsString('filename="Order-PO-202610-0005.pdf"', (string) $response->headers->get('Content-Disposition'));
        $this->assertNotEmpty($response->getContent());
    }

    public function test_unauthorized_user_cannot_view_order_print_or_pdf(): void
    {
        $storeUser = User::factory()->storePic()->create();
        $order = PurchaseOrder::factory()->create();

        $this->actingAs($storeUser)
            ->get(route('central.orders.print', $order))
            ->assertForbidden();

        $this->actingAs($storeUser)
            ->get(route('central.orders.pdf', $order))
            ->assertForbidden();
    }
}

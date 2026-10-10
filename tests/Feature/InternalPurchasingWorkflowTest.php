<?php

namespace Tests\Feature;

use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemType;
use App\Enums\PurchaseRequestStatus;
use App\Enums\StockMovementType;
use App\Enums\UserRole;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\StoreStock;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class InternalPurchasingWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_approved_request_flows_through_internal_order_receipt_and_stock(): void
    {
        Mail::fake();
        $centralStore = Store::factory()->create(['code' => 'HO-JKT', 'name' => 'Head Office Jakarta']);
        $store = Store::factory()->create(['code' => 'FLOW']);
        $admin = User::factory()->create(['role' => UserRole::CENTRAL_ADMIN]);
        $pic = User::factory()->create(['role' => UserRole::STORE_PIC]);
        $store->users()->attach($pic, ['is_pic' => true, 'is_active' => true]);
        $unit = Unit::create(['name' => 'Piece', 'symbol' => 'pcs', 'is_active' => true]);
        $category = ItemCategory::create(['name' => 'Operasional', 'code' => 'OPS', 'is_active' => true]);
        $item = Item::create([
            'sku' => 'OPS-FLOW-001', 'name' => 'Item Alur Internal',
            'item_category_id' => $category->id, 'unit_id' => $unit->id, 'is_active' => true,
        ]);
        StoreStock::create([
            'store_id' => $centralStore->id, 'item_id' => $item->id, 'quantity' => 10,
            'average_unit_cost' => 100, 'total_value' => 1000,
        ]);
        StoreStock::create([
            'store_id' => $store->id, 'item_id' => $item->id, 'quantity' => 1,
            'average_unit_cost' => 100, 'total_value' => 100,
        ]);
        // 1. PIC Toko membuat dan mengajukan request (Purchase Request)
        $this->actingAs($pic)->post(route('store.requests.store'), [
            'store_id' => $store->id,
            'required_date' => now()->addWeek()->toDateString(),
            'notes' => 'Permintaan kebutuhan toko dari PIC.',
            'stock_items' => [['item_id' => $item->id, 'requested_quantity' => 2]],
            'action' => 'submit',
        ])->assertSessionHasNoErrors();

        $request = PurchaseRequest::query()->whereBelongsTo($store)->firstOrFail();
        $this->assertSame(PurchaseRequestStatus::SUBMITTED, $request->status);
        $this->assertSame($pic->id, $request->requested_by);
        $line = $request->items()->firstOrFail();

        // 2. Central Admin menyetujui (Approve) request
        $this->actingAs($admin)->post(route('central.requests.process', $request), [
            'items' => [$line->id => ['id' => $line->id, 'approved_quantity' => '2']],
            'notes' => 'Disetujui untuk kebutuhan toko.',
        ])->assertSessionHasNoErrors();

        $order = PurchaseOrder::query()->whereBelongsTo($request)->firstOrFail();
        $allocation = $order->items()->firstOrFail()->allocations()->firstOrFail();
        $this->assertSame(PurchaseRequestStatus::PROCESSED, $request->fresh()->status);
        $this->assertSame(PurchaseOrderStatus::DRAFT, $order->status);

        // When order is placed, central stock is NOT deducted yet (goods in transit)
        $this->actingAs($admin)->post(route('central.orders.place', $order))
            ->assertSessionHasNoErrors();

        $this->assertSame(PurchaseOrderStatus::ORDERED, $order->fresh()->status);
        $this->assertSame(PurchaseRequestStatus::PROCESSED, $request->fresh()->status);
        $this->assertDatabaseHas('store_stocks', [
            'store_id' => $centralStore->id, 'item_id' => $item->id,
            'quantity' => 10,
        ]);

        // Penerimaan Parsial 1: Toko menerima 1 unit (dari 2 unit)
        $this->actingAs($pic)->post(route('store.incoming.receipts.store', $order), [
            'store_id' => $store->id,
            'received_at' => now()->subMinutes(5)->format('Y-m-d H:i:s'),
            'notes' => 'Penerimaan bertahap 1 unit.',
            'items' => [[
                'allocation_id' => $allocation->id,
                'received_quantity' => '1',
            ]],
        ])->assertSessionHasNoErrors();

        $this->assertSame(PurchaseOrderStatus::PARTIALLY_RECEIVED, $order->fresh()->status);

        // Stok Pusat berkurang 1 unit (10 - 1 = 9)
        $this->assertDatabaseHas('store_stocks', [
            'store_id' => $centralStore->id, 'item_id' => $item->id,
            'quantity' => 9, 'average_unit_cost' => 100, 'total_value' => 900,
        ]);
        // Stok Cabang bertambah 1 unit (1 + 1 = 2)
        $this->assertDatabaseHas('store_stocks', [
            'store_id' => $store->id, 'item_id' => $item->id,
            'quantity' => 2, 'average_unit_cost' => 100, 'total_value' => 200,
        ]);

        // Penerimaan Parsial 2: Toko menerima sisa 1 unit
        $this->actingAs($pic)->post(route('store.incoming.receipts.store', $order), [
            'store_id' => $store->id,
            'received_at' => now()->subMinute()->format('Y-m-d H:i:s'),
            'notes' => 'Penerimaan sisa 1 unit lengkap.',
            'items' => [[
                'allocation_id' => $allocation->id,
                'received_quantity' => '1',
            ]],
        ])->assertSessionHasNoErrors();

        $this->assertSame(PurchaseOrderStatus::COMPLETED, $order->fresh()->status);

        // Stok Pusat berkurang 1 unit lagi (9 - 1 = 8)
        $this->assertDatabaseHas('store_stocks', [
            'store_id' => $centralStore->id, 'item_id' => $item->id,
            'quantity' => 8, 'average_unit_cost' => 100, 'total_value' => 800,
        ]);
        // Stok Cabang bertambah 1 unit lagi (2 + 1 = 3)
        $this->assertDatabaseHas('store_stocks', [
            'store_id' => $store->id, 'item_id' => $item->id,
            'quantity' => 3, 'average_unit_cost' => 100, 'total_value' => 300,
        ]);

        // Mutasi Pusat tercatat 2 kali dengan tipe DISTRIBUTION_OUT
        $this->assertDatabaseCount('stock_movements', 4); // 2 at Store (ORDER_RECEIVED), 2 at Central (DISTRIBUTION_OUT)
        $this->assertSame(2, StockMovement::query()
            ->where('store_id', $centralStore->id)
            ->where('movement_type', StockMovementType::DISTRIBUTION_OUT)
            ->count());
        $this->assertSame(2, StockMovement::query()
            ->where('store_id', $store->id)
            ->where('movement_type', StockMovementType::ORDER_RECEIVED)
            ->count());
    }

    public function test_cancelling_draft_order_does_not_change_approved_request(): void
    {
        Mail::fake();
        $store = Store::factory()->create(['code' => 'CANCEL']);
        $admin = User::factory()->create(['role' => UserRole::CENTRAL_ADMIN]);
        $pic = User::factory()->create(['role' => UserRole::STORE_PIC]);
        $unit = Unit::create(['name' => 'Pack', 'symbol' => 'pack', 'is_active' => true]);
        $category = ItemCategory::create(['name' => 'Pembatalan', 'code' => 'CXL', 'is_active' => true]);
        $item = Item::create([
            'sku' => 'CXL-001', 'name' => 'Item Batal',
            'item_category_id' => $category->id, 'unit_id' => $unit->id, 'is_active' => true,
        ]);
        $request = PurchaseRequest::factory()->submitted()->create([
            'store_id' => $store->id, 'requested_by' => $pic->id,
        ]);
        $line = $request->items()->create([
            'type' => PurchaseRequestItemType::STOCK, 'item_id' => $item->id,
            'unit_id' => $unit->id, 'requested_quantity' => 1,
        ]);

        $this->actingAs($admin)->post(route('central.requests.process', $request), [
            'items' => [$line->id => ['id' => $line->id, 'approved_quantity' => '1']],
        ])->assertSessionHasNoErrors();
        $order = PurchaseOrder::query()->whereBelongsTo($request)->firstOrFail();

        $this->actingAs($admin)->post(route('central.orders.cancel', $order))
            ->assertSessionHasNoErrors();

        $this->assertSame(PurchaseOrderStatus::CANCELLED, $order->fresh()->status);
        $this->assertSame(PurchaseRequestStatus::PROCESSED, $request->fresh()->status);
        $this->assertDatabaseMissing('purchase_request_status_histories', [
            'purchase_request_id' => $request->id,
            'from_status' => PurchaseRequestStatus::PROCESSED->value,
            'to_status' => PurchaseRequestStatus::CANCELLED->value,
            'notes' => 'Order internal dibatalkan.',
        ]);
    }

    public function test_legacy_order_lifecycle_statuses_are_normalized_to_approved_without_deleting_audit(): void
    {
        $request = PurchaseRequest::factory()->create();
        DB::table('purchase_requests')->where('id', $request->id)->update([
            'status' => 'COMPLETED',
            'ordered_at' => now()->subDay(),
            'completed_at' => now(),
        ]);
        DB::table('purchase_request_status_histories')->insert([
            'purchase_request_id' => $request->id,
            'from_status' => 'ORDERED',
            'to_status' => 'COMPLETED',
            'changed_by' => null,
            'notes' => 'Legacy order lifecycle',
            'created_at' => now(),
        ]);

        $migration = require database_path('migrations/2026_10_10_010000_end_purchase_requests_at_approval.php');
        $migration->up();

        $this->assertDatabaseHas('purchase_requests', [
            'id' => $request->id,
            'status' => PurchaseRequestStatus::PROCESSED->value,
        ]);
        $this->assertDatabaseHas('purchase_request_status_histories', [
            'purchase_request_id' => $request->id,
            'from_status' => 'ORDERED',
            'to_status' => 'COMPLETED',
        ]);
    }
}

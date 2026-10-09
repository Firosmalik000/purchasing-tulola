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
use App\Models\Receipt;
use App\Models\Store;
use App\Models\StoreStock;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class InternalPurchasingWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_approved_request_flows_through_internal_order_receipt_and_stock(): void
    {
        Mail::fake();
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
            'store_id' => $store->id, 'item_id' => $item->id, 'quantity' => '1.000',
            'average_unit_cost' => '100.00', 'total_value' => '100.00',
        ]);
        $request = PurchaseRequest::factory()->submitted()->create([
            'number' => 'REQ/FLOW/2026/10/0001', 'store_id' => $store->id, 'requested_by' => $pic->id,
        ]);
        $line = $request->items()->create([
            'type' => PurchaseRequestItemType::STOCK, 'item_id' => $item->id, 'unit_id' => $unit->id,
            'current_stock_snapshot' => '1.000', 'requested_quantity' => '2.500',
        ]);

        $this->actingAs($admin)->post(route('central.requests.process', $request), [
            'items' => [$line->id => ['id' => $line->id, 'approved_quantity' => '2.500']],
            'notes' => 'Disetujui untuk kebutuhan toko.',
        ])->assertSessionHasNoErrors();

        $order = PurchaseOrder::query()->whereBelongsTo($request)->firstOrFail();
        $allocation = $order->items()->firstOrFail()->allocations()->firstOrFail();
        $this->assertSame(PurchaseRequestStatus::PROCESSED, $request->fresh()->status);
        $this->assertSame(PurchaseOrderStatus::DRAFT, $order->status);

        $this->actingAs($admin)->post(route('central.orders.place', $order))
            ->assertSessionHasNoErrors();

        $this->assertSame(PurchaseOrderStatus::ORDERED, $order->fresh()->status);
        $this->assertSame(PurchaseRequestStatus::ORDERED, $request->fresh()->status);

        $this->actingAs($pic)->post(route('store.incoming.receipts.store', $order), [
            'store_id' => $store->id,
            'received_at' => now()->subMinute()->format('Y-m-d H:i:s'),
            'notes' => 'Barang diterima lengkap.',
            'items' => [[
                'allocation_id' => $allocation->id,
                'received_quantity' => '2.500',
            ]],
        ])->assertSessionHasNoErrors();

        $receipt = Receipt::query()->whereBelongsTo($order)->firstOrFail();
        $this->assertNotNull($receipt->stock_applied_at);
        $this->assertSame($pic->id, $receipt->stock_applied_by);
        $this->assertSame(PurchaseOrderStatus::COMPLETED, $order->fresh()->status);
        $this->assertSame(PurchaseRequestStatus::COMPLETED, $request->fresh()->status);
        $this->assertDatabaseHas('store_stocks', [
            'store_id' => $store->id, 'item_id' => $item->id,
            'quantity' => 3.5, 'average_unit_cost' => 100, 'total_value' => 350,
        ]);
        $this->assertDatabaseHas('stock_movements', [
            'store_id' => $store->id, 'item_id' => $item->id,
            'movement_type' => StockMovementType::ORDER_RECEIVED->value,
            'quantity_difference' => 2.5, 'movement_value' => 250, 'new_value' => 350,
            'reference_type' => $receipt->getMorphClass(), 'reference_id' => $receipt->id,
        ]);
    }

    public function test_cancelling_process_order_also_cancels_its_request(): void
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
            'unit_id' => $unit->id, 'requested_quantity' => '1.000',
        ]);

        $this->actingAs($admin)->post(route('central.requests.process', $request), [
            'items' => [$line->id => ['id' => $line->id, 'approved_quantity' => '1.000']],
        ])->assertSessionHasNoErrors();
        $order = PurchaseOrder::query()->whereBelongsTo($request)->firstOrFail();

        $this->actingAs($admin)->post(route('central.orders.cancel', $order))
            ->assertSessionHasNoErrors();

        $this->assertSame(PurchaseOrderStatus::CANCELLED, $order->fresh()->status);
        $this->assertSame(PurchaseRequestStatus::CANCELLED, $request->fresh()->status);
        $this->assertDatabaseHas('purchase_request_status_histories', [
            'purchase_request_id' => $request->id,
            'from_status' => PurchaseRequestStatus::PROCESSED->value,
            'to_status' => PurchaseRequestStatus::CANCELLED->value,
            'changed_by' => $admin->id,
            'notes' => 'Order internal dibatalkan.',
        ]);
    }
}

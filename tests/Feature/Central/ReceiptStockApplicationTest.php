<?php

namespace Tests\Feature\Central;

use App\Actions\Inventory\ApplyReceiptToStock;
use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemStatus;
use App\Enums\PurchaseRequestItemType;
use App\Enums\PurchaseRequestStatus;
use App\Enums\ReceiptStatus;
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
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ReceiptStockApplicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_inventory_lists_pending_receipt_with_current_received_and_proposed_stock(): void
    {
        [$admin, $store, , $receipt] = $this->mixedReceipt();

        $this->actingAs($admin)->get(route('central.inventory.index', ['store_id' => $store->id]))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('central/inventory/index')
            ->has('pendingReceipts', 1)
            ->where('pendingReceipts.0.number', $receipt->number)
            ->where('pendingReceipts.0.stock_lines.0.current_quantity', '19.000')
            ->where('pendingReceipts.0.stock_lines.0.received_quantity', '49.000')
            ->where('pendingReceipts.0.stock_lines.0.proposed_quantity', '68.000')
            ->has('pendingReceipts.0.special_lines', 1));
    }

    public function test_central_applies_stock_items_skips_special_items_and_completes_workflow(): void
    {
        [$admin, $store, $item, $receipt, $order, $request] = $this->mixedReceipt();

        $this->actingAs($admin)->post(route('central.inventory.receipts.apply', $receipt), [
            'notes' => 'Diverifikasi pusat',
        ])->assertSessionHasNoErrors();

        $this->assertSame('68.000', StoreStock::query()->whereBelongsTo($store)->whereBelongsTo($item)->firstOrFail()->quantity);
        $this->assertDatabaseCount('stock_movements', 1);
        $this->assertDatabaseHas('stock_movements', [
            'store_id' => $store->id, 'item_id' => $item->id,
            'previous_quantity' => 19, 'new_quantity' => 68, 'quantity_difference' => 49,
            'movement_type' => StockMovementType::ORDER_RECEIVED->value,
            'reference_type' => Receipt::class, 'reference_id' => $receipt->id,
            'created_by' => $admin->id,
        ]);
        $this->assertNotNull($receipt->fresh()->stock_applied_at);
        $this->assertSame($admin->id, $receipt->fresh()->stock_applied_by);
        $this->assertSame(PurchaseOrderStatus::COMPLETED, $order->fresh()->status);
        $this->assertSame(PurchaseRequestStatus::COMPLETED, $request->fresh()->status);
        $this->assertNotNull($request->fresh()->completed_at);
        $this->assertDatabaseHas('activity_logs', ['action' => 'receipt.stock_applied', 'entity_id' => $receipt->id]);
        $this->assertDatabaseHas('purchase_request_status_histories', [
            'purchase_request_id' => $request->id, 'to_status' => PurchaseRequestStatus::COMPLETED->value,
        ]);
    }

    public function test_receipt_cannot_be_applied_twice(): void
    {
        [$admin, $store, $item, $receipt] = $this->mixedReceipt();
        $this->actingAs($admin)->post(route('central.inventory.receipts.apply', $receipt))->assertSessionHasNoErrors();

        $this->actingAs($admin)->post(route('central.inventory.receipts.apply', $receipt))->assertForbidden();

        $this->assertSame('68.000', StoreStock::query()->whereBelongsTo($store)->whereBelongsTo($item)->firstOrFail()->quantity);
        $this->assertDatabaseCount('stock_movements', 1);
    }

    public function test_action_rejects_repeated_application_even_without_http_policy(): void
    {
        [$admin, , , $receipt] = $this->mixedReceipt();
        $action = app(ApplyReceiptToStock::class);
        $this->actingAs($admin);
        $action->handle($receipt, $admin);

        $this->expectException(ValidationException::class);
        $action->handle($receipt->fresh(), $admin);
    }

    public function test_order_and_request_wait_until_every_receipt_is_applied(): void
    {
        [$admin, $store, $item, $request, $order, $first, $second] = $this->splitReceipts();

        $this->actingAs($admin)->post(route('central.inventory.receipts.apply', $first))->assertSessionHasNoErrors();
        $this->assertSame(PurchaseOrderStatus::RECEIVED, $order->fresh()->status);
        $this->assertSame(PurchaseRequestStatus::ORDERED, $request->fresh()->status);
        $this->assertSame('4.000', StoreStock::query()->whereBelongsTo($store)->whereBelongsTo($item)->firstOrFail()->quantity);

        $this->actingAs($admin)->post(route('central.inventory.receipts.apply', $second))->assertSessionHasNoErrors();
        $this->assertSame(PurchaseOrderStatus::COMPLETED, $order->fresh()->status);
        $this->assertSame(PurchaseRequestStatus::COMPLETED, $request->fresh()->status);
        $this->assertSame('10.000', StoreStock::query()->whereBelongsTo($store)->whereBelongsTo($item)->firstOrFail()->quantity);
        $this->assertDatabaseCount('stock_movements', 2);
    }

    public function test_only_central_admin_can_apply_received_stock(): void
    {
        [, , , $receipt] = $this->mixedReceipt();
        $purchasing = User::factory()->create(['role' => UserRole::PURCHASING]);
        $management = User::factory()->create(['role' => UserRole::MANAGEMENT]);
        $pic = User::factory()->create();

        $this->actingAs($purchasing)->post(route('central.inventory.receipts.apply', $receipt))->assertForbidden();
        $this->actingAs($management)->post(route('central.inventory.receipts.apply', $receipt))->assertForbidden();
        $this->actingAs($pic)->post(route('central.inventory.receipts.apply', $receipt))->assertForbidden();
        $this->assertNull($receipt->fresh()->stock_applied_at);
    }

    /** @return array{User, Store, Item, Receipt, PurchaseOrder, PurchaseRequest} */
    private function mixedReceipt(): array
    {
        $admin = User::factory()->centralAdmin()->create();
        $pic = User::factory()->create();
        $store = Store::factory()->create(['code' => 'PP']);
        $pic->stores()->attach($store, ['is_pic' => true, 'is_active' => true]);
        [$item, $unit] = $this->item();
        StoreStock::create(['store_id' => $store->id, 'item_id' => $item->id, 'quantity' => 19]);
        $request = PurchaseRequest::factory()->create([
            'store_id' => $store->id, 'requested_by' => $pic->id,
            'status' => PurchaseRequestStatus::ORDERED, 'ordered_at' => now(),
        ]);
        $stockRequestItem = $request->items()->create([
            'type' => PurchaseRequestItemType::STOCK, 'item_id' => $item->id, 'unit_id' => $unit->id,
            'requested_quantity' => 49, 'approved_quantity' => 49, 'status' => PurchaseRequestItemStatus::APPROVED,
        ]);
        $specialRequestItem = $request->items()->create([
            'type' => PurchaseRequestItemType::SPECIAL, 'name' => 'Display Acrylic', 'unit_id' => $unit->id,
            'requested_quantity' => 1, 'approved_quantity' => 1, 'status' => PurchaseRequestItemStatus::APPROVED,
        ]);
        $order = PurchaseOrder::factory()->create([
            'created_by' => $admin->id, 'status' => PurchaseOrderStatus::RECEIVED,
        ]);
        $stockOrderItem = $order->items()->create([
            'item_type' => PurchaseRequestItemType::STOCK, 'item_id' => $item->id, 'unit_id' => $unit->id,
            'quantity' => 49, 'unit_price' => 100, 'total' => 4900,
        ]);
        $specialOrderItem = $order->items()->create([
            'item_type' => PurchaseRequestItemType::SPECIAL, 'name' => 'Display Acrylic', 'unit_id' => $unit->id,
            'quantity' => 1, 'unit_price' => 500, 'total' => 500,
        ]);
        $stockOrderItem->allocations()->create(['purchase_request_item_id' => $stockRequestItem->id, 'allocated_quantity' => 49]);
        $specialOrderItem->allocations()->create(['purchase_request_item_id' => $specialRequestItem->id, 'allocated_quantity' => 1]);
        $receipt = Receipt::create([
            'number' => 'RCV/PP/'.now()->format('Y/m').'/0001', 'purchase_order_id' => $order->id,
            'store_id' => $store->id, 'received_by' => $pic->id, 'received_at' => now(),
            'status' => ReceiptStatus::CONFIRMED,
        ]);
        $receipt->items()->create([
            'purchase_order_item_id' => $stockOrderItem->id, 'purchase_request_item_id' => $stockRequestItem->id,
            'ordered_quantity' => 49, 'received_quantity' => 49,
        ]);
        $receipt->items()->create([
            'purchase_order_item_id' => $specialOrderItem->id, 'purchase_request_item_id' => $specialRequestItem->id,
            'ordered_quantity' => 1, 'received_quantity' => 1,
        ]);

        return [$admin, $store, $item, $receipt, $order, $request];
    }

    /** @return array{User, Store, Item, PurchaseRequest, PurchaseOrder, Receipt, Receipt} */
    private function splitReceipts(): array
    {
        $admin = User::factory()->centralAdmin()->create();
        $pic = User::factory()->create();
        $store = Store::factory()->create(['code' => 'PIM']);
        [$item, $unit] = $this->item();
        $request = PurchaseRequest::factory()->create([
            'store_id' => $store->id, 'requested_by' => $pic->id,
            'status' => PurchaseRequestStatus::ORDERED, 'ordered_at' => now(),
        ]);
        $requestItem = $request->items()->create([
            'type' => PurchaseRequestItemType::STOCK, 'item_id' => $item->id, 'unit_id' => $unit->id,
            'requested_quantity' => 10, 'approved_quantity' => 10, 'status' => PurchaseRequestItemStatus::APPROVED,
        ]);
        $order = PurchaseOrder::factory()->create(['created_by' => $admin->id, 'status' => PurchaseOrderStatus::RECEIVED]);
        $orderItem = $order->items()->create([
            'item_type' => PurchaseRequestItemType::STOCK, 'item_id' => $item->id, 'unit_id' => $unit->id,
            'quantity' => 10, 'unit_price' => 100, 'total' => 1000,
        ]);
        $orderItem->allocations()->create(['purchase_request_item_id' => $requestItem->id, 'allocated_quantity' => 10]);
        $first = $this->receipt($order, $store, $pic, $orderItem->id, $requestItem->id, 4, '0001');
        $second = $this->receipt($order, $store, $pic, $orderItem->id, $requestItem->id, 6, '0002');

        return [$admin, $store, $item, $request, $order, $first, $second];
    }

    private function receipt(PurchaseOrder $order, Store $store, User $pic, int $orderItemId, int $requestItemId, int $quantity, string $sequence): Receipt
    {
        $receipt = Receipt::create([
            'number' => 'RCV/'.$store->code.'/'.now()->format('Y/m').'/'.$sequence,
            'purchase_order_id' => $order->id, 'store_id' => $store->id,
            'received_by' => $pic->id, 'received_at' => now(), 'status' => ReceiptStatus::CONFIRMED,
        ]);
        $receipt->items()->create([
            'purchase_order_item_id' => $orderItemId, 'purchase_request_item_id' => $requestItemId,
            'ordered_quantity' => 10, 'received_quantity' => $quantity,
        ]);

        return $receipt;
    }

    /** @return array{Item, Unit} */
    private function item(): array
    {
        $unit = Unit::firstOrCreate(['symbol' => 'pcs'], ['name' => 'Piece', 'is_active' => true]);
        $category = ItemCategory::firstOrCreate(['code' => 'CLN'], ['name' => 'Cleaning', 'is_active' => true]);
        $item = Item::firstOrCreate(['sku' => 'CLN-001'], [
            'name' => 'Tissue Basah', 'item_category_id' => $category->id, 'unit_id' => $unit->id, 'is_active' => true,
        ]);

        return [$item, $unit];
    }
}

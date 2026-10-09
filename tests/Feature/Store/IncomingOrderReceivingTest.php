<?php

namespace Tests\Feature\Store;

use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemStatus;
use App\Enums\PurchaseRequestItemType;
use App\Enums\PurchaseRequestStatus;
use App\Enums\UserRole;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\Store;
use App\Models\StoreStock;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class IncomingOrderReceivingTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_can_track_a_draft_order_from_its_approved_request(): void
    {
        [$order, $pic, $store, , $allocation] = $this->singleStoreOrder();
        $purchaseRequest = $allocation->purchaseRequestItem()->firstOrFail()->purchaseRequest;
        $order->update([
            'purchase_request_id' => $purchaseRequest->id,
            'status' => PurchaseOrderStatus::DRAFT,
        ]);

        $this->actingAs($pic)->get(route('store.incoming.index', [
            'store_id' => $store->id,
            'status' => PurchaseOrderStatus::DRAFT->value,
        ]))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('store/incoming/index')
            ->has('orders.data', 1)
            ->where('orders.data.0.id', $order->id)
            ->where('orders.data.0.status', PurchaseOrderStatus::DRAFT->value)
            ->where('filters.date_from', now()->startOfMonth()->toDateString())
            ->where('filters.date_to', now()->endOfMonth()->toDateString()));

        $this->actingAs($pic)->get(route('store.incoming.show', [
            'purchase_order' => $order,
            'store_id' => $store->id,
        ]))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('store/incoming/show')
            ->where('purchaseOrder.id', $order->id)
            ->where('purchaseOrder.status', PurchaseOrderStatus::DRAFT->value)
            ->where('purchaseOrder.can_receive', false));

        $this->actingAs($pic)->get(route('store.requests.show', $purchaseRequest))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('store/requests/show')
            ->where('purchaseRequest.purchase_order.id', $order->id)
            ->where('purchaseRequest.purchase_order.number', $order->number)
            ->where('purchaseRequest.purchase_order.status', PurchaseOrderStatus::DRAFT->value));
    }

    public function test_store_only_sees_its_own_allocations_from_a_shared_order(): void
    {
        [$order, $firstPic, $firstStore, , $firstAllocation, $secondRequestNumber] = $this->sharedOrder();

        $this->actingAs($firstPic)->get(route('store.incoming.index', ['store_id' => $firstStore->id]))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('store/incoming/index')
            ->has('orders.data', 1)
            ->where('orders.data.0.id', $order->id)
            ->where('orders.data.0.line_count', 1)
            ->where('orders.data.0.ordered_quantity', 10));

        $response = $this->actingAs($firstPic)->get(route('store.incoming.show', [
            'purchase_order' => $order, 'store_id' => $firstStore->id,
        ]));
        $response->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('store/incoming/show')
            ->has('purchaseOrder.lines', 1)
            ->where('purchaseOrder.lines.0.allocation_id', $firstAllocation->id)
            ->where('purchaseOrder.lines.0.ordered_quantity', 10));
        $this->assertStringNotContainsString($secondRequestNumber, $response->getContent());
    }

    public function test_partial_receiving_creates_audited_receipt_and_updates_stock(): void
    {
        [$order, $pic, $store, $item, $allocation] = $this->sharedOrder();
        StoreStock::create(['store_id' => $store->id, 'item_id' => $item->id, 'quantity' => 19]);

        $this->actingAs($pic)->post(route('store.incoming.receipts.store', $order), $this->payload($store, $allocation->id, '4'))
            ->assertSessionHasNoErrors();

        $this->assertSame(PurchaseOrderStatus::PARTIALLY_RECEIVED, $order->fresh()->status);
        $this->assertDatabaseHas('receipts', [
            'number' => 'RCV/'.$store->code.'/'.now()->format('Y/m').'/0001',
            'purchase_order_id' => $order->id, 'store_id' => $store->id, 'received_by' => $pic->id,
        ]);
        $this->assertDatabaseHas('receipt_items', [
            'purchase_order_item_id' => $allocation->purchase_order_item_id,
            'purchase_request_item_id' => $allocation->purchase_request_item_id,
            'ordered_quantity' => 10, 'received_quantity' => 4,
        ]);
        $this->assertDatabaseHas('activity_logs', ['action' => 'receipt.confirmed']);
        $this->assertSame(23, StoreStock::firstOrFail()->quantity);
        $this->assertDatabaseCount('stock_movements', 1);
    }

    public function test_multiple_receipts_complete_single_store_order_and_numbers_are_sequential(): void
    {
        [$order, $pic, $store, , $allocation] = $this->singleStoreOrder();

        $this->actingAs($pic)->post(route('store.incoming.receipts.store', $order), $this->payload($store, $allocation->id, '4'))
            ->assertSessionHasNoErrors();
        $this->actingAs($pic)->post(route('store.incoming.receipts.store', $order), $this->payload($store, $allocation->id, '6'))
            ->assertSessionHasNoErrors();

        $this->assertSame(PurchaseOrderStatus::COMPLETED, $order->fresh()->status);
        $this->assertSame([
            'RCV/'.$store->code.'/'.now()->format('Y/m').'/0001',
            'RCV/'.$store->code.'/'.now()->format('Y/m').'/0002',
        ], $order->receipts()->orderBy('id')->pluck('number')->all());
        $this->assertEquals(10.0, $order->receipts()->with('items')->get()->flatMap->items->sum('received_quantity'));
    }

    public function test_shared_order_is_not_received_until_every_store_allocation_is_complete(): void
    {
        [$order, $firstPic, $firstStore, , $firstAllocation, , $secondPic, $secondStore, $secondAllocation] = $this->sharedOrder();

        $this->actingAs($firstPic)->post(route('store.incoming.receipts.store', $order), $this->payload($firstStore, $firstAllocation->id, '10'))
            ->assertSessionHasNoErrors();
        $this->assertSame(PurchaseOrderStatus::PARTIALLY_RECEIVED, $order->fresh()->status);

        $this->actingAs($secondPic)->post(route('store.incoming.receipts.store', $order), $this->payload($secondStore, $secondAllocation->id, '5'))
            ->assertSessionHasNoErrors();
        $this->assertSame(PurchaseOrderStatus::COMPLETED, $order->fresh()->status);
    }

    public function test_receiving_more_than_outstanding_rolls_back(): void
    {
        [$order, $pic, $store, , $allocation] = $this->singleStoreOrder();

        $this->actingAs($pic)->post(route('store.incoming.receipts.store', $order), $this->payload($store, $allocation->id, '11'))
            ->assertSessionHasErrors("items.{$allocation->id}.received_quantity");

        $this->assertDatabaseCount('receipts', 0);
        $this->assertDatabaseCount('receipt_items', 0);
        $this->assertSame(PurchaseOrderStatus::ORDERED, $order->fresh()->status);
    }

    public function test_received_quantity_must_be_a_whole_number(): void
    {
        [$order, $pic, $store, , $allocation] = $this->singleStoreOrder();

        $this->actingAs($pic)->post(
            route('store.incoming.receipts.store', $order),
            $this->payload($store, $allocation->id, '2.99'),
        )->assertSessionHasErrors('items.0.received_quantity');

        $this->assertDatabaseCount('receipts', 0);
    }

    public function test_receiving_accepts_browser_local_datetime_and_tolerates_minor_clock_skew(): void
    {
        [$order, $pic, $store, , $allocation] = $this->singleStoreOrder();

        $this->actingAs($pic)->post(
            route('store.incoming.receipts.store', $order),
            [
                'store_id' => $store->id,
                'received_at' => now()->addMinutes(2)->format('Y-m-d\TH:i'),
                'notes' => 'Penerimaan sebagian fisik',
                'items' => [['allocation_id' => $allocation->id, 'received_quantity' => '10']],
            ],
        )->assertSessionHasNoErrors();

        $this->assertSame(PurchaseOrderStatus::COMPLETED, $order->fresh()->status);
        $this->assertDatabaseHas('receipts', [
            'purchase_order_id' => $order->id,
            'store_id' => $store->id,
        ]);
        $this->assertDatabaseHas('receipt_items', [
            'received_quantity' => 10,
        ]);
    }

    public function test_receiving_rejects_dates_in_the_future(): void
    {
        [$order, $pic, $store, , $allocation] = $this->singleStoreOrder();

        $this->actingAs($pic)->post(
            route('store.incoming.receipts.store', $order),
            [
                'store_id' => $store->id,
                'received_at' => now()->addHours(2)->format('Y-m-d\TH:i'),
                'notes' => 'Tanggal masa depan',
                'items' => [['allocation_id' => $allocation->id, 'received_quantity' => '10']],
            ],
        )->assertSessionHasErrors('received_at');

        $this->assertDatabaseCount('receipts', 0);
    }

    public function test_store_cannot_view_or_receive_another_store_allocation(): void
    {
        [$order, , $firstStore, , $firstAllocation, , $secondPic, $secondStore] = $this->sharedOrder();

        $this->actingAs($secondPic)->get(route('store.incoming.show', [
            'purchase_order' => $order, 'store_id' => $firstStore->id,
        ]))->assertForbidden();
        $this->actingAs($secondPic)->post(route('store.incoming.receipts.store', $order), $this->payload($firstStore, $firstAllocation->id, '1'))
            ->assertForbidden();
        $this->actingAs($secondPic)->get(route('store.incoming.index', ['store_id' => $secondStore->id]))->assertOk();
        $this->assertDatabaseCount('receipts', 0);
    }

    public function test_order_must_be_waiting_before_store_can_receive(): void
    {
        [$order, $pic, $store, , $allocation] = $this->singleStoreOrder();
        $order->update(['status' => PurchaseOrderStatus::DRAFT]);

        $this->actingAs($pic)->post(route('store.incoming.receipts.store', $order), $this->payload($store, $allocation->id, '1'))
            ->assertSessionHasErrors('status');
        $this->assertDatabaseCount('receipts', 0);
    }

    /** @return array<int, mixed> */
    private function sharedOrder(): array
    {
        $firstStore = Store::factory()->create(['code' => 'PP']);
        $secondStore = Store::factory()->create(['code' => 'PIM']);
        $firstPic = User::factory()->create();
        $secondPic = User::factory()->create();
        $firstPic->stores()->attach($firstStore, ['is_pic' => true, 'is_active' => true]);
        $secondPic->stores()->attach($secondStore, ['is_pic' => true, 'is_active' => true]);
        [$item, $unit] = $this->item();
        $firstRequest = $this->orderedRequest($firstStore, $firstPic, $item, $unit, 10);
        $secondRequest = $this->orderedRequest($secondStore, $secondPic, $item, $unit, 5);
        $creator = User::factory()->create(['role' => UserRole::CENTRAL_ADMIN]);
        $order = PurchaseOrder::factory()->create([
            'status' => PurchaseOrderStatus::ORDERED, 'created_by' => $creator->id,
        ]);
        $orderItem = $order->items()->create([
            'item_type' => PurchaseRequestItemType::STOCK, 'item_id' => $item->id,
            'unit_id' => $unit->id, 'quantity' => 15,
        ]);
        $firstAllocation = $orderItem->allocations()->create([
            'purchase_request_item_id' => $firstRequest->items()->firstOrFail()->id, 'allocated_quantity' => 10,
        ]);
        $secondAllocation = $orderItem->allocations()->create([
            'purchase_request_item_id' => $secondRequest->items()->firstOrFail()->id, 'allocated_quantity' => 5,
        ]);

        return [$order, $firstPic, $firstStore, $item, $firstAllocation, $secondRequest->number, $secondPic, $secondStore, $secondAllocation];
    }

    /** @return array<int, mixed> */
    private function singleStoreOrder(): array
    {
        $values = $this->sharedOrder();
        $values[0]->items()->firstOrFail()->allocations()->whereKey($values[8]->id)->delete();
        $values[0]->items()->firstOrFail()->update(['quantity' => 10]);

        return $values;
    }

    /** @return array{Item, Unit} */
    private function item(): array
    {
        $unit = Unit::create(['name' => 'Piece', 'symbol' => 'pcs', 'is_active' => true]);
        $category = ItemCategory::create(['name' => 'Supplies', 'code' => 'SUP', 'is_active' => true]);
        $item = Item::create([
            'sku' => 'SUP-001', 'name' => 'Tissue Basah', 'item_category_id' => $category->id,
            'unit_id' => $unit->id, 'is_active' => true,
        ]);

        return [$item, $unit];
    }

    private function orderedRequest(Store $store, User $pic, Item $item, Unit $unit, int $quantity): PurchaseRequest
    {
        $request = PurchaseRequest::factory()->create([
            'store_id' => $store->id, 'requested_by' => $pic->id,
            'status' => PurchaseRequestStatus::PROCESSED, 'processed_at' => now(),
        ]);
        $request->items()->create([
            'type' => PurchaseRequestItemType::STOCK, 'item_id' => $item->id, 'unit_id' => $unit->id,
            'requested_quantity' => $quantity, 'approved_quantity' => $quantity,
            'status' => PurchaseRequestItemStatus::APPROVED,
        ]);

        return $request;
    }

    /** @return array<string, mixed> */
    private function payload(Store $store, int $allocationId, string $quantity): array
    {
        return [
            'store_id' => $store->id, 'received_at' => now()->subMinute()->format('Y-m-d H:i:s'),
            'notes' => 'Diterima baik',
            'items' => [['allocation_id' => $allocationId, 'received_quantity' => $quantity]],
        ];
    }
}

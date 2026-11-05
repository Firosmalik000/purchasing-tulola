<?php

namespace Tests\Feature;

use App\Actions\Requests\SavePurchaseRequestDraft;
use App\Actions\Requests\SubmitPurchaseRequest;
use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemType;
use App\Enums\PurchaseRequestStatus;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderRequestItem;
use App\Models\PurchaseRequest;
use App\Models\Store;
use App\Models\StoreStock;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StockReservationTest extends TestCase
{
    use RefreshDatabase;

    public function test_submitted_request_blocks_other_store_on_both_submission_paths_and_form(): void
    {
        [$pic, $first, $second, $item] = $this->fixtures();
        $draft = $this->request($pic, $second, $item, 2, 'draft');
        $this->request($pic, $first, $item, 2);

        $this->actingAs($pic)->post(route('store.requests.store'), $this->payload($second, $item, 2))
            ->assertSessionHasErrors(['stock', 'stock_items.0.requested_quantity']);
        $this->actingAs($pic)->post(route('store.requests.submit', $draft))->assertSessionHasErrors('stock');
        $this->actingAs($pic)->put(route('store.requests.update', $draft), $this->payload($second, $item, 2))
            ->assertSessionHasErrors(['stock', 'stock_items.0.requested_quantity']);
        $this->assertSame(PurchaseRequestStatus::DRAFT, $draft->fresh()->status);
        $this->actingAs($pic)->get(route('store.requests.create', ['store_id' => $second->id]))
            ->assertInertia(fn (Assert $page) => $page->where('items.0.central_stock', 0));
        $this->assertSame(2, StoreStock::firstOrFail()->quantity);
    }

    public function test_rejection_releases_reservation_and_restock_only_exposes_free_stock(): void
    {
        [$pic, $first, $second, $item, $stock] = $this->fixtures();
        $request = $this->request($pic, $first, $item, 2);
        $stock->update(['quantity' => 3]);
        $this->request($pic, $second, $item, 1);
        $this->actingAs($pic)->post(route('store.requests.store'), $this->payload($first, $item, 1))->assertSessionHasErrors('stock');
        $admin = User::factory()->centralAdmin()->create();
        $this->actingAs($admin)->post(route('central.requests.reject', $request), ['reason' => 'Tidak diperlukan'])
            ->assertSessionHasNoErrors();
        $this->request($pic, $first, $item, 2);
    }

    public function test_partial_approval_and_order_cancellation_release_only_their_reservations(): void
    {
        [$pic, $first, $second, $item] = $this->fixtures();
        $request = $this->request($pic, $first, $item, 2);
        $order = $this->approve($request, 1);
        $this->request($pic, $second, $item, 1);
        $this->actingAs($pic)->post(route('store.requests.store'), $this->payload($first, $item, 1))->assertSessionHasErrors('stock');
        $this->actingAs(User::factory()->centralAdmin()->create())->post(route('central.orders.cancel', $order))
            ->assertSessionHasNoErrors();
        $this->request($pic, $first, $item, 1);
    }

    public function test_approval_rechecks_stock_and_preserves_other_submitted_reservations(): void
    {
        [$pic, $first, $second, $item, $stock] = $this->fixtures();
        $request = $this->request($pic, $first, $item, 1);
        $this->request($pic, $second, $item, 1);
        $stock->update(['quantity' => 1]);
        $line = $request->items()->firstOrFail();
        $this->actingAs(User::factory()->superAdmin()->create())
            ->post(route('central.requests.process', $request), ['items' => [['id' => $line->id, 'approved_quantity' => 1]]])
            ->assertSessionHasErrors('stock');
        $this->assertSame(PurchaseRequestStatus::SUBMITTED, $request->fresh()->status);
        $this->assertDatabaseCount('purchase_orders', 0);
    }

    public function test_receipt_consumes_reserved_stock_once_and_short_stock_rolls_back(): void
    {
        [$pic, $first, $second, $item, $stock] = $this->fixtures();
        $order = $this->approve($this->request($pic, $first, $item, 2), 2);
        $this->actingAs(User::factory()->centralAdmin()->create())->post(route('central.orders.place', $order))
            ->assertSessionHasNoErrors();
        $allocation = $order->items()->firstOrFail()->allocations()->firstOrFail();
        $payload = ['store_id' => $first->id, 'received_at' => now()->format('Y-m-d\TH:i'),
            'items' => [['allocation_id' => $allocation->id, 'received_quantity' => 1]]];
        $this->actingAs($pic)->post(route('store.incoming.receipts.store', $order), $payload)->assertSessionHasNoErrors();
        $this->assertSame(1, $stock->fresh()->quantity);
        $this->assertSame(PurchaseOrderStatus::PARTIALLY_RECEIVED, $order->fresh()->status);
        $this->actingAs($pic)->post(route('store.requests.store'), $this->payload($second, $item, 1))->assertSessionHasErrors('stock');

        $stock->update(['quantity' => 0]);
        $this->actingAs($pic)->post(route('store.incoming.receipts.store', $order), $payload)->assertSessionHasErrors('stock');
        $this->assertDatabaseCount('receipts', 1);
        $this->assertDatabaseCount('stock_movements', 2);
        $this->assertSame(1, StoreStock::where('store_id', $first->id)->firstOrFail()->quantity);

        $stock->update(['quantity' => 2]);
        $this->actingAs($pic)->post(route('store.incoming.receipts.store', $order), $payload)->assertSessionHasNoErrors();
        $this->assertSame(1, $stock->fresh()->quantity);
        $this->assertSame(PurchaseOrderStatus::COMPLETED, $order->fresh()->status);
        $this->request($pic, $second, $item, 1);
    }

    public function test_two_independent_pics_can_each_reserve_one_and_approve_without_double_counting(): void
    {
        [$firstPic, $first, $second, $item] = $this->fixtures();
        $secondPic = User::factory()->create();
        $secondPic->stores()->attach($second, ['is_pic' => true, 'is_active' => true]);
        $firstRequest = $this->request($firstPic, $first, $item, 1);
        $secondRequest = $this->request($secondPic, $second, $item, 1);
        $this->actingAs($secondPic)->post(route('store.requests.store'), $this->payload($first, $item, 1))
            ->assertSessionHasErrors('store_id');
        $firstOrder = $this->approve($firstRequest, 1);
        $secondOrder = $this->approve($secondRequest, 1);
        $this->actingAs($firstPic)->post(route('store.requests.store'), $this->payload($first, $item, 1))
            ->assertSessionHasErrors('stock');
        $this->actingAs($firstPic)->post(route('store.requests.submit', $firstRequest))->assertForbidden();
        $this->actingAs(User::factory()->centralAdmin()->create())->post(route('central.orders.place', $firstOrder))->assertSessionHasNoErrors();
        $this->actingAs(User::factory()->centralAdmin()->create())->post(route('central.orders.place', $secondOrder))->assertSessionHasNoErrors();
        $this->actingAs($firstPic)->post(route('store.incoming.receipts.store', $firstOrder), $this->receiptPayload($firstOrder, $first, 1))
            ->assertSessionHasNoErrors();
        $this->actingAs($secondPic)->post(route('store.incoming.receipts.store', $secondOrder), $this->receiptPayload($secondOrder, $second, 1))
            ->assertSessionHasNoErrors();
        $this->assertSame(0, StoreStock::whereHas('store', fn ($query) => $query->where('code', 'HO-JKT'))->firstOrFail()->quantity);
        $this->assertDatabaseCount('receipts', 2);
        $this->assertDatabaseCount('stock_movements', 4);
    }

    public function test_failed_multi_item_submission_does_not_reserve_the_other_item(): void
    {
        [$pic, $first, $second, $item, $stock] = $this->fixtures();
        $other = $this->otherItem($item, $stock);
        $this->request($pic, $first, $item, 2);
        $payload = $this->payload($second, $other, 2);
        $payload['stock_items'][] = ['item_id' => $item->id, 'requested_quantity' => 1];
        $this->actingAs($pic)->post(route('store.requests.store'), $payload)->assertSessionHasErrors('stock');
        $this->assertDatabaseCount('purchase_requests', 1);
        $this->request($pic, $second, $other, 2);
        $this->assertDatabaseCount('purchase_requests', 2);
        $this->assertDatabaseCount('stock_movements', 0);
    }

    public function test_multi_item_approval_and_receipt_are_atomic_when_one_stock_is_short(): void
    {
        [$pic, $first, , $item, $stock] = $this->fixtures();
        $other = $this->otherItem($item, $stock);
        $payload = $this->payload($first, $item, 2);
        $payload['stock_items'][] = ['item_id' => $other->id, 'requested_quantity' => 2];
        $this->actingAs($pic)->post(route('store.requests.store'), $payload)->assertSessionHasNoErrors();
        $request = PurchaseRequest::latest('id')->firstOrFail();
        $approval = ['items' => $request->items->map(fn ($line) => ['id' => $line->id, 'approved_quantity' => 2])->all()];
        $otherStock = StoreStock::where('store_id', $stock->store_id)->where('item_id', $other->id)->firstOrFail();
        $otherStock->update(['quantity' => 1]);
        $admin = User::factory()->centralAdmin()->create();
        $this->actingAs($admin)->post(route('central.requests.process', $request), $approval)->assertSessionHasErrors('stock');
        $this->assertSame(PurchaseRequestStatus::SUBMITTED, $request->fresh()->status);
        $this->assertSame(0, $request->items()->whereNotNull('approved_quantity')->count());
        $this->assertDatabaseCount('purchase_orders', 0);
        $this->assertDatabaseMissing('activity_logs', ['action' => 'purchase_request.processed']);
        $otherStock->update(['quantity' => 2]);
        $this->actingAs($admin)->post(route('central.requests.process', $request), $approval)->assertSessionHasNoErrors();
        $order = PurchaseOrder::where('purchase_request_id', $request->id)->firstOrFail();
        $this->actingAs($admin)->post(route('central.orders.place', $order))->assertSessionHasNoErrors();
        $otherStock->update(['quantity' => 1]);
        $this->actingAs($pic)->post(route('store.incoming.receipts.store', $order), $this->receiptPayload($order, $first, 2))
            ->assertSessionHasErrors('stock');
        $this->assertDatabaseCount('receipts', 0);
        $this->assertDatabaseCount('receipt_items', 0);
        $this->assertDatabaseCount('stock_movements', 0);
        $this->assertDatabaseMissing('activity_logs', ['action' => 'receipt.confirmed']);
        $this->assertSame(2, $stock->fresh()->quantity);
        $this->assertSame(PurchaseOrderStatus::ORDERED, $order->fresh()->status);
        $this->assertSame(0, StoreStock::where('store_id', $first->id)->count());
        $otherStock->update(['quantity' => 2]);
        $this->actingAs($pic)->post(route('store.incoming.receipts.store', $order), $this->receiptPayload($order, $first, 2))
            ->assertSessionHasNoErrors();
        $this->assertSame(0, $stock->fresh()->quantity);
        $this->assertSame(0, $otherStock->fresh()->quantity);
        $this->assertSame(PurchaseOrderStatus::COMPLETED, $order->fresh()->status);
        $this->assertDatabaseCount('stock_movements', 4);
    }

    public function test_receipt_aggregates_same_item_across_allocations_and_preserves_other_store_reservation(): void
    {
        [$pic, $first, $second, $item, $stock] = $this->fixtures();
        $stock->update(['quantity' => 3]);
        $firstOrder = $this->approve($this->request($pic, $first, $item, 1), 1);
        $secondOrder = $this->approve($this->request($pic, $first, $item, 1), 1);
        $thirdOrder = $this->approve($this->request($pic, $second, $item, 1), 1);
        // A shared order can contain several allocations of the same item.
        $firstItem = $firstOrder->items()->firstOrFail();
        $secondItem = $secondOrder->items()->firstOrFail();
        $thirdItem = $thirdOrder->items()->firstOrFail();
        $secondItem->allocations()->update(['purchase_order_item_id' => $firstItem->id]);
        $thirdItem->allocations()->update(['purchase_order_item_id' => $firstItem->id]);
        $firstItem->update(['quantity' => 3]);
        $firstOrder->update(['purchase_request_id' => null]);
        $secondOrder->delete();
        $thirdOrder->delete();
        $this->actingAs(User::factory()->centralAdmin()->create())->post(route('central.orders.place', $firstOrder))->assertSessionHasNoErrors();
        $allocations = PurchaseOrderRequestItem::where('purchase_order_item_id', $firstItem->id)
            ->whereHas('purchaseRequestItem.purchaseRequest', fn ($query) => $query->where('store_id', $first->id))->get();
        $payload = ['store_id' => $first->id, 'received_at' => now()->format('Y-m-d\TH:i'),
            'items' => $allocations->map(fn ($allocation) => ['allocation_id' => $allocation->id, 'received_quantity' => 1])->all()];
        $stock->update(['quantity' => 1]);
        $this->actingAs($pic)->post(route('store.incoming.receipts.store', $firstOrder), $payload)->assertSessionHasErrors('stock');
        $this->assertDatabaseCount('receipts', 0);
        $this->assertDatabaseCount('stock_movements', 0);
        $stock->update(['quantity' => 3]);
        $this->actingAs($pic)->post(route('store.incoming.receipts.store', $firstOrder), $payload)->assertSessionHasNoErrors();
        $this->assertSame(1, $stock->fresh()->quantity);
        $this->assertSame(PurchaseOrderStatus::PARTIALLY_RECEIVED, $firstOrder->fresh()->status);
        $this->actingAs($pic)->get(route('store.requests.create'))->assertInertia(fn (Assert $page) => $page->where('items.0.central_stock', 0));
        $this->assertDatabaseHas('store_stocks', ['store_id' => $first->id, 'item_id' => $item->id, 'quantity' => 2]);
        $this->assertDatabaseCount('stock_movements', 2);
    }

    public function test_special_request_order_and_receipt_do_not_consume_regular_stock(): void
    {
        [$pic, $first, $second, $item, $stock] = $this->fixtures();
        $this->actingAs($pic)->post(route('store.requests.store'), [
            'store_id' => $first->id, 'action' => 'submit',
            'special_items' => [['name' => 'Custom', 'unit_id' => $item->unit_id, 'requested_quantity' => 99, 'reason' => 'Event']],
        ])->assertSessionHasNoErrors();
        $request = PurchaseRequest::latest('id')->firstOrFail();
        $order = $this->approve($request, 99);
        $this->request($pic, $second, $item, 2);
        $this->actingAs(User::factory()->centralAdmin()->create())->post(route('central.orders.place', $order))->assertSessionHasNoErrors();
        $this->actingAs($pic)->post(route('store.incoming.receipts.store', $order), $this->receiptPayload($order, $first, 99))->assertSessionHasNoErrors();
        $this->assertSame(2, $stock->fresh()->quantity);
        $this->assertDatabaseCount('stock_movements', 0);
        $this->assertSame(PurchaseOrderStatus::COMPLETED, $order->fresh()->status);
    }

    public function test_deleted_stock_record_prevents_receipt_without_creating_any_balance_or_ledger(): void
    {
        [$pic, $first, , $item, $stock] = $this->fixtures();
        $order = $this->approve($this->request($pic, $first, $item, 2), 2);
        $this->actingAs(User::factory()->centralAdmin()->create())->post(route('central.orders.place', $order))->assertSessionHasNoErrors();
        $stock->delete();
        $this->actingAs($pic)->post(route('store.incoming.receipts.store', $order), $this->receiptPayload($order, $first, 2))->assertSessionHasErrors('stock');
        $this->assertDatabaseCount('receipts', 0);
        $this->assertDatabaseCount('store_stocks', 0);
        $this->assertDatabaseCount('stock_movements', 0);
    }

    public function test_legacy_duplicate_lines_cannot_overreserve_when_submitting_a_draft(): void
    {
        [$pic, $first, , $item] = $this->fixtures();
        $draft = $this->request($pic, $first, $item, 2, 'draft');
        $draft->items()->create(['type' => PurchaseRequestItemType::STOCK, 'item_id' => $item->id, 'unit_id' => $item->unit_id, 'requested_quantity' => 1]);
        $this->actingAs($pic)->post(route('store.requests.submit', $draft))->assertSessionHasErrors('stock');
        $this->assertSame(PurchaseRequestStatus::DRAFT, $draft->fresh()->status);
        $this->assertDatabaseMissing('purchase_request_status_histories', ['purchase_request_id' => $draft->id, 'to_status' => 'SUBMITTED']);
    }

    public function test_transaction_recheck_rejects_a_draft_after_another_request_reserves_stock(): void
    {
        [$pic, $first, $second, $item] = $this->fixtures();
        $draft = $this->request($pic, $second, $item, 2, 'draft');
        $this->actingAs($pic)->get(route('store.requests.edit', $draft))->assertInertia(fn (Assert $page) => $page->where('items.0.central_stock', 2));
        $this->request($pic, $first, $item, 2);
        try {
            app(SubmitPurchaseRequest::class)->handle($draft, $pic);
            $this->fail('The action must reject a stale stock snapshot even without Form Request validation.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('stock', $exception->errors());
        }
        $this->assertSame(PurchaseRequestStatus::DRAFT, $draft->fresh()->status);
    }

    public function test_stale_draft_cannot_be_rewritten_after_it_has_been_submitted(): void
    {
        [$pic, $first, , $item] = $this->fixtures();
        $draft = $this->request($pic, $first, $item, 2, 'draft');
        // Simulate a draft edit already authorized before a competing submit commits.
        $this->actingAs($pic)->post(route('store.requests.submit', $draft))->assertSessionHasNoErrors();
        try {
            app(SavePurchaseRequestDraft::class)->handle($first, $pic, $this->payload($first, $item, 99, 'draft'), $draft);
            $this->fail('A stale edit must not increase an already submitted reservation.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('status', $exception->errors());
        }
        $this->assertSame(PurchaseRequestStatus::SUBMITTED, $draft->fresh()->status);
        $this->assertSame(2, $draft->items()->firstOrFail()->requested_quantity);
    }

    /** @return array<string, mixed> */
    private function receiptPayload(PurchaseOrder $order, Store $store, int $quantity): array
    {
        return ['store_id' => $store->id, 'received_at' => now()->format('Y-m-d\TH:i'),
            'items' => PurchaseOrderRequestItem::whereHas('purchaseOrderItem', fn ($query) => $query->where('purchase_order_id', $order->id))
                ->get()->map(fn ($allocation) => ['allocation_id' => $allocation->id, 'received_quantity' => $quantity])->all()];
    }

    private function otherItem(Item $item, StoreStock $stock): Item
    {
        $other = Item::create(['sku' => 'SUP-2', 'name' => 'Other item', 'item_category_id' => $item->item_category_id, 'unit_id' => $item->unit_id, 'is_active' => true]);
        StoreStock::create(['store_id' => $stock->store_id, 'item_id' => $other->id, 'quantity' => 2]);

        return $other;
    }

    /** @return array{User, Store, Store, Item, StoreStock} */
    private function fixtures(): array
    {
        $pic = User::factory()->create();
        $central = Store::factory()->create(['code' => 'HO-JKT']);
        $first = Store::factory()->create(['code' => 'A']);
        $second = Store::factory()->create(['code' => 'B']);
        $pic->stores()->attach([$first->id => ['is_active' => true, 'is_pic' => true], $second->id => ['is_active' => true, 'is_pic' => true]]);
        $unit = Unit::create(['name' => 'Piece', 'symbol' => 'pcs', 'is_active' => true]);
        $category = ItemCategory::create(['name' => 'Supplies', 'code' => 'SUP', 'is_active' => true]);
        $item = Item::create(['sku' => 'SUP-1', 'name' => 'Item', 'item_category_id' => $category->id, 'unit_id' => $unit->id, 'is_active' => true]);
        $stock = StoreStock::create(['store_id' => $central->id, 'item_id' => $item->id, 'quantity' => 2]);

        return [$pic, $first, $second, $item, $stock];
    }

    /** @return array<string, mixed> */
    private function payload(Store $store, Item $item, int $quantity, string $action = 'submit'): array
    {
        return ['store_id' => $store->id, 'action' => $action, 'stock_items' => [['item_id' => $item->id, 'requested_quantity' => $quantity]]];
    }

    private function request(User $pic, Store $store, Item $item, int $quantity, string $action = 'submit'): PurchaseRequest
    {
        $this->actingAs($pic)->post(route('store.requests.store'), $this->payload($store, $item, $quantity, $action))->assertSessionHasNoErrors();

        return PurchaseRequest::latest('id')->firstOrFail();
    }

    private function approve(PurchaseRequest $request, int $quantity): PurchaseOrder
    {
        $line = $request->items()->firstOrFail();
        $this->actingAs(User::factory()->centralAdmin()->create())->post(route('central.requests.process', $request), [
            'items' => [['id' => $line->id, 'approved_quantity' => $quantity]],
        ])->assertSessionHasNoErrors();

        return PurchaseOrder::where('purchase_request_id', $request->id)->firstOrFail();
    }
}

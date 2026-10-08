<?php

namespace Tests\Feature\Central;

use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemStatus;
use App\Enums\PurchaseRequestItemType;
use App\Enums\PurchaseRequestStatus;
use App\Enums\UserRole;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\Store;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PurchasePlanningAndOrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_planning_aggregates_processed_lines_and_excludes_zero_or_fully_allocated_lines(): void
    {
        $user = User::factory()->centralAdmin()->create();
        [$first, $second] = $this->processedStockLines();
        $rejected = $this->processedSpecialLine(approved: 0);

        $this->actingAs($user)->get(route('central.planning.index', ['group_by' => 'item']))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('central/planning/index')
            ->has('plan.data', 1)
            ->where('plan.data.0.total_approved', '15.000')
            ->where('plan.data.0.total_available', '15.000')
            ->has('plan.data.0.lines', 2));

        $this->assertSame(PurchaseRequestItemStatus::REJECTED, $rejected->status);
    }

    public function test_central_can_create_consolidated_order_with_normalized_source_allocations(): void
    {
        $user = User::factory()->centralAdmin()->create();
        [$first, $second] = $this->processedStockLines();
        $supplier = Supplier::create(['code' => 'SUP', 'name' => 'Supplier', 'is_active' => true]);

        $this->actingAs($user)->post(route('central.orders.store'), [
            'supplier_id' => $supplier->id, 'order_date' => now()->toDateString(),
            'allocations' => [
                $first->id => ['purchase_request_item_id' => $first->id, 'allocated_quantity' => 10],
                $second->id => ['purchase_request_item_id' => $second->id, 'allocated_quantity' => 5],
            ],
        ])->assertSessionHasNoErrors();

        $order = PurchaseOrder::firstOrFail();
        $this->assertSame('ORD/'.now()->format('Y/m').'/0001', $order->number);
        $this->assertDatabaseCount('purchase_order_items', 1);
        $this->assertDatabaseHas('purchase_order_items', ['purchase_order_id' => $order->id, 'quantity' => 15]);
        $this->assertDatabaseHas('purchase_order_request_items', ['purchase_request_item_id' => $first->id, 'allocated_quantity' => 10]);
        $this->assertDatabaseHas('purchase_order_request_items', ['purchase_request_item_id' => $second->id, 'allocated_quantity' => 5]);
        $this->assertDatabaseHas('activity_logs', ['action' => 'purchase_order.created', 'entity_id' => $order->id]);
    }

    public function test_special_lines_remain_separate_order_lines(): void
    {
        $user = User::factory()->centralAdmin()->create();
        $first = $this->processedSpecialLine('Standing Flower');
        $second = $this->processedSpecialLine('Display Acrylic');

        $this->actingAs($user)->post(route('central.orders.store'), [
            'order_date' => now()->toDateString(),
            'allocations' => [
                ['purchase_request_item_id' => $first->id, 'allocated_quantity' => 1],
                ['purchase_request_item_id' => $second->id, 'allocated_quantity' => 1],
            ],
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseCount('purchase_order_items', 2);
    }

    public function test_allocation_cannot_exceed_approved_or_be_allocated_twice(): void
    {
        $user = User::factory()->centralAdmin()->create();
        [$line] = $this->processedStockLines();

        $this->actingAs($user)->post(route('central.orders.store'), [
            'order_date' => now()->toDateString(),
            'allocations' => [['purchase_request_item_id' => $line->id, 'allocated_quantity' => 11]],
        ])->assertSessionHasErrors("allocations.{$line->id}.allocated_quantity");
        $this->assertDatabaseCount('purchase_orders', 0);

        $payload = ['order_date' => now()->toDateString(), 'allocations' => [['purchase_request_item_id' => $line->id, 'allocated_quantity' => 10]]];
        $this->actingAs($user)->post(route('central.orders.store'), $payload)->assertSessionHasNoErrors();
        $this->actingAs($user)->post(route('central.orders.store'), $payload)->assertSessionHasErrors("allocations.{$line->id}.allocated_quantity");
        $this->assertDatabaseCount('purchase_orders', 1);
    }

    public function test_order_prices_and_totals_are_calculated_server_side(): void
    {
        $user = User::factory()->centralAdmin()->create();
        [$line] = $this->processedStockLines();
        $order = $this->createOrder($user, [$line->id => '2.500']);
        $item = $order->items()->firstOrFail();

        $this->actingAs($user)->put(route('central.orders.update', $order), [
            'order_date' => now()->toDateString(),
            'items' => [$item->id => ['id' => $item->id, 'unit_price' => '12345.67', 'total' => 1]],
        ])->assertSessionHasNoErrors();

        $this->assertSame('30864.18', $item->fresh()->total);
        $this->assertSame('12345.67', $item->fresh()->unit_price);
    }

    public function test_placing_fully_allocated_order_marks_requests_ordered_and_advances_order(): void
    {
        $user = User::factory()->centralAdmin()->create();
        [$first, $second] = $this->processedStockLines();
        $order = $this->createOrder($user, [$first->id => '10', $second->id => '5']);

        $this->actingAs($user)->post(route('central.orders.place', $order))->assertSessionHasNoErrors();
        $this->assertSame(PurchaseOrderStatus::ORDERED, $order->fresh()->status);
        $this->assertSame(PurchaseRequestStatus::ORDERED, $first->purchaseRequest->fresh()->status);
        $this->assertSame(PurchaseRequestStatus::ORDERED, $second->purchaseRequest->fresh()->status);
        $this->assertDatabaseHas('purchase_request_status_histories', ['purchase_request_id' => $first->purchase_request_id, 'to_status' => PurchaseRequestStatus::ORDERED->value]);

        $this->actingAs($user)->post(route('central.orders.wait-for-receipt', $order))->assertSessionHasNoErrors();
        $this->assertSame(PurchaseOrderStatus::WAITING_RECEIPT, $order->fresh()->status);
    }

    public function test_partial_allocation_does_not_mark_request_ordered(): void
    {
        $user = User::factory()->centralAdmin()->create();
        [$line] = $this->processedStockLines();
        $order = $this->createOrder($user, [$line->id => '4']);

        $this->actingAs($user)->post(route('central.orders.place', $order))->assertSessionHasNoErrors();
        $this->assertSame(PurchaseRequestStatus::PROCESSED, $line->purchaseRequest->fresh()->status);
    }

    public function test_order_cannot_be_placed_before_prices_are_completed(): void
    {
        $user = User::factory()->centralAdmin()->create();
        [$line] = $this->processedStockLines();
        $order = $this->createOrder($user, [$line->id => '1'], updatePrices: false);

        $this->actingAs($user)->post(route('central.orders.place', $order))->assertSessionHasErrors('items');
        $this->assertSame(PurchaseOrderStatus::DRAFT, $order->fresh()->status);
    }

    public function test_cancelling_draft_releases_allocation_back_to_planning(): void
    {
        $user = User::factory()->centralAdmin()->create();
        [$line] = $this->processedStockLines();
        $order = $this->createOrder($user, [$line->id => '10']);

        $this->actingAs($user)->post(route('central.orders.cancel', $order))->assertSessionHasNoErrors();
        $this->assertSame(PurchaseOrderStatus::CANCELLED, $order->fresh()->status);
        $this->actingAs($user)->get(route('central.planning.index'))->assertInertia(fn (Assert $page) => $page
            ->where('plan.data.0.total_available', '15.000'));
    }

    public function test_permissions_and_invalid_order_transitions_are_enforced(): void
    {
        $management = User::factory()->create(['role' => UserRole::MANAGEMENT]);
        $purchasing = User::factory()->create(['role' => UserRole::PURCHASING]);
        $pic = User::factory()->create();
        [$line] = $this->processedStockLines();

        $payload = ['order_date' => now()->toDateString(), 'allocations' => [['purchase_request_item_id' => $line->id, 'allocated_quantity' => 1]]];
        $this->actingAs($management)->get(route('central.orders.index'))->assertOk();
        $this->actingAs($management)->post(route('central.orders.store'), $payload)->assertForbidden();
        $this->actingAs($pic)->get(route('central.orders.index'))->assertForbidden();
        $this->actingAs($purchasing)->post(route('central.orders.store'), $payload)->assertSessionHasNoErrors();
        $order = PurchaseOrder::firstOrFail();
        $this->actingAs($purchasing)->post(route('central.orders.wait-for-receipt', $order))->assertForbidden();
    }

    /** @return array{PurchaseRequestItem, PurchaseRequestItem} */
    private function processedStockLines(): array
    {
        $unit = Unit::firstOrCreate(['symbol' => 'pcs'], ['name' => 'Piece', 'is_active' => true]);
        $category = ItemCategory::firstOrCreate(['code' => 'ATK'], ['name' => 'ATK', 'is_active' => true]);
        $item = Item::firstOrCreate(['sku' => 'ATK-001'], ['name' => 'Pulpen', 'item_category_id' => $category->id, 'unit_id' => $unit->id, 'is_active' => true]);

        return [
            $this->processedLine(Store::factory()->create(['code' => 'PP']), $unit, PurchaseRequestItemType::STOCK, 10, $item),
            $this->processedLine(Store::factory()->create(['code' => 'PIM']), $unit, PurchaseRequestItemType::STOCK, 5, $item),
        ];
    }

    private function processedSpecialLine(string $name = 'Standing Flower', float $approved = 2): PurchaseRequestItem
    {
        $unit = Unit::firstOrCreate(['symbol' => 'unit'], ['name' => 'Unit', 'is_active' => true]);

        return $this->processedLine(Store::factory()->create(), $unit, PurchaseRequestItemType::SPECIAL, $approved, null, $name);
    }

    private function processedLine(Store $store, Unit $unit, PurchaseRequestItemType $type, float $approved, ?Item $item = null, ?string $name = null): PurchaseRequestItem
    {
        $request = PurchaseRequest::factory()->create(['store_id' => $store->id, 'status' => PurchaseRequestStatus::PROCESSED, 'processed_at' => now()]);

        return $request->items()->create([
            'type' => $type, 'item_id' => $item?->id, 'name' => $name, 'unit_id' => $unit->id,
            'requested_quantity' => max($approved, 1), 'approved_quantity' => $approved,
            'status' => $approved > 0 ? PurchaseRequestItemStatus::APPROVED : PurchaseRequestItemStatus::REJECTED,
        ]);
    }

    /** @param array<int, string> $allocations */
    private function createOrder(User $user, array $allocations, bool $updatePrices = true): PurchaseOrder
    {
        $payload = collect($allocations)->map(fn ($quantity, $id) => ['purchase_request_item_id' => $id, 'allocated_quantity' => $quantity])->values()->all();
        $this->actingAs($user)->post(route('central.orders.store'), ['order_date' => now()->toDateString(), 'allocations' => $payload])->assertSessionHasNoErrors();

        $order = PurchaseOrder::latest('id')->firstOrFail();
        if ($updatePrices) {
            $prices = $order->items()->get()->mapWithKeys(fn ($item) => [$item->id => ['id' => $item->id, 'unit_price' => '100.00']])->all();
            $this->actingAs($user)->put(route('central.orders.update', $order), [
                'order_date' => now()->toDateString(), 'items' => $prices,
            ])->assertSessionHasNoErrors();
        }

        return $order;
    }
}

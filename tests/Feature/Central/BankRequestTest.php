<?php

namespace Tests\Feature\Central;

use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemStatus;
use App\Enums\PurchaseRequestItemType;
use App\Enums\PurchaseRequestStatus;
use App\Models\ItemCategory;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\Store;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BankRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_special_item_can_be_deferred_to_bank_permintaan_and_excluded_from_immediate_po(): void
    {
        $admin = User::factory()->centralAdmin()->create();
        [$request, $stockLine, $specialLine] = $this->submittedRequest();

        $this->actingAs($admin)->post(route('central.requests.process', $request), [
            'items' => [
                $stockLine->id => ['id' => $stockLine->id, 'approved_quantity' => 5, 'decision' => 'APPROVED'],
                $specialLine->id => ['id' => $specialLine->id, 'approved_quantity' => 2, 'decision' => 'BANK_PERMINTAAN'],
            ],
            'notes' => 'Special item ditunda ke Bank Permintaan.',
        ])->assertRedirect(route('central.requests.show', $request));

        $request->refresh();
        $this->assertSame(PurchaseRequestStatus::PROCESSED, $request->status);

        // Verify stock line was approved and special line marked as BANK_PERMINTAAN
        $this->assertDatabaseHas('purchase_request_items', [
            'id' => $stockLine->id,
            'approved_quantity' => 5,
            'status' => PurchaseRequestItemStatus::APPROVED->value,
        ]);
        $this->assertDatabaseHas('purchase_request_items', [
            'id' => $specialLine->id,
            'approved_quantity' => 0,
            'bank_quantity' => 2,
            'status' => PurchaseRequestItemStatus::BANK_PERMINTAAN->value,
        ]);

        // Immediate PO should only contain the stock line
        $order = PurchaseOrder::query()->where('purchase_request_id', $request->id)->firstOrFail();
        $this->assertSame(1, $order->items()->count());
        $this->assertSame(PurchaseRequestItemType::STOCK, $order->items()->first()->item_type);
        $this->assertSame(5, $order->items()->first()->quantity);
    }

    public function test_special_item_can_be_split_between_approved_bank_and_rejected(): void
    {
        $admin = User::factory()->centralAdmin()->create();
        $store = Store::factory()->create();
        $unit = Unit::create(['name' => 'Piece', 'symbol' => 'pcs', 'is_active' => true]);
        $request = PurchaseRequest::factory()->submitted()->create(['store_id' => $store->id]);
        $specialLine = $request->items()->create([
            'type' => PurchaseRequestItemType::SPECIAL,
            'name' => 'Custom Display Booth',
            'unit_id' => $unit->id,
            'requested_quantity' => 5,
        ]);

        // Requested: 5 -> Approved: 2, Bank: 1, Rejected: 2 (remainder)
        $this->actingAs($admin)->post(route('central.requests.process', $request), [
            'items' => [
                $specialLine->id => [
                    'id' => $specialLine->id,
                    'approved_quantity' => 2,
                    'bank_quantity' => 1,
                    'decision' => 'SPLIT',
                ],
            ],
            'notes' => 'Disetujui 2 sekarang, 1 ditunda ke Bank Permintaan, sisanya ditolak.',
        ])->assertRedirect(route('central.requests.show', $request));

        $specialLine->refresh();
        $this->assertSame(2, $specialLine->approved_quantity);
        $this->assertSame(1, $specialLine->bank_quantity);
        $this->assertSame(PurchaseRequestItemStatus::PARTIALLY_APPROVED, $specialLine->status);

        // Immediate PO must contain approved quantity 2
        $immediateOrder = PurchaseOrder::query()->where('purchase_request_id', $request->id)->firstOrFail();
        $this->assertSame(1, $immediateOrder->items()->count());
        $this->assertSame(2, $immediateOrder->items()->first()->quantity);

        // Bank Request index lists this item with quantity 1
        $this->actingAs($admin)->get(route('central.bank-requests.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('central/bank-requests/index')
                ->has('items.data', 1)
                ->where('items.data.0.id', $specialLine->id)
                ->where('items.data.0.bank_quantity', 1)
                ->where('stats.total_items', 1)
                ->where('stats.total_quantity', 1));

        // When ready, create order from Bank Permintaan for quantity 1
        $response = $this->actingAs($admin)->post(route('central.bank-requests.create-order'), [
            'items' => [
                ['id' => $specialLine->id, 'quantity' => 1],
            ],
            'notes' => 'Pengadaan lanjutan dari Bank Permintaan.',
        ]);

        $bankOrder = PurchaseOrder::query()->latest('id')->firstOrFail();
        $response->assertRedirect(route('central.orders.show', $bankOrder));
        $this->assertNotSame($immediateOrder->id, $bankOrder->id);
        $this->assertSame(1, $bankOrder->items()->first()->quantity);

        // Line status remains PARTIALLY_APPROVED because only 3 out of 5 was approved (2 was rejected)
        $specialLine->refresh();
        $this->assertNotNull($specialLine->bank_ordered_at);
        $this->assertSame(PurchaseRequestItemStatus::PARTIALLY_APPROVED, $specialLine->status);

        // Item should no longer appear in Bank Permintaan backlog
        $this->actingAs($admin)->get(route('central.bank-requests.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('items.data', 0)
                ->where('stats.total_items', 0));
    }

    public function test_when_all_items_are_in_bank_permintaan_no_immediate_po_is_created(): void
    {
        $admin = User::factory()->centralAdmin()->create();
        $store = Store::factory()->create();
        $unit = Unit::create(['name' => 'Piece', 'symbol' => 'pcs', 'is_active' => true]);
        $request = PurchaseRequest::factory()->submitted()->create(['store_id' => $store->id]);
        $specialLine = $request->items()->create([
            'type' => PurchaseRequestItemType::SPECIAL,
            'name' => 'Banner Event Khusus',
            'unit_id' => $unit->id,
            'requested_quantity' => 3,
        ]);

        $this->actingAs($admin)->post(route('central.requests.process', $request), [
            'items' => [
                $specialLine->id => ['id' => $specialLine->id, 'approved_quantity' => 3, 'decision' => 'BANK_PERMINTAAN'],
            ],
            'notes' => 'Dianggarkan pada pengadaan berikutnya.',
        ])->assertRedirect(route('central.requests.show', $request));

        $request->refresh();
        $this->assertSame(PurchaseRequestStatus::PROCESSED, $request->status);
        $this->assertDatabaseHas('purchase_request_items', [
            'id' => $specialLine->id,
            'bank_quantity' => 3,
            'approved_quantity' => 0,
            'status' => PurchaseRequestItemStatus::BANK_PERMINTAAN->value,
        ]);

        // No draft PO should exist for this request
        $this->assertNull(PurchaseOrder::query()->where('purchase_request_id', $request->id)->first());
    }

    public function test_bank_requests_index_page_lists_pending_special_items(): void
    {
        $admin = User::factory()->centralAdmin()->create();
        [$request, , $specialLine] = $this->submittedRequest();
        $specialLine->update([
            'status' => PurchaseRequestItemStatus::BANK_PERMINTAAN,
            'bank_quantity' => 2,
            'approved_quantity' => 0,
        ]);

        $this->actingAs($admin)->get(route('central.bank-requests.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('central/bank-requests/index')
                ->has('items.data', 1)
                ->where('items.data.0.id', $specialLine->id)
                ->where('stats.total_items', 1)
                ->where('stats.total_quantity', 2));
    }

    public function test_central_can_create_new_purchase_order_from_bank_requests(): void
    {
        $admin = User::factory()->centralAdmin()->create();
        [$request, , $specialLine] = $this->submittedRequest();
        $specialLine->update([
            'status' => PurchaseRequestItemStatus::BANK_PERMINTAAN,
            'bank_quantity' => 2,
            'approved_quantity' => 0,
        ]);

        $response = $this->actingAs($admin)->post(route('central.bank-requests.create-order'), [
            'items' => [
                ['id' => $specialLine->id, 'quantity' => 2],
            ],
            'expected_date' => now()->addDays(7)->toDateString(),
            'notes' => 'Pengadaan khusus dari bank permintaan.',
        ]);

        $createdOrder = PurchaseOrder::query()->latest('id')->firstOrFail();
        $response->assertRedirect(route('central.orders.show', $createdOrder));

        $this->assertSame(PurchaseOrderStatus::DRAFT, $createdOrder->status);
        $this->assertSame('Pengadaan khusus dari bank permintaan.', $createdOrder->notes);
        $this->assertSame(1, $createdOrder->items()->count());
        $this->assertSame($specialLine->name, $createdOrder->items()->first()->name);
        $this->assertSame(2, $createdOrder->items()->first()->quantity);

        // Special line status should be updated to APPROVED (since bank 2 matches requested 2) and allocated
        $specialLine->refresh();
        $this->assertSame(PurchaseRequestItemStatus::APPROVED, $specialLine->status);
        $this->assertSame(1, $specialLine->orderAllocations()->count());

        // Item should no longer appear in Bank Permintaan
        $this->actingAs($admin)->get(route('central.bank-requests.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('central/bank-requests/index')
                ->has('items.data', 0)
                ->where('stats.total_items', 0));
    }

    /** @return array{PurchaseRequest, PurchaseRequestItem, PurchaseRequestItem} */
    private function submittedRequest(string $storeCode = 'PP', string $specialName = 'Standing Flower'): array
    {
        $store = Store::factory()->create(['code' => $storeCode]);
        $unit = Unit::create(['name' => 'Piece '.$storeCode, 'symbol' => strtolower($storeCode), 'is_active' => true]);
        $category = ItemCategory::create(['name' => 'Category '.$storeCode, 'code' => $storeCode, 'is_active' => true]);
        $item = \App\Models\Item::create(['sku' => $storeCode.'-001', 'name' => 'Tissue '.$storeCode, 'item_category_id' => $category->id, 'unit_id' => $unit->id, 'is_active' => true]);
        $request = PurchaseRequest::factory()->submitted()->create([
            'number' => 'REQ/'.$storeCode.'/'.now()->format('Y/m').'/0001',
            'store_id' => $store->id,
        ]);
        $stockLine = $request->items()->create([
            'type' => PurchaseRequestItemType::STOCK, 'item_id' => $item->id, 'unit_id' => $unit->id,
            'current_stock_snapshot' => 19, 'standard_stock_snapshot' => 68, 'suggested_quantity' => 49,
            'requested_quantity' => 10,
        ]);
        $specialLine = $request->items()->create([
            'type' => PurchaseRequestItemType::SPECIAL, 'name' => $specialName, 'unit_id' => $unit->id,
            'requested_quantity' => 2, 'reason' => 'Event',
        ]);

        return [$request, $stockLine, $specialLine];
    }
}

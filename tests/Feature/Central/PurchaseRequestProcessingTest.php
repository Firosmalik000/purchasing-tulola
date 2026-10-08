<?php

namespace Tests\Feature\Central;

use App\Enums\PurchaseRequestItemStatus;
use App\Enums\PurchaseRequestItemType;
use App\Enums\PurchaseRequestStatus;
use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\Store;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PurchaseRequestProcessingTest extends TestCase
{
    use RefreshDatabase;

    public function test_central_queue_excludes_drafts_and_supports_filters(): void
    {
        $admin = User::factory()->centralAdmin()->create();
        [$matchingRequest] = $this->submittedRequest(storeCode: 'PP', specialName: 'Standing Flower');
        PurchaseRequest::factory()->create(['number' => 'REQ/DRAFT/2026/10/0001']);
        $this->submittedRequest(storeCode: 'OTHER', specialName: 'Display');

        $this->actingAs($admin)->get(route('central.requests.index', [
            'store_id' => $matchingRequest->store_id,
            'status' => PurchaseRequestStatus::SUBMITTED->value,
            'type' => PurchaseRequestItemType::SPECIAL->value,
            'keyword' => 'Standing Flower',
            'date_from' => now()->subDay()->toDateString(),
            'date_to' => now()->addDay()->toDateString(),
        ]))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('central/requests/index')
            ->has('requests.data', 1)
            ->where('requests.data.0.id', $matchingRequest->id));
    }

    public function test_central_admin_can_process_mixed_request_with_reduced_and_rejected_lines(): void
    {
        $admin = User::factory()->centralAdmin()->create();
        [$request, $stockLine, $specialLine] = $this->submittedRequest();

        $this->actingAs($admin)->post(route('central.requests.process', $request), [
            'items' => [
                $stockLine->id => ['id' => $stockLine->id, 'approved_quantity' => 3],
                $specialLine->id => ['id' => $specialLine->id, 'approved_quantity' => 0],
            ],
            'notes' => 'Stok disetujui sebagian.',
        ])->assertRedirect(route('central.requests.show', $request));

        $request->refresh();
        $this->assertSame(PurchaseRequestStatus::PROCESSED, $request->status);
        $this->assertNotNull($request->processed_at);
        $this->assertDatabaseHas('purchase_request_items', [
            'id' => $stockLine->id, 'approved_quantity' => 3, 'status' => PurchaseRequestItemStatus::APPROVED->value,
        ]);
        $this->assertDatabaseHas('purchase_request_items', [
            'id' => $specialLine->id, 'approved_quantity' => 0, 'status' => PurchaseRequestItemStatus::REJECTED->value,
        ]);
        $this->assertDatabaseHas('purchase_request_status_histories', [
            'purchase_request_id' => $request->id,
            'from_status' => PurchaseRequestStatus::SUBMITTED->value,
            'to_status' => PurchaseRequestStatus::PROCESSED->value,
            'changed_by' => $admin->id,
            'notes' => 'Stok disetujui sebagian.',
        ]);
        $this->assertDatabaseHas('activity_logs', ['action' => 'purchase_request.processed', 'entity_id' => $request->id]);
        $audit = ActivityLog::query()->where('action', 'purchase_request.processed')->where('entity_id', $request->id)->firstOrFail();
        $this->assertSame('3.000', $audit->new_values['approved_quantities'][(string) $stockLine->id]);
    }

    public function test_approval_cannot_exceed_requested_quantity_or_omit_lines(): void
    {
        $admin = User::factory()->centralAdmin()->create();
        [$request, $stockLine, $specialLine] = $this->submittedRequest();

        $this->actingAs($admin)->post(route('central.requests.process', $request), [
            'items' => [
                $stockLine->id => ['id' => $stockLine->id, 'approved_quantity' => 11],
                $specialLine->id => ['id' => $specialLine->id, 'approved_quantity' => 1],
            ],
        ])->assertSessionHasErrors("items.{$stockLine->id}.approved_quantity");

        $this->assertSame(PurchaseRequestStatus::SUBMITTED, $request->fresh()->status);
        $this->assertNull($stockLine->fresh()->approved_quantity);

        $this->actingAs($admin)->post(route('central.requests.process', $request), [
            'items' => [$stockLine->id => ['id' => $stockLine->id, 'approved_quantity' => 1]],
        ])->assertSessionHasErrors('items');
        $this->assertSame(PurchaseRequestStatus::SUBMITTED, $request->fresh()->status);
    }

    public function test_all_zero_approvals_must_use_reject_action(): void
    {
        $admin = User::factory()->centralAdmin()->create();
        [$request, $stockLine, $specialLine] = $this->submittedRequest();

        $this->actingAs($admin)->post(route('central.requests.process', $request), [
            'items' => [
                $stockLine->id => ['id' => $stockLine->id, 'approved_quantity' => 0],
                $specialLine->id => ['id' => $specialLine->id, 'approved_quantity' => 0],
            ],
        ])->assertSessionHasErrors('items');

        $this->assertSame(PurchaseRequestStatus::SUBMITTED, $request->fresh()->status);
    }

    public function test_central_admin_can_reject_entire_request_with_reason(): void
    {
        $admin = User::factory()->centralAdmin()->create();
        [$request] = $this->submittedRequest();

        $this->actingAs($admin)->post(route('central.requests.reject', $request), [
            'reason' => 'Kebutuhan tidak disetujui.',
        ])->assertRedirect(route('central.requests.show', $request));

        $this->assertSame(PurchaseRequestStatus::REJECTED, $request->fresh()->status);
        $this->assertSame(0, $request->items()->where('status', '!=', PurchaseRequestItemStatus::REJECTED->value)->count());
        $this->assertDatabaseHas('purchase_request_status_histories', [
            'purchase_request_id' => $request->id,
            'to_status' => PurchaseRequestStatus::REJECTED->value,
            'notes' => 'Kebutuhan tidak disetujui.',
        ]);
        $this->assertDatabaseHas('activity_logs', ['action' => 'purchase_request.rejected', 'entity_id' => $request->id]);
    }

    public function test_reject_requires_reason_and_processed_request_cannot_be_processed_again(): void
    {
        $admin = User::factory()->centralAdmin()->create();
        [$request, $stockLine, $specialLine] = $this->submittedRequest();

        $this->actingAs($admin)->post(route('central.requests.reject', $request), [])
            ->assertSessionHasErrors('reason');

        $payload = ['items' => [
            $stockLine->id => ['id' => $stockLine->id, 'approved_quantity' => 1],
            $specialLine->id => ['id' => $specialLine->id, 'approved_quantity' => 1],
        ]];
        $this->actingAs($admin)->post(route('central.requests.process', $request), $payload)->assertSessionHasNoErrors();
        $this->actingAs($admin)->post(route('central.requests.process', $request), $payload)->assertForbidden();
        $this->actingAs($admin)->post(route('central.requests.reject', $request), ['reason' => 'Terlambat'])->assertForbidden();
    }

    public function test_purchasing_and_management_are_read_only_and_store_pic_is_blocked(): void
    {
        [$request, $stockLine, $specialLine] = $this->submittedRequest();
        $payload = ['items' => [
            $stockLine->id => ['id' => $stockLine->id, 'approved_quantity' => 1],
            $specialLine->id => ['id' => $specialLine->id, 'approved_quantity' => 1],
        ]];

        foreach ([UserRole::PURCHASING, UserRole::MANAGEMENT] as $role) {
            $user = User::factory()->create(['role' => $role]);
            $this->actingAs($user)->get(route('central.requests.show', $request))->assertOk();
            $this->actingAs($user)->post(route('central.requests.process', $request), $payload)->assertForbidden();
            $this->actingAs($user)->post(route('central.requests.reject', $request), ['reason' => 'Blocked'])->assertForbidden();
        }

        $pic = User::factory()->create();
        $this->actingAs($pic)->get(route('central.requests.index'))->assertForbidden();
    }

    /** @return array{PurchaseRequest, PurchaseRequestItem, PurchaseRequestItem} */
    private function submittedRequest(string $storeCode = 'PP', string $specialName = 'Standing Flower'): array
    {
        $store = Store::factory()->create(['code' => $storeCode]);
        $unit = Unit::create(['name' => 'Piece '.$storeCode, 'symbol' => strtolower($storeCode), 'is_active' => true]);
        $category = ItemCategory::create(['name' => 'Category '.$storeCode, 'code' => $storeCode, 'is_active' => true]);
        $item = Item::create(['sku' => $storeCode.'-001', 'name' => 'Tissue '.$storeCode, 'item_category_id' => $category->id, 'unit_id' => $unit->id, 'is_active' => true]);
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

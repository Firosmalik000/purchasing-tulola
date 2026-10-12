<?php

namespace Tests\Feature\Store;

use App\Enums\PurchaseRequestItemStatus;
use App\Enums\PurchaseRequestItemType;
use App\Models\PurchaseRequest;
use App\Models\Store;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StoreBankRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_can_view_pending_bank_requests_for_their_store(): void
    {
        $store = Store::factory()->create(['name' => 'Tulola Senayan City']);
        $otherStore = Store::factory()->create(['name' => 'Tulola Bali']);
        $pic = User::factory()->storePic()->create();
        $pic->stores()->attach($store, ['is_pic' => true, 'is_active' => true]);
        $unit = Unit::create(['name' => 'Piece', 'symbol' => 'pcs', 'is_active' => true]);

        // Item for this store in bank permintaan
        $myRequest = PurchaseRequest::factory()->submitted()->create(['store_id' => $store->id]);
        $mySpecialLine = $myRequest->items()->create([
            'type' => PurchaseRequestItemType::SPECIAL,
            'name' => 'Custom Display Showcase',
            'unit_id' => $unit->id,
            'requested_quantity' => 5,
            'approved_quantity' => 2,
            'bank_quantity' => 2,
            'status' => PurchaseRequestItemStatus::PARTIALLY_APPROVED,
        ]);

        // Item for other store
        $otherRequest = PurchaseRequest::factory()->submitted()->create(['store_id' => $otherStore->id]);
        $otherSpecialLine = $otherRequest->items()->create([
            'type' => PurchaseRequestItemType::SPECIAL,
            'name' => 'Special Showcase Bali',
            'unit_id' => $unit->id,
            'requested_quantity' => 1,
            'bank_quantity' => 1,
            'status' => PurchaseRequestItemStatus::BANK_PERMINTAAN,
        ]);

        $this->actingAs($pic)->get(route('store.bank-requests.index', ['store_id' => $store->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/bank-requests/index')
                ->has('items.data', 1)
                ->where('items.data.0.id', $mySpecialLine->id)
                ->where('items.data.0.bank_quantity', 2)
                ->where('stats.pending_items', 1)
                ->where('stats.pending_quantity', 2)
                ->where('stats.ordered_items', 0));
    }

    public function test_store_can_filter_by_status_pending_and_ordered(): void
    {
        $store = Store::factory()->create(['name' => 'Tulola Grand Indonesia']);
        $pic = User::factory()->storePic()->create();
        $pic->stores()->attach($store, ['is_pic' => true, 'is_active' => true]);
        $unit = Unit::create(['name' => 'Piece', 'symbol' => 'pcs', 'is_active' => true]);

        $request = PurchaseRequest::factory()->submitted()->create(['store_id' => $store->id]);

        // Item 1: Still pending
        $pendingLine = $request->items()->create([
            'type' => PurchaseRequestItemType::SPECIAL,
            'name' => 'Pending Flower Vase',
            'unit_id' => $unit->id,
            'requested_quantity' => 3,
            'bank_quantity' => 3,
            'bank_ordered_at' => null,
            'status' => PurchaseRequestItemStatus::BANK_PERMINTAAN,
        ]);

        // Item 2: Already ordered
        $orderedLine = $request->items()->create([
            'type' => PurchaseRequestItemType::SPECIAL,
            'name' => 'Ordered Acrylic Stand',
            'unit_id' => $unit->id,
            'requested_quantity' => 2,
            'bank_quantity' => 2,
            'bank_ordered_at' => now(),
            'status' => PurchaseRequestItemStatus::APPROVED,
        ]);

        // Filter: pending (default)
        $this->actingAs($pic)->get(route('store.bank-requests.index', [
            'store_id' => $store->id,
            'status' => 'pending',
        ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/bank-requests/index')
                ->has('items.data', 1)
                ->where('items.data.0.id', $pendingLine->id)
                ->where('stats.pending_items', 1)
                ->where('stats.ordered_items', 1));

        // Filter: ordered
        $this->actingAs($pic)->get(route('store.bank-requests.index', [
            'store_id' => $store->id,
            'status' => 'ordered',
        ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/bank-requests/index')
                ->has('items.data', 1)
                ->where('items.data.0.id', $orderedLine->id));

        // Filter: all
        $this->actingAs($pic)->get(route('store.bank-requests.index', [
            'store_id' => $store->id,
            'status' => 'all',
        ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/bank-requests/index')
                ->has('items.data', 2));
    }

    public function test_user_cannot_access_unassigned_store_bank_requests(): void
    {
        $store = Store::factory()->create();
        $unassignedStore = Store::factory()->create();
        $pic = User::factory()->storePic()->create();
        $pic->stores()->attach($store, ['is_pic' => true, 'is_active' => true]);

        $this->actingAs($pic)->get(route('store.bank-requests.index', [
            'store_id' => $unassignedStore->id,
        ]))->assertForbidden();
    }
}

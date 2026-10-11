<?php

namespace Tests\Feature\Store;

use App\Enums\PurchaseRequestItemType;
use App\Enums\PurchaseRequestStatus;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\PurchaseRequest;
use App\Models\Store;
use App\Models\StoreStock;
use App\Models\StoreStockStandard;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PurchaseRequestManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_pic_can_create_regular_special_and_mixed_drafts_with_sequential_numbers(): void
    {
        [$pic, $store, $item, $unit] = $this->fixtures();

        $this->actingAs($pic)->post(route('store.requests.store'), [
            'store_id' => $store->id,
            'required_date' => now()->addWeek()->toDateString(),
            'notes' => 'Regular only',
            'stock_items' => [['item_id' => $item->id, 'requested_quantity' => 5]],
        ])->assertSessionHasNoErrors();

        $this->actingAs($pic)->post(route('store.requests.store'), [
            'store_id' => $store->id,
            'notes' => 'Special only',
            'special_items' => [[
                'name' => 'Display khusus', 'unit_id' => $unit->id, 'requested_quantity' => 1,
                'description' => 'Display event', 'reason' => 'Acara toko',
                'required_date' => now()->addDays(10)->toDateString(),
            ]],
        ])->assertSessionHasNoErrors();

        $this->actingAs($pic)->post(route('store.requests.store'), [
            'store_id' => $store->id,
            'stock_items' => [['item_id' => $item->id, 'requested_quantity' => 3]],
            'special_items' => [[
                'name' => 'Kemasan khusus', 'unit_id' => $unit->id, 'requested_quantity' => 2,
                'reason' => 'Kebutuhan promosi',
            ]],
        ])->assertSessionHasNoErrors();

        $numbers = PurchaseRequest::query()->orderBy('id')->pluck('number');
        $prefix = 'REQ/'.$store->code.'/'.now()->format('Y/m').'/';
        $this->assertSame([$prefix.'0001', $prefix.'0002', $prefix.'0003'], $numbers->all());
        $this->assertSame([1, 1, 2], PurchaseRequest::query()->orderBy('id')->withCount('items')->pluck('items_count')->all());
        $this->assertDatabaseCount('purchase_request_status_histories', 3);
    }

    public function test_special_item_sample_image_is_stored_preserved_replaced_and_authorized(): void
    {
        Storage::fake('local');
        [$pic, $store, , $unit] = $this->fixtures();

        $this->actingAs($pic)->post(route('store.requests.store'), [
            'store_id' => $store->id,
            'special_items' => [[
                'name' => 'Display custom',
                'unit_id' => $unit->id,
                'requested_quantity' => 1,
                'reason' => 'Referensi bentuk display',
                'sample_image' => UploadedFile::fake()->image('sample-awal.jpg', 600, 600)->size(800),
            ]],
        ])->assertSessionHasNoErrors();

        $purchaseRequest = PurchaseRequest::firstOrFail();
        $line = $purchaseRequest->items()->firstOrFail();
        $originalPath = $line->sample_image_path;
        $this->assertNotNull($originalPath);
        Storage::disk('local')->assertExists($originalPath);

        $this->actingAs($pic)->get(route('request-items.sample-image', $line))->assertOk();
        $this->actingAs(User::factory()->centralAdmin()->create())->get(route('request-items.sample-image', $line))->assertOk();
        $this->actingAs(User::factory()->create())->get(route('request-items.sample-image', $line))->assertForbidden();
        $this->actingAs($pic)->get(route('store.requests.show', $purchaseRequest))
            ->assertInertia(fn (Assert $page) => $page
                ->where('purchaseRequest.items.0.sample_image_url', route('request-items.sample-image', $line)));

        $this->actingAs($pic)->put(route('store.requests.update', $purchaseRequest), [
            'store_id' => $store->id,
            'special_items' => [[
                'existing_item_id' => $line->id,
                'name' => 'Display custom',
                'unit_id' => $unit->id,
                'requested_quantity' => 1,
                'reason' => 'Referensi bentuk display',
            ]],
        ])->assertSessionHasNoErrors();

        $line = $purchaseRequest->items()->firstOrFail();
        $this->assertSame($originalPath, $line->sample_image_path);
        Storage::disk('local')->assertExists($originalPath);

        $this->actingAs($pic)->put(route('store.requests.update', $purchaseRequest), [
            'store_id' => $store->id,
            'special_items' => [[
                'existing_item_id' => $line->id,
                'name' => 'Display custom',
                'unit_id' => $unit->id,
                'requested_quantity' => 1,
                'reason' => 'Referensi bentuk display',
                'sample_image' => UploadedFile::fake()->image('sample-baru.jpg', 800, 600)->size(900),
            ]],
        ])->assertSessionHasNoErrors();

        $replacementPath = $purchaseRequest->items()->firstOrFail()->sample_image_path;
        $this->assertNotSame($originalPath, $replacementPath);
        Storage::disk('local')->assertMissing($originalPath);
        Storage::disk('local')->assertExists($replacementPath);
    }

    public function test_special_item_sample_image_must_be_a_supported_image_under_five_megabytes(): void
    {
        Storage::fake('local');
        [$pic, $store, , $unit] = $this->fixtures();

        $this->actingAs($pic)->post(route('store.requests.store'), [
            'store_id' => $store->id,
            'special_items' => [[
                'name' => 'Display custom',
                'unit_id' => $unit->id,
                'requested_quantity' => 1,
                'reason' => 'Referensi bentuk display',
                'sample_image' => UploadedFile::fake()->create('sample.pdf', 100, 'application/pdf'),
            ]],
        ])->assertSessionHasErrors('special_items.0.sample_image');

        $this->actingAs($pic)->post(route('store.requests.store'), [
            'store_id' => $store->id,
            'special_items' => [[
                'name' => 'Display custom',
                'unit_id' => $unit->id,
                'requested_quantity' => 1,
                'reason' => 'Referensi bentuk display',
                'sample_image' => UploadedFile::fake()->image('sample-besar.jpg')->size(6000),
            ]],
        ])->assertSessionHasErrors('special_items.0.sample_image');

        $this->assertDatabaseCount('purchase_requests', 0);
    }

    public function test_store_pic_can_open_request_list_form_and_detail_for_assigned_store(): void
    {
        [$pic, $store, $item] = $this->fixtures();
        $request = $this->createDraft($pic, $store, $item);

        $this->actingAs($pic)->get(route('store.requests.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/requests/index')
                ->has('requests.data', 1)
                ->has('stores', 1)
                ->where('selectedStoreId', $store->id)
                ->where('statuses', [
                    ['value' => 'DRAFT', 'label' => 'Draft'],
                    ['value' => 'SUBMITTED', 'label' => 'Diajukan'],
                    ['value' => 'PROCESSED', 'label' => 'Disetujui'],
                    ['value' => 'REJECTED', 'label' => 'Ditolak'],
                    ['value' => 'CANCELLED', 'label' => 'Dibatalkan'],
                ])
                ->where('filters.store_id', (string) $store->id)
                ->where('filters.date_from', now()->startOfMonth()->toDateString())
                ->where('filters.date_to', now()->endOfMonth()->toDateString()));
        $this->actingAs($pic)->get(route('store.requests.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/requests/form')
                ->where('selectedStoreId', $store->id)
                ->has('items', 1));
        $this->actingAs($pic)->get(route('store.requests.show', $request))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/requests/show')
                ->where('purchaseRequest.id', $request->id)
                ->has('purchaseRequest.items', 1));
    }

    public function test_draft_can_be_edited_and_submit_captures_immutable_stock_snapshots(): void
    {
        [$pic, $store, $item] = $this->fixtures();
        StoreStock::create(['store_id' => $store->id, 'item_id' => $item->id, 'quantity' => 19]);
        StoreStockStandard::create(['store_id' => $store->id, 'item_id' => $item->id, 'standard_quantity' => 68]);

        $this->actingAs($pic)->post(route('store.requests.store'), [
            'store_id' => $store->id,
            'stock_items' => [['item_id' => $item->id, 'requested_quantity' => 50]],
        ])->assertSessionHasNoErrors();
        $purchaseRequest = PurchaseRequest::firstOrFail();

        $this->actingAs($pic)->put(route('store.requests.update', $purchaseRequest), [
            'store_id' => $store->id,
            'notes' => 'Draft diperbarui',
            'stock_items' => [['item_id' => $item->id, 'requested_quantity' => 49]],
        ])->assertSessionHasNoErrors();
        $this->actingAs($pic)->post(route('store.requests.submit', $purchaseRequest))->assertRedirect(route('store.requests.show', $purchaseRequest));

        $line = $purchaseRequest->fresh()->items()->firstOrFail();
        $this->assertSame(PurchaseRequestStatus::SUBMITTED, $purchaseRequest->fresh()->status);
        $this->assertSame(PurchaseRequestItemType::STOCK, $line->type);
        $this->assertSame(19, $line->current_stock_snapshot);
        $this->assertSame(68, $line->standard_stock_snapshot);
        $this->assertSame(49, $line->suggested_quantity);
        $this->assertSame(49, $line->requested_quantity);

        StoreStock::where('store_id', $store->id)->where('item_id', $item->id)->update(['quantity' => 45]);
        $this->assertSame(19, $line->fresh()->current_stock_snapshot);
        $this->assertDatabaseHas('purchase_request_status_histories', [
            'purchase_request_id' => $purchaseRequest->id,
            'from_status' => PurchaseRequestStatus::DRAFT->value,
            'to_status' => PurchaseRequestStatus::SUBMITTED->value,
        ]);
    }

    public function test_suggested_quantity_never_goes_below_zero(): void
    {
        [$pic, $store, $item] = $this->fixtures();
        StoreStock::create(['store_id' => $store->id, 'item_id' => $item->id, 'quantity' => 100]);
        StoreStockStandard::create(['store_id' => $store->id, 'item_id' => $item->id, 'standard_quantity' => 68]);
        $request = $this->createDraft($pic, $store, $item);

        $this->actingAs($pic)->post(route('store.requests.submit', $request))->assertSessionHasNoErrors();

        $this->assertSame(0, $request->items()->firstOrFail()->suggested_quantity);
    }

    public function test_store_pic_cannot_access_another_store_request(): void
    {
        [$owner, $store, $item] = $this->fixtures();
        $request = $this->createDraft($owner, $store, $item);
        $outsider = User::factory()->create();
        $otherStore = Store::factory()->create();
        $outsider->stores()->attach($otherStore, ['is_pic' => true, 'is_active' => true]);

        $this->actingAs($owner)->get(route('store.requests.index', ['store_id' => $otherStore->id]))->assertForbidden();
        $this->actingAs($outsider)->get(route('store.requests.show', $request))->assertForbidden();
        $this->actingAs($outsider)->get(route('store.requests.edit', $request))->assertForbidden();
        $this->actingAs($outsider)->put(route('store.requests.update', $request), [
            'store_id' => $store->id,
            'stock_items' => [['item_id' => $item->id, 'requested_quantity' => 1]],
        ])->assertForbidden();
    }

    public function test_submitted_request_cannot_be_edited_or_submitted_twice(): void
    {
        [$pic, $store, $item] = $this->fixtures();
        $request = $this->createDraft($pic, $store, $item);
        $this->actingAs($pic)->post(route('store.requests.submit', $request))->assertSessionHasNoErrors();

        $this->actingAs($pic)->get(route('store.requests.edit', $request))->assertForbidden();
        $this->actingAs($pic)->put(route('store.requests.update', $request), [
            'store_id' => $store->id,
            'stock_items' => [['item_id' => $item->id, 'requested_quantity' => 2]],
        ])->assertForbidden();
        $this->actingAs($pic)->post(route('store.requests.submit', $request))->assertForbidden();
    }

    public function test_request_requires_at_least_one_line_and_assigned_active_store(): void
    {
        [$pic, $store] = $this->fixtures();

        $this->actingAs($pic)->post(route('store.requests.store'), ['store_id' => $store->id])
            ->assertSessionHasErrors('items');

        $unassignedStore = Store::factory()->create();
        $this->actingAs($pic)->post(route('store.requests.store'), [
            'store_id' => $unassignedStore->id,
            'special_items' => [['name' => 'Blocked', 'unit_id' => Unit::firstOrFail()->id, 'requested_quantity' => 1, 'reason' => 'Blocked']],
        ])->assertSessionHasErrors('store_id');
    }

    public function test_requested_quantities_must_be_whole_numbers(): void
    {
        [$pic, $store, $item, $unit] = $this->fixtures();

        $this->actingAs($pic)->post(route('store.requests.store'), [
            'store_id' => $store->id,
            'stock_items' => [['item_id' => $item->id, 'requested_quantity' => '2.99']],
            'special_items' => [[
                'name' => 'Kemasan khusus',
                'unit_id' => $unit->id,
                'requested_quantity' => '1.5',
                'reason' => 'Kebutuhan promosi',
            ]],
        ])->assertSessionHasErrors([
            'stock_items.0.requested_quantity',
            'special_items.0.requested_quantity',
        ]);

        $this->assertDatabaseCount('purchase_requests', 0);
    }

    public function test_store_pic_can_save_and_edit_draft_even_if_central_stock_is_zero(): void
    {
        [$pic, $store, $item] = $this->fixtures();
        $centralStore = Store::factory()->create(['code' => 'HO-JKT', 'name' => 'Tulola Head Office']);
        StoreStock::create(['store_id' => $centralStore->id, 'item_id' => $item->id, 'quantity' => 0]);

        // 1. Can save draft without error
        $this->actingAs($pic)->post(route('store.requests.store'), [
            'store_id' => $store->id,
            'stock_items' => [['item_id' => $item->id, 'requested_quantity' => 10]],
            'action' => 'draft',
        ])->assertSessionHasNoErrors();

        $purchaseRequest = PurchaseRequest::firstOrFail();
        $this->assertSame(PurchaseRequestStatus::DRAFT, $purchaseRequest->status);

        // 2. Can edit draft without error
        $this->actingAs($pic)->put(route('store.requests.update', $purchaseRequest), [
            'store_id' => $store->id,
            'notes' => 'Catatan draft diedit',
            'stock_items' => [['item_id' => $item->id, 'requested_quantity' => 15]],
            'action' => 'draft',
        ])->assertSessionHasNoErrors();

        $this->assertSame('Catatan draft diedit', $purchaseRequest->fresh()->notes);
    }

    public function test_store_pic_cannot_submit_request_when_central_stock_is_empty(): void
    {
        [$pic, $store, $item] = $this->fixtures();
        $centralStore = Store::factory()->create(['code' => 'HO-JKT', 'name' => 'Tulola Head Office']);
        StoreStock::create(['store_id' => $centralStore->id, 'item_id' => $item->id, 'quantity' => 0]);

        $response = $this->actingAs($pic)->post(route('store.requests.store'), [
            'store_id' => $store->id,
            'stock_items' => [['item_id' => $item->id, 'requested_quantity' => 5]],
            'action' => 'submit',
        ]);

        $response->assertSessionHasErrors(['stock', 'stock_items.0.requested_quantity']);
        $errors = session('errors')->getBag('default');
        $this->assertStringContainsString('sedang tidak ada stok di Kantor Pusat', $errors->first('stock'));
        $this->assertDatabaseCount('purchase_requests', 0);
    }

    public function test_store_pic_cannot_submit_request_when_central_stock_is_less_than_requested(): void
    {
        [$pic, $store, $item] = $this->fixtures();
        $centralStore = Store::factory()->create(['code' => 'HO-JKT', 'name' => 'Tulola Head Office']);
        StoreStock::create(['store_id' => $centralStore->id, 'item_id' => $item->id, 'quantity' => 3]);

        $response = $this->actingAs($pic)->post(route('store.requests.store'), [
            'store_id' => $store->id,
            'stock_items' => [['item_id' => $item->id, 'requested_quantity' => 10]],
            'action' => 'submit',
        ]);

        $response->assertSessionHasErrors(['stock', 'stock_items.0.requested_quantity']);
        $errors = session('errors')->getBag('default');
        $this->assertStringContainsString('Tersedia: 3', $errors->first('stock'));
        $this->assertStringContainsString('Diminta: 10', $errors->first('stock'));
        $this->assertDatabaseCount('purchase_requests', 0);
    }

    public function test_store_pic_cannot_submit_multiple_items_with_insufficient_stock(): void
    {
        [$pic, $store, $item1, $unit] = $this->fixtures();
        $item2 = Item::create([
            'sku' => 'ATK-002', 'name' => 'Buku Catatan',
            'item_category_id' => ItemCategory::firstOrFail()->id, 'unit_id' => $unit->id, 'is_active' => true,
        ]);

        $centralStore = Store::factory()->create(['code' => 'HO-JKT', 'name' => 'Tulola Head Office']);
        StoreStock::create(['store_id' => $centralStore->id, 'item_id' => $item1->id, 'quantity' => 0]);
        StoreStock::create(['store_id' => $centralStore->id, 'item_id' => $item2->id, 'quantity' => 2]);

        $response = $this->actingAs($pic)->post(route('store.requests.store'), [
            'store_id' => $store->id,
            'stock_items' => [
                ['item_id' => $item1->id, 'requested_quantity' => 5],
                ['item_id' => $item2->id, 'requested_quantity' => 8],
            ],
            'action' => 'submit',
        ]);

        $response->assertSessionHasErrors(['stock', 'stock_items.0.requested_quantity', 'stock_items.1.requested_quantity']);
        $errors = session('errors')->getBag('default');
        $this->assertStringContainsString('2 item', $errors->first('stock'));
        $this->assertStringContainsString('Pulpen', $errors->first('stock'));
        $this->assertStringContainsString('Buku Catatan', $errors->first('stock'));
    }

    public function test_submitting_draft_validates_central_stock(): void
    {
        [$pic, $store, $item] = $this->fixtures();
        $centralStore = Store::factory()->create(['code' => 'HO-JKT', 'name' => 'Tulola Head Office']);
        StoreStock::create(['store_id' => $centralStore->id, 'item_id' => $item->id, 'quantity' => 2]);

        // Create draft first
        $this->actingAs($pic)->post(route('store.requests.store'), [
            'store_id' => $store->id,
            'stock_items' => [['item_id' => $item->id, 'requested_quantity' => 5]],
            'action' => 'draft',
        ])->assertSessionHasNoErrors();

        $purchaseRequest = PurchaseRequest::firstOrFail();
        $this->assertSame(PurchaseRequestStatus::DRAFT, $purchaseRequest->status);

        // Submit draft fails due to stock
        $this->actingAs($pic)->post(route('store.requests.submit', $purchaseRequest))
            ->assertSessionHasErrors('stock');

        $this->assertSame(PurchaseRequestStatus::DRAFT, $purchaseRequest->fresh()->status);
    }

    public function test_submit_succeeds_when_requested_quantity_equals_available_central_stock(): void
    {
        [$pic, $store, $item] = $this->fixtures();
        $centralStore = Store::factory()->create(['code' => 'HO-JKT', 'name' => 'Tulola Head Office']);
        StoreStock::create(['store_id' => $centralStore->id, 'item_id' => $item->id, 'quantity' => 10]);

        // Request exactly 10 when 10 are available
        $this->actingAs($pic)->post(route('store.requests.store'), [
            'store_id' => $store->id,
            'stock_items' => [['item_id' => $item->id, 'requested_quantity' => 10]],
            'action' => 'submit',
        ])->assertSessionHasNoErrors();

        $purchaseRequest = PurchaseRequest::firstOrFail();
        $this->assertSame(PurchaseRequestStatus::SUBMITTED, $purchaseRequest->status);
    }

    public function test_submit_succeeds_for_mixed_items_when_stock_items_are_sufficient(): void
    {
        [$pic, $store, $item, $unit] = $this->fixtures();
        $centralStore = Store::factory()->create(['code' => 'HO-JKT', 'name' => 'Tulola Head Office']);
        StoreStock::create(['store_id' => $centralStore->id, 'item_id' => $item->id, 'quantity' => 20]);

        $this->actingAs($pic)->post(route('store.requests.store'), [
            'store_id' => $store->id,
            'stock_items' => [['item_id' => $item->id, 'requested_quantity' => 5]],
            'special_items' => [[
                'name' => 'Banner Event Khusus',
                'unit_id' => $unit->id,
                'requested_quantity' => 2,
                'reason' => 'Event ulang tahun toko',
            ]],
            'action' => 'submit',
        ])->assertSessionHasNoErrors();

        $purchaseRequest = PurchaseRequest::firstOrFail();
        $this->assertSame(PurchaseRequestStatus::SUBMITTED, $purchaseRequest->status);
    }

    public function test_submit_succeeds_for_only_special_items_without_stock_items(): void
    {
        [$pic, $store, , $unit] = $this->fixtures();
        Store::factory()->create(['code' => 'HO-JKT', 'name' => 'Tulola Head Office']);

        $this->actingAs($pic)->post(route('store.requests.store'), [
            'store_id' => $store->id,
            'special_items' => [[
                'name' => 'Meja Display Custom',
                'unit_id' => $unit->id,
                'requested_quantity' => 1,
                'reason' => 'Renovasi interior',
            ]],
            'action' => 'submit',
        ])->assertSessionHasNoErrors();

        $purchaseRequest = PurchaseRequest::firstOrFail();
        $this->assertSame(PurchaseRequestStatus::SUBMITTED, $purchaseRequest->status);
    }

    public function test_submit_fails_when_item_has_no_stock_record_at_central_warehouse(): void
    {
        [$pic, $store, $item] = $this->fixtures();
        // Central store exists, but NO StoreStock record for $item
        Store::factory()->create(['code' => 'HO-JKT', 'name' => 'Tulola Head Office']);

        $response = $this->actingAs($pic)->post(route('store.requests.store'), [
            'store_id' => $store->id,
            'stock_items' => [['item_id' => $item->id, 'requested_quantity' => 1]],
            'action' => 'submit',
        ]);

        $response->assertSessionHasErrors(['stock', 'stock_items.0.requested_quantity']);
        $errors = session('errors')->getBag('default');
        $this->assertStringContainsString('sedang tidak ada stok di Kantor Pusat', $errors->first('stock'));
    }

    /** @return array{User, Store, Item, Unit} */
    private function fixtures(): array
    {
        $pic = User::factory()->create();
        $store = Store::factory()->create(['code' => 'PP']);
        $pic->stores()->attach($store, ['is_pic' => true, 'is_active' => true]);
        $unit = Unit::create(['name' => 'Piece', 'symbol' => 'pcs', 'is_active' => true]);
        $category = ItemCategory::create(['name' => 'ATK', 'code' => 'ATK', 'is_active' => true]);
        $item = Item::create(['sku' => 'ATK-001', 'name' => 'Pulpen', 'item_category_id' => $category->id, 'unit_id' => $unit->id, 'is_active' => true]);

        return [$pic, $store, $item, $unit];
    }

    private function createDraft(User $pic, Store $store, Item $item): PurchaseRequest
    {
        $this->actingAs($pic)->post(route('store.requests.store'), [
            'store_id' => $store->id,
            'stock_items' => [['item_id' => $item->id, 'requested_quantity' => 1]],
        ])->assertSessionHasNoErrors();

        return PurchaseRequest::latest('id')->firstOrFail();
    }
}

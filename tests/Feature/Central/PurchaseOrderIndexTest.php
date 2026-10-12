<?php

namespace Tests\Feature\Central;

use App\Enums\PurchaseOrderStatus;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PurchaseOrderIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_central_user_sees_orders_with_draft_process_status_sorted_first(): void
    {
        $admin = User::factory()->centralAdmin()->create(['name' => 'Admin Purchasing']);
        $store = Store::factory()->create(['name' => 'Tulola Store Senayan', 'code' => 'SS-01']);

        $request1 = PurchaseRequest::factory()->create([
            'number' => 'REQ-202610-0012',
            'store_id' => $store->id,
        ]);
        $request2 = PurchaseRequest::factory()->create([
            'number' => 'REQ-202610-0013',
            'store_id' => $store->id,
        ]);
        $request3 = PurchaseRequest::factory()->create([
            'number' => 'REQ-202610-0014',
            'store_id' => $store->id,
        ]);

        // Create an older order with status DRAFT (Proses)
        $draftOrder = PurchaseOrder::factory()->create([
            'number' => 'PO-DRAFT-001',
            'purchase_request_id' => $request1->id,
            'order_date' => now()->toDateString(),
            'status' => PurchaseOrderStatus::DRAFT,
            'created_by' => $admin->id,
            'created_at' => now()->subDays(5),
        ]);

        // Create newer orders with other statuses
        $completedOrder = PurchaseOrder::factory()->create([
            'number' => 'PO-COMPLETED-002',
            'purchase_request_id' => $request2->id,
            'order_date' => now()->toDateString(),
            'status' => PurchaseOrderStatus::COMPLETED,
            'created_by' => $admin->id,
            'created_at' => now()->subDays(1),
        ]);

        $orderedOrder = PurchaseOrder::factory()->create([
            'number' => 'PO-ORDERED-003',
            'purchase_request_id' => $request3->id,
            'order_date' => now()->toDateString(),
            'status' => PurchaseOrderStatus::ORDERED,
            'created_by' => $admin->id,
            'created_at' => now()->subDays(2),
        ]);

        $response = $this->actingAs($admin)->get(route('central.orders.index'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('central/orders/index')
            ->has('orders.data', 3)
            // The first order in the list must be the DRAFT order
            ->where('orders.data.0.id', $draftOrder->id)
            ->where('orders.data.0.number', 'PO-DRAFT-001')
            ->where('orders.data.0.status', PurchaseOrderStatus::DRAFT->value)
        );
    }

    public function test_multiple_draft_orders_are_sorted_above_completed_orders_even_with_older_dates(): void
    {
        $admin = User::factory()->centralAdmin()->create();
        $store = Store::factory()->create();

        $req1 = PurchaseRequest::factory()->create(['store_id' => $store->id]);
        $req2 = PurchaseRequest::factory()->create(['store_id' => $store->id]);
        $req3 = PurchaseRequest::factory()->create(['store_id' => $store->id]);

        $olderDraft = PurchaseOrder::factory()->create([
            'number' => 'PO-DRAFT-OLD',
            'purchase_request_id' => $req1->id,
            'order_date' => now()->subDays(3)->toDateString(),
            'status' => PurchaseOrderStatus::DRAFT,
            'created_by' => $admin->id,
        ]);

        $newerDraft = PurchaseOrder::factory()->create([
            'number' => 'PO-DRAFT-NEW',
            'purchase_request_id' => $req2->id,
            'order_date' => now()->toDateString(),
            'status' => PurchaseOrderStatus::DRAFT,
            'created_by' => $admin->id,
        ]);

        $completed = PurchaseOrder::factory()->create([
            'number' => 'PO-COMPLETED-RECENT',
            'purchase_request_id' => $req3->id,
            'order_date' => now()->toDateString(),
            'status' => PurchaseOrderStatus::COMPLETED,
            'created_by' => $admin->id,
        ]);

        $response = $this->actingAs($admin)->get(route('central.orders.index'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('central/orders/index')
            ->where('orders.data.0.id', $newerDraft->id)
            ->where('orders.data.1.id', $olderDraft->id)
            ->where('orders.data.2.id', $completed->id)
        );
    }
}

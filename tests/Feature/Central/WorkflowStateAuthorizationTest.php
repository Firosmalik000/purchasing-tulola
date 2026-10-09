<?php

namespace Tests\Feature\Central;

use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestStatus;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WorkflowStateAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_review_only_submitted_requests(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        $submitted = PurchaseRequest::factory()->submitted()->create();
        $processed = PurchaseRequest::factory()->create([
            'status' => PurchaseRequestStatus::PROCESSED,
            'submitted_at' => now()->subHour(),
            'processed_at' => now(),
        ]);

        $this->actingAs($superAdmin)->get(route('central.requests.show', $submitted))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('canProcess', true)
                ->where('canReject', true));

        $this->actingAs($superAdmin)->get(route('central.requests.show', $processed))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('canProcess', false)
                ->where('canReject', false));

        $this->actingAs($superAdmin)->post(route('central.requests.reject', $processed), [
            'reason' => 'Tidak boleh mengubah hasil review.',
        ])->assertForbidden();

        $this->actingAs($superAdmin)->post(route('central.requests.process', $processed), [])
            ->assertForbidden();

        $this->assertSame(PurchaseRequestStatus::PROCESSED, $processed->fresh()->status);
    }

    public function test_super_admin_can_manage_only_draft_orders(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        $draft = PurchaseOrder::factory()->create();
        $ordered = PurchaseOrder::factory()->create(['status' => PurchaseOrderStatus::ORDERED]);

        $this->actingAs($superAdmin)->get(route('central.orders.show', $draft))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('canUpdate', true)
                ->where('canPlace', true)
                ->where('canCancel', true));

        $this->actingAs($superAdmin)->get(route('central.orders.show', $ordered))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('canUpdate', false)
                ->where('canPlace', false)
                ->where('canCancel', false));

        $this->actingAs($superAdmin)->put(route('central.orders.update', $ordered), [
            'notes' => 'Tidak boleh diubah setelah dikirim.',
        ])->assertForbidden();

        $this->actingAs($superAdmin)->post(route('central.orders.cancel', $ordered))
            ->assertForbidden();

        $this->actingAs($superAdmin)->post(route('central.orders.place', $ordered))
            ->assertForbidden();

        $this->assertSame(PurchaseOrderStatus::ORDERED, $ordered->fresh()->status);
    }
}

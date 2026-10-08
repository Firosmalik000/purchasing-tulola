<?php

namespace Tests\Feature\Central;

use App\Enums\UserRole;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_create_a_store_with_an_audit_log(): void
    {
        $admin = User::factory()->superAdmin()->create();

        $this->actingAs($admin)->post(route('central.stores.store'), [
            'code' => 'PP',
            'name' => 'Pacific Place',
            'address' => 'Jakarta',
            'is_active' => true,
        ])->assertRedirect(route('central.stores.index'));

        $store = Store::where('code', 'PP')->firstOrFail();
        $this->assertDatabaseHas('activity_logs', [
            'actor_id' => $admin->id,
            'action' => 'store.created',
            'entity_id' => $store->id,
        ]);
    }

    public function test_non_super_admin_cannot_manage_stores(): void
    {
        $centralAdmin = User::factory()->centralAdmin()->create();

        $this->actingAs($centralAdmin)
            ->post(route('central.stores.store'), [
                'code' => 'PP',
                'name' => 'Pacific Place',
                'is_active' => true,
            ])
            ->assertForbidden();
    }

    public function test_store_code_must_be_unique(): void
    {
        Store::factory()->create(['code' => 'PP']);
        $admin = User::factory()->create(['role' => UserRole::SUPER_ADMIN]);

        $this->actingAs($admin)->post(route('central.stores.store'), [
            'code' => 'PP',
            'name' => 'Duplicate',
            'is_active' => true,
        ])->assertSessionHasErrors('code');
    }

    public function test_super_admin_can_update_and_deactivate_a_store(): void
    {
        $admin = User::factory()->superAdmin()->create();
        $store = Store::factory()->create(['code' => 'OLD', 'is_active' => true]);

        $this->actingAs($admin)->put(route('central.stores.update', $store), [
            'code' => 'NEW',
            'name' => 'Renamed Store',
            'address' => 'Jakarta Selatan',
            'is_active' => false,
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('stores', ['id' => $store->id, 'code' => 'NEW', 'is_active' => false]);
        $this->assertDatabaseHas('activity_logs', ['actor_id' => $admin->id, 'action' => 'store.updated', 'entity_id' => $store->id]);
    }
}

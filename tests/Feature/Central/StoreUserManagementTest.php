<?php

namespace Tests\Feature\Central;

use App\Enums\UserRole;
use App\Models\PurchaseRequest;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StoreUserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_create_and_assign_a_store_pic(): void
    {
        $admin = User::factory()->superAdmin()->create();
        $store = Store::factory()->create();

        $this->actingAs($admin)->post(route('central.users.store'), [
            'name' => 'PIC Pacific Place',
            'email' => 'pic@example.com',
            'role' => UserRole::STORE_PIC->value,
            'password' => 'password',
            'password_confirmation' => 'password',
            'is_active' => true,
        ])->assertSessionHasNoErrors();

        $pic = User::where('email', 'pic@example.com')->firstOrFail();
        $this->actingAs($admin)->post(route('central.stores.users.store', $store), [
            'user_id' => $pic->id,
            'is_pic' => true,
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('store_user', [
            'store_id' => $store->id,
            'user_id' => $pic->id,
            'is_pic' => true,
            'is_active' => true,
        ]);
    }

    public function test_store_pic_cannot_assign_users(): void
    {
        $store = Store::factory()->create();
        $pic = User::factory()->create();
        $other = User::factory()->create();

        $this->actingAs($pic)->post(route('central.stores.users.store', $store), [
            'user_id' => $other->id,
            'is_pic' => true,
        ])->assertForbidden();
    }

    public function test_non_store_role_cannot_be_assigned_to_store(): void
    {
        $admin = User::factory()->superAdmin()->create();
        $store = Store::factory()->create();
        $central = User::factory()->centralAdmin()->create();

        $this->actingAs($admin)->post(route('central.stores.users.store', $store), [
            'user_id' => $central->id,
            'is_pic' => true,
        ])->assertSessionHasErrors('user_id');
    }

    public function test_super_admin_can_update_role_status_and_password(): void
    {
        $admin = User::factory()->superAdmin()->create();
        $user = User::factory()->create();

        $this->actingAs($admin)->put(route('central.users.update', $user), [
            'name' => 'Updated User',
            'email' => 'updated@example.com',
            'role' => UserRole::PURCHASING->value,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
            'is_active' => false,
        ])->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertSame(UserRole::PURCHASING, $user->role);
        $this->assertFalse($user->is_active);
        $this->assertTrue(Hash::check('new-password', $user->password));
        $this->assertDatabaseHas('activity_logs', ['actor_id' => $admin->id, 'action' => 'user.updated', 'entity_id' => $user->id]);
    }

    public function test_super_admin_can_remove_user_without_transaction_history(): void
    {
        $admin = User::factory()->superAdmin()->create();
        $user = User::factory()->create();
        $store = Store::factory()->create();
        $user->stores()->attach($store, ['is_pic' => true, 'is_active' => true]);

        $this->actingAs($admin)
            ->delete(route('central.users.destroy', $user))
            ->assertSessionHas('success');

        $this->assertNull($user->fresh());
        $this->assertDatabaseMissing('store_user', ['user_id' => $user->id]);
        $this->assertDatabaseHas('activity_logs', [
            'actor_id' => $admin->id,
            'action' => 'user.deleted',
            'entity_id' => $user->id,
        ]);
    }

    public function test_super_admin_cannot_remove_their_own_account(): void
    {
        $admin = User::factory()->superAdmin()->create();

        $this->actingAs($admin)
            ->delete(route('central.users.destroy', $admin))
            ->assertSessionHas('error');

        $this->assertNotNull($admin->fresh());
    }

    public function test_user_with_transaction_history_must_be_deactivated_instead_of_removed(): void
    {
        $admin = User::factory()->superAdmin()->create();
        $user = User::factory()->create();
        PurchaseRequest::factory()->create(['requested_by' => $user->id]);

        $this->actingAs($admin)
            ->delete(route('central.users.destroy', $user))
            ->assertSessionHas('error');

        $this->assertNotNull($user->fresh());
    }
}

<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_store_pic_is_sent_to_store_dashboard(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->get(route('dashboard'))->assertRedirect(route('store.dashboard'));
        $this->get(route('store.dashboard'))->assertOk();
        $this->get(route('central.dashboard'))->assertForbidden();
    }

    public function test_central_user_is_sent_to_central_dashboard(): void
    {
        $user = User::factory()->centralAdmin()->create();
        $this->actingAs($user);

        $this->get(route('dashboard'))->assertRedirect(route('central.dashboard'));
        $this->get(route('central.dashboard'))->assertOk();
        $this->get(route('store.dashboard'))->assertForbidden();
    }

    public function test_inactive_user_cannot_enter_a_portal(): void
    {
        $user = User::factory()->inactive()->create();
        $this->actingAs($user);

        $this->get(route('dashboard'))->assertRedirect(route('login'));
        $this->assertGuest();
    }

    public function test_super_admin_has_system_management_permissions(): void
    {
        $user = User::factory()->create(['role' => UserRole::SUPER_ADMIN]);

        $this->assertTrue($user->can('manage-stores'));
        $this->assertTrue($user->can('manage-users'));
        $this->assertTrue($user->can('manage-inventory'));
    }
}

<?php

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Mail\UserInvitationMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class InvitationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_invite_user_without_password_and_mail_is_sent(): void
    {
        Mail::fake();

        $admin = User::factory()->superAdmin()->create();

        $response = $this->actingAs($admin)->post(route('central.users.store'), [
            'name' => 'Staf Toko Cabang Baru',
            'email' => 'newpic@tulolajewelry.com',
            'role' => UserRole::STORE_PIC->value,
            'is_active' => true,
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertSessionHas('success');

        $user = User::where('email', 'newpic@tulolajewelry.com')->firstOrFail();
        $this->assertNotNull($user->invitation_token);
        $this->assertNotNull($user->invitation_sent_at);

        Mail::assertSent(UserInvitationMail::class, function ($mail) use ($user) {
            return $mail->hasTo('newpic@tulolajewelry.com') && $mail->user->id === $user->id;
        });
    }

    public function test_admin_provisioned_user_with_password_is_already_verified(): void
    {
        $admin = User::factory()->superAdmin()->create();

        $this->actingAs($admin)->post(route('central.users.store'), [
            'name' => 'Staf Purchasing',
            'email' => 'purchasing@tulolajewelry.com',
            'role' => UserRole::PURCHASING->value,
            'password' => 'secret12345!',
            'password_confirmation' => 'secret12345!',
            'is_active' => true,
            'send_invitation' => false,
        ])->assertSessionHasNoErrors();

        $user = User::where('email', 'purchasing@tulolajewelry.com')->firstOrFail();

        $this->assertNotNull($user->email_verified_at);
        $this->assertNull($user->invitation_token);
    }

    public function test_invited_user_can_view_set_password_page(): void
    {
        $token = Str::random(40);
        $user = User::factory()->create([
            'invitation_token' => $token,
            'invitation_sent_at' => now(),
        ]);

        $response = $this->get(route('invitation.accept', ['token' => $token]));
        $response->assertOk();
    }

    public function test_invited_user_can_set_password_and_redirect_to_login(): void
    {
        $token = Str::random(40);
        $user = User::factory()->create([
            'invitation_token' => $token,
            'invitation_sent_at' => now(),
            'is_active' => false,
            'email_verified_at' => null,
        ]);

        $response = $this->post(route('invitation.update', ['token' => $token]), [
            'password' => 'secret12345!',
            'password_confirmation' => 'secret12345!',
        ]);

        $response->assertRedirect(route('login'));
        $this->assertGuest();

        $user->refresh();
        $this->assertNull($user->invitation_token);
        $this->assertTrue($user->is_active);
        $this->assertNotNull($user->email_verified_at);
        $this->assertTrue(Hash::check('secret12345!', $user->password));
    }
}

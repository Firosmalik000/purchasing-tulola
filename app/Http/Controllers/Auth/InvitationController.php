<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class InvitationController extends Controller
{
    /**
     * Show the password creation page for the invited user.
     */
    public function show(string $token): Response|RedirectResponse
    {
        $user = User::query()
            ->where('invitation_token', $token)
            ->first();

        if (! $user) {
            return to_route('login')->with('error', 'Tautan undangan tidak valid atau sudah kedaluwarsa.');
        }

        return Inertia::render('auth/set-password', [
            'token' => $token,
            'email' => $user->email,
            'name' => $user->name,
            'roleLabel' => $user->role->label(),
        ]);
    }

    /**
     * Set password and activate account.
     */
    public function update(Request $request, string $token): RedirectResponse
    {
        $user = User::query()
            ->where('invitation_token', $token)
            ->first();

        if (! $user) {
            return to_route('login')->with('error', 'Tautan undangan tidak valid atau sudah kedaluwarsa.');
        }

        $validated = $request->validate([
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user->forceFill([
            'password' => Hash::make($validated['password']),
            'invitation_token' => null,
            'is_active' => true,
            'email_verified_at' => now(),
        ])->save();

        return to_route('login')
            ->with('status', 'Kata sandi berhasil dibuat dan akun Anda telah aktif! Silakan masuk dengan akun baru Anda.');
    }
}

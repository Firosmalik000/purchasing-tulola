<?php

namespace App\Http\Controllers\Central;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Central\CreateUserRequest;
use App\Http\Requests\Central\UpdateUserRequest;
use App\Models\Store;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(\Illuminate\Http\Request $request): Response
    {
        Gate::authorize('manage-users');

        return Inertia::render('central/users/index', [
            'users' => User::query()
                ->with(['stores' => fn ($query) => $query->where('store_user.is_active', true)])
                ->orderBy('name')
                ->paginate(\App\Support\Paging::perPage($request))
                ->withQueryString(),
            'stores' => Store::query()->where('is_active', true)->orderBy('name')->get(['id', 'code', 'name']),
            'roles' => collect(UserRole::cases())->map(fn (UserRole $role) => ['value' => $role->value, 'label' => $role->label()]),
        ]);
    }

    public function store(CreateUserRequest $request, ActivityLogger $logger, \App\Services\PurchasingNotificationService $notifications): RedirectResponse
    {
        $shouldInvite = $request->has('send_invitation')
            ? $request->boolean('send_invitation')
            : ! $request->filled('password');

        $user = DB::transaction(function () use ($request, $logger, $shouldInvite): User {
            $data = $request->safe()->except(['password', 'send_invitation', 'store_id', 'is_pic']);

            if ($request->filled('password')) {
                $data['password'] = $request->string('password')->toString();
                $data['is_active'] = $request->boolean('is_active', true);
                $data['email_verified_at'] = now();
            } else {
                $data['password'] = \Illuminate\Support\Str::random(32);
            }

            if ($shouldInvite) {
                $data['invitation_token'] = \Illuminate\Support\Str::random(40);
                $data['invitation_sent_at'] = now();
                $data['is_active'] = false; // Status menunggu aktivasi / undangan
            }

            $user = User::create($data);

            if ($request->filled('store_id')) {
                $user->stores()->syncWithoutDetaching([
                    $request->integer('store_id') => [
                        'is_pic' => $request->boolean('is_pic', true),
                        'is_active' => true,
                    ],
                ]);
            }

            $logger->log('user.created', $user, newValues: $user->only(['name', 'email', 'role', 'is_active']));

            return $user;
        });

        if ($shouldInvite) {
            $notifications->sendUserInvitation($user);
            return back()->with('success', "Undangan berhasil dikirim ke {$user->email}. Status akun: Menunggu Aktivasi.");
        }

        return back()->with('success', "Pengguna {$user->name} berhasil dibuat.");
    }

    public function resendInvitation(User $user, \App\Services\PurchasingNotificationService $notifications): RedirectResponse
    {
        Gate::authorize('manage-users');

        if (! $user->invitation_token) {
            $user->update([
                'invitation_token' => \Illuminate\Support\Str::random(40),
                'invitation_sent_at' => now(),
                'is_active' => false,
            ]);
        } else {
            $user->update(['invitation_sent_at' => now()]);
        }

        $notifications->sendUserInvitation($user);

        return back()->with('success', "Email undangan aktivasi berhasil dikirim ulang ke {$user->email}.");
    }

    public function update(UpdateUserRequest $request, User $user, ActivityLogger $logger): RedirectResponse
    {
        DB::transaction(function () use ($request, $user, $logger): void {
            $old = $user->only(['name', 'email', 'role', 'is_active']);
            $values = $request->safe()->except(['password']);

            if ($request->filled('password')) {
                $values['password'] = $request->string('password')->toString();
            }

            $user->update($values);
            $logger->log('user.updated', $user, $old, $user->only(array_keys($old)));
        });

        return back()->with('success', 'Pengguna berhasil diperbarui.');
    }

    public function destroy(User $user, ActivityLogger $logger): RedirectResponse
    {
        Gate::authorize('manage-users');

        if ($user->is(auth()->user())) {
            return back()->with('error', 'Akun yang sedang digunakan tidak dapat dihapus.');
        }

        if (
            $user->purchaseRequests()->exists()
            || $user->purchaseOrders()->exists()
            || $user->receipts()->exists()
        ) {
            return back()->with('error', 'Pengguna memiliki histori transaksi dan tidak dapat dihapus. Nonaktifkan akun untuk mempertahankan audit data.');
        }

        DB::transaction(function () use ($user, $logger): void {
            $deletedUser = $user->only(['name', 'email', 'role', 'is_active']);

            $user->delete();
            $logger->log('user.deleted', $user, $deletedUser);
        });

        return back()->with('success', "Pengguna {$user->name} berhasil dihapus.");
    }
}

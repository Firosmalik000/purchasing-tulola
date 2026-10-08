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
    public function index(): Response
    {
        Gate::authorize('manage-users');

        return Inertia::render('central/users/index', [
            'users' => User::query()->with(['stores' => fn ($query) => $query->where('store_user.is_active', true)])->orderBy('name')->paginate(15),
            'stores' => Store::query()->where('is_active', true)->orderBy('name')->get(['id', 'code', 'name']),
            'roles' => collect(UserRole::cases())->map(fn (UserRole $role) => ['value' => $role->value, 'label' => $role->label()]),
        ]);
    }

    public function store(CreateUserRequest $request, ActivityLogger $logger, \App\Services\PurchasingNotificationService $notifications): RedirectResponse
    {
        $shouldInvite = $request->boolean('send_invitation', true) || ! $request->filled('password');

        $user = DB::transaction(function () use ($request, $logger, $shouldInvite): User {
            $data = $request->safe()->except(['password', 'send_invitation']);
            
            if ($request->filled('password')) {
                $data['password'] = $request->string('password')->toString();
            } else {
                $data['password'] = \Illuminate\Support\Str::random(32);
            }

            if ($shouldInvite) {
                $data['invitation_token'] = \Illuminate\Support\Str::random(40);
                $data['invitation_sent_at'] = now();
            }

            $user = User::create($data);
            $logger->log('user.created', $user, newValues: $user->only(['name', 'email', 'role', 'is_active']));

            return $user;
        });

        if ($shouldInvite) {
            $notifications->sendUserInvitation($user);
            return back()->with('success', "Pengguna {$user->name} berhasil dibuat dan email undangan telah dikirimkan.");
        }

        return back()->with('success', "Pengguna {$user->name} berhasil dibuat.");
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
}

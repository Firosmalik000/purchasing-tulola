<?php

namespace App\Http\Controllers\Central;

use App\Actions\Stores\AssignUserToStore;
use App\Http\Controllers\Controller;
use App\Http\Requests\Central\AssignStoreUserRequest;
use App\Models\Store;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class StoreUserController extends Controller
{
    public function store(AssignStoreUserRequest $request, Store $store, AssignUserToStore $action): RedirectResponse
    {
        $user = User::findOrFail($request->integer('user_id'));
        $action->handle($store, $user, $request->boolean('is_pic'));

        return back()->with('success', 'Pengguna berhasil ditugaskan ke toko.');
    }

    public function destroy(Store $store, User $user, ActivityLogger $logger): RedirectResponse
    {
        Gate::authorize('update', $store);

        DB::transaction(function () use ($store, $user, $logger): void {
            $membership = $store->users()->whereKey($user->id)->firstOrFail();
            $old = $membership->pivot->only(['is_pic', 'is_active']);
            $store->users()->updateExistingPivot($user->id, ['is_active' => false]);
            $logger->log('store.user_removed', $store, $old, [
                'user_id' => $user->id,
                'is_pic' => (bool) $membership->pivot->getAttribute('is_pic'),
                'is_active' => false,
            ]);
        });

        return back()->with('success', 'Penugasan pengguna berhasil dinonaktifkan.');
    }
}

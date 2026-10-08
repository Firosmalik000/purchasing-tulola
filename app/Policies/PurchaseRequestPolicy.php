<?php

namespace App\Policies;

use App\Enums\PurchaseRequestStatus;
use App\Enums\UserRole;
use App\Models\PurchaseRequest;
use App\Models\User;

class PurchaseRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isCentralUser();
    }

    public function view(User $user, PurchaseRequest $request): bool
    {
        return $user->isCentralUser() || $user->stores()
            ->whereKey($request->store_id)
            ->where('stores.is_active', true)
            ->wherePivot('is_active', true)
            ->exists();
    }

    public function update(User $user, PurchaseRequest $request): bool
    {
        return $user->role === UserRole::STORE_PIC
            && $request->status === PurchaseRequestStatus::DRAFT
            && $user->stores()
                ->whereKey($request->store_id)
                ->where('stores.is_active', true)
                ->wherePivot('is_active', true)
                ->exists();
    }

    public function process(User $user, PurchaseRequest $request): bool
    {
        return $user->role === UserRole::CENTRAL_ADMIN
            && $request->status === PurchaseRequestStatus::SUBMITTED;
    }

    public function reject(User $user, PurchaseRequest $request): bool
    {
        return $this->process($user, $request);
    }
}

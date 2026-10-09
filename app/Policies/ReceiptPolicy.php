<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Receipt;
use App\Models\Store;
use App\Models\User;

class ReceiptPolicy
{
    public function view(User $user, Receipt $receipt): bool
    {
        return $this->assignedTo($user, $receipt->store);
    }

    public function create(User $user, Store $store): bool
    {
        return $this->assignedTo($user, $store);
    }

    private function assignedTo(User $user, Store $store): bool
    {
        return $user->role === UserRole::STORE_PIC
            && $store->is_active
            && $user->stores()->whereKey($store->id)->wherePivot('is_active', true)->exists();
    }
}

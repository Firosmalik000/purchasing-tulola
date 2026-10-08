<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class InventoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isCentralUser() || $user->role === UserRole::STORE_PIC;
    }

    public function update(User $user): bool
    {
        return $user->can('manage-inventory');
    }
}

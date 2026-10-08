<?php

namespace App\Policies;

use App\Models\User;

class MasterDataPolicy
{
    public function before(User $user): ?bool
    {
        return $user->isSuperAdmin() ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return $user->can('manage-master-data');
    }

    public function create(User $user): bool
    {
        return $user->can('manage-master-data');
    }

    public function update(User $user): bool
    {
        return $user->can('manage-master-data');
    }
}

<?php

namespace App\Policies;

use App\Enums\PurchaseOrderStatus;
use App\Enums\UserRole;
use App\Models\PurchaseOrder;
use App\Models\User;

class PurchaseOrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isCentralUser();
    }

    public function view(User $user, PurchaseOrder $order): bool
    {
        return $user->isCentralUser();
    }

    public function create(User $user): bool
    {
        return $this->canManage($user);
    }

    public function update(User $user, PurchaseOrder $order): bool
    {
        return $this->canManage($user) && $order->status === PurchaseOrderStatus::DRAFT;
    }

    public function place(User $user, PurchaseOrder $order): bool
    {
        return $this->update($user, $order);
    }

    public function cancel(User $user, PurchaseOrder $order): bool
    {
        return $this->update($user, $order);
    }

    private function canManage(User $user): bool
    {
        return in_array($user->role, [UserRole::SUPER_ADMIN, UserRole::CENTRAL_ADMIN, UserRole::PURCHASING], true);
    }
}

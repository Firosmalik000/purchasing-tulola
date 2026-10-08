<?php

namespace App\Actions\Stores;

use App\Models\Store;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Support\Facades\DB;

class AssignUserToStore
{
    public function __construct(private ActivityLogger $logger) {}

    public function handle(Store $store, User $user, bool $isPic): void
    {
        DB::transaction(function () use ($store, $user, $isPic): void {
            $previous = $store->users()->whereKey($user->id)->first()?->pivot?->only(['is_pic', 'is_active']);

            $store->users()->syncWithoutDetaching([
                $user->id => ['is_pic' => $isPic, 'is_active' => true],
            ]);

            $this->logger->log('store.user_assigned', $store, $previous, [
                'user_id' => $user->id,
                'is_pic' => $isPic,
                'is_active' => true,
            ]);
        });
    }
}

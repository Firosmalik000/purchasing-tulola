<?php

namespace App\Providers;

use App\Enums\UserRole;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\Receipt;
use App\Models\StockMovement;
use App\Models\StoreStock;
use App\Models\StoreStockStandard;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use App\Policies\InventoryPolicy;
use App\Policies\MasterDataPolicy;
use App\Policies\PurchaseOrderPolicy;
use App\Policies\PurchaseRequestPolicy;
use App\Policies\ReceiptPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureAuthorization();
    }

    private function configureAuthorization(): void
    {
        Gate::policy(ItemCategory::class, MasterDataPolicy::class);
        Gate::policy(Unit::class, MasterDataPolicy::class);
        Gate::policy(Item::class, MasterDataPolicy::class);
        Gate::policy(Supplier::class, MasterDataPolicy::class);
        Gate::policy(StoreStock::class, InventoryPolicy::class);
        Gate::policy(StoreStockStandard::class, InventoryPolicy::class);
        Gate::policy(StockMovement::class, InventoryPolicy::class);
        Gate::policy(PurchaseRequest::class, PurchaseRequestPolicy::class);
        Gate::policy(PurchaseOrder::class, PurchaseOrderPolicy::class);
        Gate::policy(Receipt::class, ReceiptPolicy::class);
        Gate::before(fn (User $user): ?bool => $user->role === UserRole::SUPER_ADMIN ? true : null);

        Gate::define('access-central', fn (User $user): bool => $user->isCentralUser());
        Gate::define('access-store', fn (User $user): bool => $user->role === UserRole::STORE_PIC);
        Gate::define('manage-stores', fn (User $user): bool => false);
        Gate::define('manage-users', fn (User $user): bool => false);
        Gate::define('manage-master-data', fn (User $user): bool => in_array($user->role, [
            UserRole::CENTRAL_ADMIN,
            UserRole::PURCHASING,
        ], true));
        Gate::define('manage-inventory', fn (User $user): bool => $user->role === UserRole::CENTRAL_ADMIN);
        Gate::define('manage-requests', fn (User $user): bool => $user->role === UserRole::CENTRAL_ADMIN);
        Gate::define('manage-orders', fn (User $user): bool => in_array($user->role, [
            UserRole::CENTRAL_ADMIN,
            UserRole::PURCHASING,
        ], true));
        Gate::define('view-management-reports', fn (User $user): bool => in_array($user->role, [
            UserRole::CENTRAL_ADMIN,
            UserRole::PURCHASING,
            UserRole::MANAGEMENT,
        ], true));
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}

<?php

namespace App\Http\Middleware;

use App\Services\CriticalStockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                'permissions' => $request->user() ? [
                    'accessCentral' => Gate::allows('access-central'),
                    'accessStore' => Gate::allows('access-store'),
                    'manageStores' => Gate::allows('manage-stores'),
                    'manageUsers' => Gate::allows('manage-users'),
                    'manageMasterData' => Gate::allows('manage-master-data'),
                    'manageInventory' => Gate::allows('manage-inventory'),
                    'manageRequests' => Gate::allows('manage-requests'),
                    'manageOrders' => Gate::allows('manage-orders'),
                    'viewManagementReports' => Gate::allows('view-management-reports'),
                ] : [],
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'toast' => fn () => $request->session()->get('toast'),
            ],
            'criticalStock' => fn () => $request->user()
                ? app(CriticalStockService::class)->getSummaryForUser($request->user())
                : ['count' => 0, 'items' => []],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}

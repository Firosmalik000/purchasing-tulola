<?php

namespace App\Http\Controllers\Central;

use App\Actions\Stores\AssignUserToStore;
use App\Http\Controllers\Controller;
use App\Http\Requests\Central\StoreRequest;
use App\Models\Store;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Support\Paging;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class StoreController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Store::class);

        $search = trim((string) $request->string('search'));
        $stores = Store::query()
            ->withCount([
                'users' => fn ($query) => $query->where('store_user.is_active', true),
                'purchaseRequests',
            ])
            ->with([
                'users' => function ($query) {
                    $query->where('store_user.is_active', true)
                        ->select(['users.id', 'users.name', 'users.email', 'users.role', 'users.is_active', 'users.invitation_token']);
                },
                'purchaseRequests' => function ($query) {
                    $query->with([
                        'requester:id,name,email',
                        'items' => fn ($iq) => $iq->select('id', 'purchase_request_id', 'name', 'requested_quantity'),
                    ])
                        ->withCount('items')
                        ->latest()
                        ->take(30);
                },
            ])
            ->when($search !== '', fn ($query) => $query->where(fn ($nested) => $nested
                ->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%")))
            ->latest()
            ->paginate(Paging::perPage($request))
            ->withQueryString();

        $availableUsers = User::query()
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'is_active', 'invitation_token']);

        return Inertia::render('central/stores/index', [
            'stores' => $stores,
            'filters' => ['search' => $search],
            'availableUsers' => $availableUsers,
        ]);
    }

    public function store(StoreRequest $request, ActivityLogger $logger, AssignUserToStore $assignAction): RedirectResponse
    {
        $store = DB::transaction(function () use ($request, $logger, $assignAction): Store {
            $data = $request->validated();
            $store = Store::create([
                'code' => $data['code'],
                'name' => $data['name'],
                'address' => $data['address'] ?? null,
                'is_active' => (bool) $data['is_active'],
            ]);
            $logger->log('store.created', $store, newValues: $store->only(['code', 'name', 'address', 'is_active']));

            if (! empty($data['pic_user_id'])) {
                $user = User::find($data['pic_user_id']);
                if ($user) {
                    $isPic = isset($data['is_pic']) ? (bool) $data['is_pic'] : true;
                    $assignAction->handle($store, $user, $isPic);
                }
            }

            return $store;
        });

        return to_route('central.stores.index')->with('success', "Toko {$store->name} berhasil dibuat.");
    }

    public function update(StoreRequest $request, Store $store, ActivityLogger $logger): RedirectResponse
    {
        DB::transaction(function () use ($request, $store, $logger): void {
            $old = $store->only(['code', 'name', 'address', 'is_active']);
            $store->update($request->validated());
            $logger->log('store.updated', $store, $old, $store->only(array_keys($old)));
        });

        return back()->with('success', 'Data toko berhasil diperbarui.');
    }
}

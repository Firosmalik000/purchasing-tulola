<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Http\Requests\Central\StoreRequest;
use App\Models\Store;
use App\Services\ActivityLogger;
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
            ->withCount(['users' => fn ($query) => $query->where('store_user.is_active', true)])
            ->when($search !== '', fn ($query) => $query->where(fn ($nested) => $nested
                ->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%")))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('central/stores/index', [
            'stores' => $stores,
            'filters' => ['search' => $search],
        ]);
    }

    public function store(StoreRequest $request, ActivityLogger $logger): RedirectResponse
    {
        $store = DB::transaction(function () use ($request, $logger): Store {
            $store = Store::create($request->validated());
            $logger->log('store.created', $store, newValues: $store->only(['code', 'name', 'address', 'is_active']));

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

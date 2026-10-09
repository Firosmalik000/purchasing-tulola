<?php

namespace App\Http\Controllers\Central;

use App\Actions\Inventory\UpdateStoreStock;
use App\Actions\Inventory\UpdateStoreStockStandard;
use App\Enums\StockMovementType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Central\UpdateStoreStockRequest;
use App\Http\Requests\Central\UpdateStoreStockStandardRequest;
use App\Models\Item;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\StoreStock;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', StoreStock::class);
        $stores = Store::query()->where('is_active', true)->orderBy('name')->get(['id', 'code', 'name']);
        $storeId = $request->integer('store_id') ?: $stores->first()?->id;
        $search = trim((string) $request->string('search'));

        return Inertia::render('central/inventory/index', [
            'stores' => $stores,
            'selectedStoreId' => $storeId,
            'items' => Item::query()->where('is_active', true)
                ->with(['category:id,name', 'unit:id,symbol', 'stocks' => fn ($query) => $query->where('store_id', $storeId), 'stockStandards' => fn ($query) => $query->where('store_id', $storeId)])
                ->when($search !== '', fn ($query) => $query->where(fn ($nested) => $nested->where('sku', 'like', "%{$search}%")->orWhere('name', 'like', "%{$search}%")))
                ->orderBy('name')->paginate(\App\Support\Paging::perPage($request))->withQueryString(),
            'movements' => StockMovement::query()->with(['item:id,sku,name', 'creator:id,name', 'supplier:id,code,name'])->when($storeId, fn ($query) => $query->where('store_id', $storeId))->latest()->limit(20)->get(),
            'suppliers' => Supplier::query()->where('is_active', true)->orderBy('name')->get(['id', 'code', 'name']),
            'movementTypes' => collect([StockMovementType::MANUAL_UPDATE, StockMovementType::OPENING_BALANCE, StockMovementType::CORRECTION, StockMovementType::OTHER])->map(fn ($type) => ['value' => $type->value, 'label' => $type->label()]),
            'filters' => ['search' => $search],
        ]);
    }

    public function updateStock(UpdateStoreStockRequest $request, UpdateStoreStock $action): RedirectResponse
    {
        $action->handle(
            Store::findOrFail($request->integer('store_id')),
            Item::findOrFail($request->integer('item_id')),
            (string) $request->input('quantity'),
            StockMovementType::from($request->string('movement_type')->toString()),
            $request->string('reason')->toString(),
            $request->input('notes'),
            unitCost: $request->filled('unit_cost') ? (string) $request->input('unit_cost') : null,
            supplierId: $request->filled('supplier_id') ? $request->integer('supplier_id') : null,
        );

        return back()->with('success', 'Stok resmi berhasil diperbarui.');
    }

    public function updateStandard(UpdateStoreStockStandardRequest $request, UpdateStoreStockStandard $action): RedirectResponse
    {
        $action->handle(Store::findOrFail($request->integer('store_id')), Item::findOrFail($request->integer('item_id')), (string) $request->input('standard_quantity'));

        return back()->with('success', 'Stok standar berhasil diperbarui.');
    }
}

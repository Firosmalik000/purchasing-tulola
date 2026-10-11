<?php

namespace App\Http\Controllers\Central;

use App\Actions\MasterData\SaveMasterData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Central\ItemRequest;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\Unit;
use App\Services\ActivityLogger;
use App\Support\Paging;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ItemController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Item::class);
        $search = trim((string) $request->string('search'));

        return Inertia::render('central/items/index', [
            'items' => Item::query()->with(['category:id,name', 'unit:id,name,symbol'])
                ->when($search !== '', fn ($query) => $query->where(fn ($nested) => $nested->where('sku', 'like', "%{$search}%")->orWhere('name', 'like', "%{$search}%")))
                ->orderBy('name')->paginate(Paging::perPage($request))->withQueryString(),
            'categories' => ItemCategory::query()->orderBy('name')->get(),
            'units' => Unit::query()->orderBy('name')->get(),
            'filters' => ['search' => $search],
        ]);
    }

    public function store(ItemRequest $request, SaveMasterData $action): RedirectResponse
    {
        $action->handle(new Item, $request->validated(), 'item');

        return back()->with('success', 'Item berhasil ditambahkan.');
    }

    public function update(ItemRequest $request, Item $item, SaveMasterData $action): RedirectResponse
    {
        $action->handle($item, $request->validated(), 'item');

        return back()->with('success', 'Item berhasil diperbarui.');
    }

    public function destroy(Item $item, ActivityLogger $logger): RedirectResponse
    {
        Gate::authorize('delete', $item);

        if (
            $item->purchaseRequestItems()->exists()
            || $item->purchaseOrderItems()->exists()
            || $item->stockMovements()->exists()
            || $item->stocks()->where('quantity', '>', 0)->exists()
        ) {
            return back()->with('error', 'Item memiliki histori transaksi atau stok aktif dan tidak dapat dihapus. Anda dapat menonaktifkan item jika sudah tidak digunakan.');
        }

        DB::transaction(function () use ($item, $logger): void {
            $item->stockStandards()->delete();
            $item->stocks()->delete();

            $deletedData = $item->only(['sku', 'name', 'item_category_id', 'unit_id', 'cost_price', 'min_stock', 'target_stock', 'is_active']);
            $item->delete();
            $logger->log('item.deleted', $item, $deletedData);
        });

        return back()->with('success', 'Item berhasil dihapus.');
    }
}

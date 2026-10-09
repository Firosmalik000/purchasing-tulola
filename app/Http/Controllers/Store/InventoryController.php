<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Item;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function index(Request $request): Response
    {
        $stores = $request->user()->stores()->wherePivot('is_active', true)->where('stores.is_active', true)->orderBy('name')->get(['stores.id', 'code', 'name']);
        $storeId = $request->integer('store_id') ?: $stores->first()?->id;
        abort_unless($storeId && $stores->contains('id', $storeId), 403);

        return Inertia::render('store/inventory/index', [
            'stores' => $stores,
            'selectedStoreId' => $storeId,
            'items' => Item::query()->where('is_active', true)->with(['unit:id,symbol', 'stocks' => fn ($query) => $query->where('store_id', $storeId), 'stockStandards' => fn ($query) => $query->where('store_id', $storeId)])->orderBy('name')->paginate(\App\Support\Paging::perPage($request))->withQueryString(),
        ]);
    }
}

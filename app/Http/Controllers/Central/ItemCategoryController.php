<?php

namespace App\Http\Controllers\Central;

use App\Actions\MasterData\SaveMasterData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Central\ItemCategoryRequest;
use App\Models\ItemCategory;
use Illuminate\Http\RedirectResponse;

class ItemCategoryController extends Controller
{
    public function store(ItemCategoryRequest $request, SaveMasterData $action): RedirectResponse
    {
        $action->handle(new ItemCategory, $request->validated(), 'item_category');

        return back()->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function update(ItemCategoryRequest $request, ItemCategory $itemCategory, SaveMasterData $action): RedirectResponse
    {
        $action->handle($itemCategory, $request->validated(), 'item_category');

        return back()->with('success', 'Kategori berhasil diperbarui.');
    }
}

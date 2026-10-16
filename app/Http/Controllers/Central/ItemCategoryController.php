<?php

namespace App\Http\Controllers\Central;

use App\Actions\MasterData\SaveMasterData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Central\ItemCategoryRequest;
use App\Models\ItemCategory;
use App\Services\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

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

    public function destroy(ItemCategory $itemCategory, ActivityLogger $logger): RedirectResponse
    {
        Gate::authorize('delete', $itemCategory);

        $deleted = DB::transaction(function () use ($itemCategory, $logger): bool {
            $category = ItemCategory::query()->lockForUpdate()->findOrFail($itemCategory->id);

            if ($category->items()->exists()) {
                return false;
            }

            $deletedData = $category->only(['name', 'code', 'is_active']);
            $category->delete();
            $logger->log('item_category.deleted', $category, $deletedData);

            return true;
        });

        if (! $deleted) {
            return back()->with('error', 'Kategori masih digunakan oleh item dan tidak dapat dihapus. Nonaktifkan kategori jika sudah tidak digunakan.');
        }

        return back()->with('success', 'Kategori berhasil dihapus.');
    }
}

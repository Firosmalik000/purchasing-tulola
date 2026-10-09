<?php

namespace App\Http\Controllers\Central;

use App\Actions\MasterData\SaveMasterData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Central\SupplierRequest;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Supplier::class);
        $search = trim((string) $request->string('search'));

        return Inertia::render('central/suppliers/index', [
            'suppliers' => Supplier::query()
                ->when($search !== '', fn ($query) => $query->where(fn ($nested) => $nested->where('code', 'like', "%{$search}%")->orWhere('name', 'like', "%{$search}%")))
                ->orderBy('name')
                ->paginate(\App\Support\Paging::perPage($request))
                ->withQueryString(),
            'filters' => ['search' => $search],
        ]);
    }

    public function store(SupplierRequest $request, SaveMasterData $action): RedirectResponse
    {
        $action->handle(new Supplier, $request->validated(), 'supplier');

        return back()->with('success', 'Supplier berhasil ditambahkan.');
    }

    public function update(SupplierRequest $request, Supplier $supplier, SaveMasterData $action): RedirectResponse
    {
        $action->handle($supplier, $request->validated(), 'supplier');

        return back()->with('success', 'Supplier berhasil diperbarui.');
    }
}

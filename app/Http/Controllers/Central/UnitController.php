<?php

namespace App\Http\Controllers\Central;

use App\Actions\MasterData\SaveMasterData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Central\UnitRequest;
use App\Models\Unit;
use Illuminate\Http\RedirectResponse;

class UnitController extends Controller
{
    public function store(UnitRequest $request, SaveMasterData $action): RedirectResponse
    {
        $action->handle(new Unit, $request->validated(), 'unit');

        return back()->with('success', 'Satuan berhasil ditambahkan.');
    }

    public function update(UnitRequest $request, Unit $unit, SaveMasterData $action): RedirectResponse
    {
        $action->handle($unit, $request->validated(), 'unit');

        return back()->with('success', 'Satuan berhasil diperbarui.');
    }
}

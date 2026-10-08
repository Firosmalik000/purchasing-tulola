<?php

namespace App\Http\Controllers\Central;

use App\Actions\Orders\BuildPurchasePlan;
use App\Http\Controllers\Controller;
use App\Http\Requests\Central\FilterPurchasePlanningRequest;
use App\Models\Supplier;
use Inertia\Inertia;
use Inertia\Response;

class PurchasePlanningController extends Controller
{
    public function __invoke(FilterPurchasePlanningRequest $request, BuildPurchasePlan $action): Response
    {
        $filters = $request->validated();

        return Inertia::render('central/planning/index', [
            'plan' => $action->handle($filters),
            'suppliers' => Supplier::query()->where('is_active', true)->orderBy('name')->get(['id', 'code', 'name', 'payment_term']),
            'filters' => ['group_by' => (string) ($filters['group_by'] ?? 'item'), 'keyword' => (string) ($filters['keyword'] ?? '')],
        ]);
    }
}

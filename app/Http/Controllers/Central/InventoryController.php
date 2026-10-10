<?php

namespace App\Http\Controllers\Central;

use App\Actions\Inventory\BulkAddStoreStock;
use App\Actions\Inventory\UpdateStoreStock;
use App\Actions\Inventory\UpdateStoreStockStandard;
use App\Enums\StockMovementType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Central\BulkAddStoreStockRequest;
use App\Http\Requests\Central\UpdateStoreStockRequest;
use App\Http\Requests\Central\UpdateStoreStockStandardRequest;
use App\Models\Item;
use App\Models\PurchaseOrder;
use App\Models\Receipt;
use App\Models\StockBatch;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\StoreStock;
use App\Models\Supplier;
use App\Support\Paging;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', StoreStock::class);
        $centralStore = Store::query()->where('is_active', true)
            ->where(fn ($q) => $q->where('code', 'HO-JKT')->orWhere('name', 'like', '%Head Office%')->orWhere('name', 'like', '%Pusat%'))
            ->first() ?? Store::query()->where('is_active', true)->orderBy('id')->first();

        $storeId = $centralStore?->id;
        $search = trim((string) $request->string('search'));
        $tab = $request->string('tab')->toString() ?: 'stocks';
        $movementType = $request->string('movement_type')->toString();

        $dateFrom = $request->filled('date_from')
            ? $request->string('date_from')->toString()
            : now()->startOfMonth()->toDateString();
        $dateTo = $request->filled('date_to')
            ? $request->string('date_to')->toString()
            : now()->endOfMonth()->toDateString();

        $movementsQuery = StockMovement::query()
            ->with([
                'item:id,sku,name,unit_id',
                'item.unit:id,symbol',
                'creator:id,name',
                'supplier:id,code,name',
                'store:id,code,name',
                'reference',
            ])
            ->when($storeId, fn ($query) => $query->where('store_id', $storeId))
            ->when($dateFrom, fn ($query) => $query->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo, fn ($query) => $query->whereDate('created_at', '<=', $dateTo))
            ->when($movementType !== '', fn ($query) => $query->where('movement_type', $movementType))
            ->when($search !== '', fn ($query) => $query->whereHas('item', fn ($nested) => $nested->where('sku', 'like', "%{$search}%")->orWhere('name', 'like', "%{$search}%")))
            ->latest('id');

        $allMovements = $movementsQuery->get();

        $grouped = $allMovements->groupBy(function (StockMovement $m) {
            if ($m->reference_type && $m->reference_id) {
                return "{$m->reference_type}:{$m->reference_id}";
            }

            return "mov:{$m->id}";
        });

        $transactions = $grouped->map(function ($groupMovements) {
            /** @var Collection<int, StockMovement> $groupMovements */
            $first = $groupMovements->first();
            $reference = $first->reference;

            $batchNumber = match (true) {
                $reference instanceof StockBatch => $reference->batch_number,
                $reference instanceof Receipt => $reference->number,
                $reference instanceof PurchaseOrder => $reference->number,
                default => sprintf('REQ-%s-%04d', $first->created_at?->format('Ymd') ?? date('Ymd'), $first->id),
            };

            $totalItems = $groupMovements->count();
            $totalQuantityDiff = $groupMovements->sum('quantity_difference');

            $itemsDetail = $groupMovements->sortBy('id')->map(function (StockMovement $m) {
                return [
                    'id' => $m->id,
                    'item_id' => $m->item_id,
                    'sku' => $m->item?->sku ?? '—',
                    'name' => $m->item?->name ?? '—',
                    'unit' => $m->item?->unit?->symbol ?? 'pcs',
                    'previous_quantity' => (int) $m->previous_quantity,
                    'new_quantity' => (int) $m->new_quantity,
                    'quantity_difference' => (int) $m->quantity_difference,
                    'unit_cost' => $m->unit_cost !== null ? (int) $m->unit_cost : null,
                ];
            })->values()->all();

            return [
                'id' => $first->id,
                'batch_id' => $reference instanceof StockBatch ? $reference->id : null,
                'batch_number' => $batchNumber,
                'reference_type' => $first->reference_type,
                'reference_id' => $first->reference_id,
                'store_id' => $first->store_id,
                'movement_type' => $first->movement_type->value ?? (string) $first->movement_type,
                'reason' => $first->reason,
                'notes' => $first->notes ?? ($reference instanceof StockBatch ? $reference->notes : null),
                'supplier' => $first->supplier ? [
                    'id' => $first->supplier->id,
                    'code' => $first->supplier->code,
                    'name' => $first->supplier->name,
                ] : null,
                'creator' => $first->creator ? [
                    'id' => $first->creator->id,
                    'name' => $first->creator->name,
                ] : null,
                'created_at' => $first->created_at?->toISOString() ?? now()->toISOString(),
                'total_items' => $totalItems,
                'quantity_difference' => $totalQuantityDiff,
                'previous_quantity' => $totalItems === 1 ? (int) $first->previous_quantity : null,
                'new_quantity' => $totalItems === 1 ? (int) $first->new_quantity : null,
                'item' => [
                    'id' => $totalItems === 1 ? $first->item?->id : null,
                    'sku' => $totalItems === 1 ? ($first->item?->sku ?? '—') : 'MULTI',
                    'name' => $totalItems === 1 ? ($first->item?->name ?? '—') : "{$totalItems} Item Kolektif",
                    'unit' => $totalItems === 1 ? ($first->item?->unit?->symbol ?? 'pcs') : null,
                ],
                'items' => $itemsDetail,
            ];
        })->values();

        $page = (int) $request->input('movement_page', 1);
        $perPage = Paging::perPage($request, 20);
        $total = $transactions->count();

        $pagedData = $transactions->slice(($page - 1) * $perPage, $perPage)->values();

        $paginatedTransactions = new LengthAwarePaginator(
            $pagedData,
            $total,
            $perPage,
            $page,
            [
                'path' => $request->url(),
                'query' => $request->query(),
                'pageName' => 'movement_page',
            ],
        );

        return Inertia::render('central/inventory/index', [
            'centralStore' => $centralStore ? ['id' => $centralStore->id, 'code' => $centralStore->code, 'name' => $centralStore->name] : null,
            'selectedStoreId' => $storeId,
            'items' => Item::query()->where('is_active', true)
                ->with([
                    'category:id,name',
                    'unit:id,symbol',
                    'stocks' => fn ($query) => $query->where('store_id', $storeId),
                    'stockStandards' => fn ($query) => $query->where('store_id', $storeId),
                ])
                ->when($search !== '', fn ($query) => $query->where(fn ($nested) => $nested->where('sku', 'like', "%{$search}%")->orWhere('name', 'like', "%{$search}%")))
                ->orderBy('name')->paginate(Paging::perPage($request))->withQueryString(),
            'allItems' => Item::query()->where('is_active', true)
                ->with('unit:id,symbol')
                ->orderBy('name')
                ->get(['id', 'sku', 'name', 'unit_id', 'cost_price', 'min_stock', 'target_stock']),
            'movements' => $paginatedTransactions,
            'suppliers' => Supplier::query()->where('is_active', true)->orderBy('name')->get(['id', 'code', 'name']),
            'movementTypes' => collect([
                StockMovementType::STOCK_IN,
                StockMovementType::MANUAL_UPDATE,
                StockMovementType::ORDER_RECEIVED,
                StockMovementType::DISTRIBUTION_OUT,
                StockMovementType::OPENING_BALANCE,
                StockMovementType::CORRECTION,
                StockMovementType::OTHER,
            ])->map(fn ($type) => ['value' => $type->value, 'label' => $type->label()]),
            'filters' => [
                'search' => $search,
                'tab' => $tab,
                'movement_type' => $movementType,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }

    public function updateStock(UpdateStoreStockRequest $request, UpdateStoreStock $action): RedirectResponse
    {
        $store = Store::findOrFail($request->integer('store_id'));
        $item = Item::findOrFail($request->integer('item_id'));
        $type = StockMovementType::from($request->string('movement_type')->toString());
        $reason = $request->string('reason')->toString();
        $notes = $request->input('notes');
        $supplierId = $request->filled('supplier_id') ? $request->integer('supplier_id') : null;
        $quantity = (string) $request->input('quantity');

        $dateStr = Carbon::now()->format('Ymd');
        $countToday = StockBatch::query()->whereDate('created_at', Carbon::today())->count();
        $batchNumber = sprintf('STK-%s-%04d', $dateStr, $countToday + 1);

        $batch = StockBatch::create([
            'batch_number' => $batchNumber,
            'store_id' => $store->id,
            'movement_type' => $type,
            'reason' => $reason,
            'notes' => $notes,
            'supplier_id' => $supplierId,
            'created_by' => $request->user()?->id,
            'item_count' => 1,
            'total_quantity' => (int) $quantity,
        ]);

        $action->handle(
            $store,
            $item,
            $quantity,
            $type,
            $reason,
            $notes,
            reference: $batch,
            actor: $request->user(),
            unitCost: $request->filled('unit_cost') ? (string) $request->input('unit_cost') : null,
            supplierId: $supplierId,
        );

        return back()->with('success', 'Stok resmi berhasil diperbarui.');
    }

    public function bulkStock(BulkAddStoreStockRequest $request, BulkAddStoreStock $action): RedirectResponse
    {
        $store = Store::findOrFail($request->integer('store_id'));
        $count = $action->handle($store, $request->validated(), $request->user());

        return back()->with('success', "Berhasil menambahkan stok secara kolektif untuk {$count} item di toko {$store->name}.");
    }

    public function updateStandard(UpdateStoreStockStandardRequest $request, UpdateStoreStockStandard $action): RedirectResponse
    {
        $action->handle(
            Store::findOrFail($request->integer('store_id')),
            Item::findOrFail($request->integer('item_id')),
            (string) $request->input('standard_quantity'),
            $request->has('min_quantity') ? (string) $request->input('min_quantity') : null,
        );

        return back()->with('success', 'Stok standar berhasil diperbarui.');
    }
}

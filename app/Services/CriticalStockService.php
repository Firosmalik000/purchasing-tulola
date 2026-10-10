<?php

namespace App\Services;

use App\Models\Item;
use App\Models\Store;
use App\Models\User;

class CriticalStockService
{
    /**
     * @return array{count: int, items: array<int, array<string, mixed>>}
     */
    public function getSummaryForUser(?User $user, int $limit = 8): array
    {
        if (! $user) {
            return ['count' => 0, 'items' => []];
        }

        $isStore = $user->role->value === 'STORE_PIC';

        // Cabang tidak ada tracking stok (hanya request & receive)
        if ($isStore) {
            return ['count' => 0, 'items' => []];
        }

        // Data & tracking stok murni hanya untuk Gudang Pusat (Head Office)
        $centralStore = Store::centralStore();
        if (! $centralStore) {
            return ['count' => 0, 'items' => []];
        }

        $items = Item::query()
            ->where('is_active', true)
            ->with([
                'unit:id,symbol,name',
                'stocks' => fn ($q) => $q->where('store_id', $centralStore->id),
                'stockStandards' => fn ($q) => $q->where('store_id', $centralStore->id),
            ])
            ->get();

        $criticalList = collect();

        foreach ($items as $item) {
            $currentQty = (int) ($item->stocks->first()->quantity ?? 0);
            $storeStandard = $item->stockStandards->first();

            // Effective min: custom store min_quantity if set, otherwise item global min_stock
            $minQty = $storeStandard?->min_quantity !== null
                ? (int) $storeStandard->min_quantity
                : (int) ($item->min_stock ?? 0);

            // Effective target: custom store standard_quantity if set, otherwise item global target_stock
            $targetQty = $storeStandard?->standard_quantity !== null && (int) $storeStandard->standard_quantity > 0
                ? (int) $storeStandard->standard_quantity
                : (int) ($item->target_stock ?? $minQty);

            // Critical when minQty > 0 and currentQty <= minQty
            if ($minQty > 0 && $currentQty <= $minQty) {
                $criticalList->push([
                    'item_id' => $item->id,
                    'name' => $item->name,
                    'sku' => $item->sku,
                    'unit' => $item->unit->symbol ?? 'pcs',
                    'store_id' => $centralStore->id,
                    'store_code' => $centralStore->code,
                    'store_name' => $centralStore->name,
                    'current_stock' => $currentQty,
                    'min_stock' => $minQty,
                    'target_stock' => $targetQty,
                    'deficit' => max($targetQty - $currentQty, 0),
                ]);
            }
        }

        $sorted = $criticalList->sortByDesc('deficit')->values();

        return [
            'count' => $sorted->count(),
            'items' => $sorted->take($limit)->all(),
        ];
    }
}

<?php

namespace App\Actions\Requests;

use App\Enums\PurchaseRequestItemType;
use App\Enums\PurchaseRequestStatus;
use App\Models\Item;
use App\Models\PurchaseRequest;
use App\Models\Store;
use App\Models\StoreStock;
use App\Models\StoreStockStandard;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubmitPurchaseRequest
{
    public function __construct(private TransitionPurchaseRequestStatus $transition) {}

    public function handle(PurchaseRequest $request, User $actor): PurchaseRequest
    {
        return DB::transaction(function () use ($request, $actor): PurchaseRequest {
            $request = PurchaseRequest::query()->with('items')->lockForUpdate()->findOrFail($request->id);
            if ($request->items->isEmpty()) {
                throw ValidationException::withMessages(['request' => 'Draft harus memiliki item sebelum diajukan.']);
            }

            $centralStore = Store::centralStore();
            if ($centralStore) {
                $invalidItems = [];
                foreach ($request->items as $line) {
                    if ($line->type !== PurchaseRequestItemType::STOCK) {
                        continue;
                    }
                    $currentCentral = (int) (StoreStock::query()
                        ->where('store_id', $centralStore->id)
                        ->where('item_id', $line->item_id)
                        ->lockForUpdate()
                        ->value('quantity') ?? 0);

                    if ($currentCentral < $line->requested_quantity) {
                        $item = $line->item ?? Item::query()->find($line->item_id);
                        $invalidItems[] = [
                            'name' => $item?->name ?? "Item #{$line->item_id}",
                            'available' => $currentCentral,
                            'requested' => $line->requested_quantity,
                        ];
                    }
                }

                if (! empty($invalidItems)) {
                    if (count($invalidItems) === 1) {
                        $first = $invalidItems[0];
                        $message = $first['available'] <= 0
                            ? "Item \"{$first['name']}\" yang di-request sedang tidak ada stok di Kantor Pusat."
                            : "Stok item \"{$first['name']}\" di Kantor Pusat tidak mencukupi (Tersedia: {$first['available']}, Diminta: {$first['requested']}).";
                    } else {
                        $lines = array_map(
                            fn ($i) => "• {$i['name']} (Tersedia: {$i['available']}, Diminta: {$i['requested']})",
                            $invalidItems
                        );
                        $message = "Terdapat ".count($invalidItems)." item yang stoknya tidak mencukupi di Kantor Pusat:\n".implode("\n", $lines);
                    }

                    throw ValidationException::withMessages(['stock' => $message]);
                }
            }

            foreach ($request->items as $line) {
                if ($line->type !== PurchaseRequestItemType::STOCK) {
                    continue;
                }
                $current = StoreStock::query()->where('store_id', $request->store_id)->where('item_id', $line->item_id)->lockForUpdate()->value('quantity') ?? 0;
                $storeStandard = StoreStockStandard::query()->where('store_id', $request->store_id)->where('item_id', $line->item_id)->lockForUpdate()->value('standard_quantity');
                $itemMaster = Item::query()->where('id', $line->item_id)->first(['target_stock', 'min_stock']);
                $standard = $storeStandard !== null && (int) $storeStandard > 0
                    ? (int) $storeStandard
                    : (int) ($itemMaster->target_stock ?? $itemMaster->min_stock ?? 0);
                $line->update([
                    'current_stock_snapshot' => $current,
                    'standard_stock_snapshot' => $standard,
                    'suggested_quantity' => max((int) $standard - (int) $current, 0),
                ]);
            }

            $this->transition->handle($request, PurchaseRequestStatus::SUBMITTED, $actor, attributes: ['submitted_at' => now()]);

            return $request->load(['items.item', 'items.unit', 'statusHistories']);
        }, 3);
    }
}

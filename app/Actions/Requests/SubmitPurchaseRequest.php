<?php

namespace App\Actions\Requests;

use App\Enums\PurchaseRequestItemType;
use App\Enums\PurchaseRequestStatus;
use App\Models\Item;
use App\Models\PurchaseRequest;
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

            foreach ($request->items as $line) {
                if ($line->type !== PurchaseRequestItemType::STOCK) {
                    continue;
                }
                $current = StoreStock::query()->where('store_id', $request->store_id)->where('item_id', $line->item_id)->lockForUpdate()->value('quantity') ?? 0;
                $storeStandard = StoreStockStandard::query()->where('store_id', $request->store_id)->where('item_id', $line->item_id)->lockForUpdate()->value('standard_quantity');
                $itemMaster = Item::query()->where('id', $line->item_id)->first(['target_stock', 'min_stock']);
                $standard = $storeStandard !== null && (int) $storeStandard > 0
                    ? (int) $storeStandard
                    : (int) ($itemMaster?->target_stock ?? $itemMaster?->min_stock ?? 0);
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

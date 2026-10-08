<?php

namespace App\Actions\Requests;

use App\Enums\PurchaseRequestItemType;
use App\Enums\PurchaseRequestStatus;
use App\Models\Item;
use App\Models\PurchaseRequest;
use App\Models\Store;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Support\Facades\DB;

class SavePurchaseRequestDraft
{
    public function __construct(private GeneratePurchaseRequestNumber $numbers, private ActivityLogger $logger) {}

    /** @param array<string, mixed> $data */
    public function handle(Store $store, User $actor, array $data, ?PurchaseRequest $request = null): PurchaseRequest
    {
        return DB::transaction(function () use ($store, $actor, $data, $request): PurchaseRequest {
            $creating = $request === null;
            $request ??= new PurchaseRequest([
                'number' => $this->numbers->handle($store), 'store_id' => $store->id,
                'requested_by' => $actor->id, 'status' => PurchaseRequestStatus::DRAFT,
            ]);
            $request->fill(['required_date' => $data['required_date'] ?? null, 'notes' => $data['notes'] ?? null])->save();
            $request->items()->delete();

            foreach ($data['stock_items'] ?? [] as $line) {
                $item = Item::query()->findOrFail((int) $line['item_id']);
                $request->items()->create(['type' => PurchaseRequestItemType::STOCK, 'item_id' => $item->id, 'unit_id' => $item->unit_id, 'requested_quantity' => $line['requested_quantity']]);
            }
            foreach ($data['special_items'] ?? [] as $line) {
                $request->items()->create(['type' => PurchaseRequestItemType::SPECIAL, 'name' => $line['name'], 'description' => $line['description'] ?? null, 'unit_id' => $line['unit_id'], 'requested_quantity' => $line['requested_quantity'], 'estimated_price' => $line['estimated_price'] ?? null, 'required_date' => $line['required_date'] ?? null, 'reason' => $line['reason']]);
            }

            if ($creating) {
                $request->statusHistories()->create(['from_status' => null, 'to_status' => PurchaseRequestStatus::DRAFT, 'changed_by' => $actor->id]);
            }
            $this->logger->log($creating ? 'purchase_request.draft_created' : 'purchase_request.draft_updated', $request, newValues: ['number' => $request->number, 'item_count' => $request->items()->count()]);

            return $request->load('items');
        }, 3);
    }
}

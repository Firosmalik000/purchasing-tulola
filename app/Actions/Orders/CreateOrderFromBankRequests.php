<?php

namespace App\Actions\Orders;

use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemStatus;
use App\Enums\PurchaseRequestItemType;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequestItem;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateOrderFromBankRequests
{
    public function __construct(
        private GeneratePurchaseOrderNumber $numbers,
        private ActivityLogger $logger,
    ) {}

    /**
     * @param  array<int, array{id: int, quantity?: int|null}>  $items
     * @return Collection<int, PurchaseOrder>
     */
    public function handle(array $items, User $actor, ?string $expectedDate = null, ?string $notes = null): Collection
    {
        return DB::transaction(function () use ($items, $actor, $expectedDate, $notes): Collection {
            $inputMap = collect($items)->keyBy('id');
            $itemIds = $inputMap->keys()->all();

            $bankItems = PurchaseRequestItem::query()
                ->whereIn('id', $itemIds)
                ->where('type', PurchaseRequestItemType::SPECIAL)
                ->where(function ($q) {
                    $q->where(function ($sub) {
                        $sub->where('bank_quantity', '>', 0)
                            ->whereNull('bank_ordered_at');
                    })->orWhere(function ($sub) {
                        $sub->where('status', PurchaseRequestItemStatus::BANK_PERMINTAAN)
                            ->whereDoesntHave('orderAllocations');
                    });
                })
                ->with(['purchaseRequest.store', 'unit'])
                ->lockForUpdate()
                ->get();

            if ($bankItems->count() !== count($itemIds)) {
                throw ValidationException::withMessages([
                    'items' => 'Beberapa item yang dipilih tidak valid atau sudah diproses ke order lain.',
                ]);
            }

            if ($bankItems->isEmpty()) {
                throw ValidationException::withMessages([
                    'items' => 'Pilih minimal satu item dari Bank Permintaan.',
                ]);
            }

            // Group by store so each store receives its own dedicated PurchaseOrder
            $groupedByStore = $bankItems->groupBy(fn (PurchaseRequestItem $item) => $item->purchaseRequest->store_id);
            $createdOrders = collect();

            foreach ($groupedByStore as $storeId => $storeItems) {
                $uniqueRequestIds = $storeItems->pluck('purchase_request_id')->unique();
                $singleRequestId = $uniqueRequestIds->count() === 1 ? $uniqueRequestIds->first() : null;

                $order = PurchaseOrder::create([
                    'number' => $this->numbers->handle(),
                    'purchase_request_id' => $singleRequestId,
                    'order_date' => now()->toDateString(),
                    'expected_date' => $expectedDate,
                    'notes' => $notes ?: 'Order pengadaan dari Bank Permintaan.',
                    'status' => PurchaseOrderStatus::DRAFT,
                    'created_by' => $actor->id,
                ]);

                foreach ($storeItems as $line) {
                    $requestedQty = (int) ($inputMap[$line->id]['quantity'] ?? 0);
                    $quantity = $requestedQty > 0 ? $requestedQty : ($line->bank_quantity ?: $line->approved_quantity ?: $line->requested_quantity);

                    $orderItem = $order->items()->create([
                        'item_type' => PurchaseRequestItemType::SPECIAL,
                        'item_id' => $line->item_id,
                        'name' => $line->name,
                        'unit_id' => $line->unit_id,
                        'quantity' => $quantity,
                    ]);

                    $orderItem->allocations()->create([
                        'purchase_request_item_id' => $line->id,
                        'allocated_quantity' => $quantity,
                    ]);

                    $newStatus = (($line->approved_quantity + $quantity) >= $line->requested_quantity)
                        ? PurchaseRequestItemStatus::APPROVED
                        : PurchaseRequestItemStatus::PARTIALLY_APPROVED;

                    $line->update([
                        'bank_ordered_at' => now(),
                        'status' => $newStatus,
                    ]);
                }

                $this->logger->log('purchase_order.created_from_bank', $order, newValues: [
                    'number' => $order->number,
                    'store_id' => $storeId,
                    'item_count' => $storeItems->count(),
                ]);

                $createdOrders->push($order->load(['items.allocations.purchaseRequestItem', 'purchaseRequest.store']));
            }

            return $createdOrders;
        }, 3);
    }
}

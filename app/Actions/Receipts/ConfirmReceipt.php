<?php

namespace App\Actions\Receipts;

use App\Actions\Inventory\UpdateStoreStock;
use App\Actions\Orders\TransitionPurchaseOrderStatus;
use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemType;
use App\Enums\ReceiptStatus;
use App\Enums\StockMovementType;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderRequestItem;
use App\Models\Receipt;
use App\Models\ReceiptItem;
use App\Models\Store;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ConfirmReceipt
{
    public function __construct(
        private GenerateReceiptNumber $numbers,
        private TransitionPurchaseOrderStatus $transition,
        private UpdateStoreStock $stocks,
        private ActivityLogger $logger,
    ) {}

    /** @param array<string, mixed> $data */
    public function handle(PurchaseOrder $purchaseOrder, Store $store, User $actor, array $data): Receipt
    {
        return DB::transaction(function () use ($purchaseOrder, $store, $actor, $data): Receipt {
            $purchaseOrder = PurchaseOrder::query()->lockForUpdate()->findOrFail($purchaseOrder->id);
            if (! in_array($purchaseOrder->status, [PurchaseOrderStatus::ORDERED, PurchaseOrderStatus::PARTIALLY_RECEIVED], true)) {
                throw ValidationException::withMessages(['status' => 'Pesanan belum dapat diterima atau sudah selesai diterima.']);
            }

            $this->ensureAssignedStore($actor, $store);
            $allAllocations = PurchaseOrderRequestItem::query()
                ->whereHas('purchaseOrderItem', fn ($query) => $query->where('purchase_order_id', $purchaseOrder->id))
                ->with(['purchaseRequestItem.purchaseRequest:id,store_id', 'purchaseOrderItem.item'])
                ->orderBy('id')->lockForUpdate()->get()->keyBy('id');
            $input = collect($this->normalizeItems($data))->keyBy('allocation_id');
            $selected = $allAllocations->filter(fn (PurchaseOrderRequestItem $allocation) => $input->has($allocation->id));

            if ($selected->count() !== $input->count()) {
                throw ValidationException::withMessages(['items' => 'Alokasi penerimaan tidak valid.']);
            }

            $receivedQuantities = $this->validateQuantities($selected, $input, $store);
            $receipt = Receipt::create([
                'number' => $this->numbers->handle($store),
                'purchase_order_id' => $purchaseOrder->id,
                'store_id' => $store->id,
                'received_by' => $actor->id,
                'received_at' => $data['received_at'],
                'notes' => $data['notes'] ?? null,
                'status' => ReceiptStatus::CONFIRMED,
            ]);

            foreach ($selected as $allocation) {
                $receipt->items()->create([
                    'purchase_order_item_id' => $allocation->purchase_order_item_id,
                    'purchase_request_item_id' => $allocation->purchase_request_item_id,
                    'ordered_quantity' => $allocation->allocated_quantity,
                    'received_quantity' => $receivedQuantities[$allocation->id],
                ]);
            }

            $receipt->update(['stock_applied_at' => now(), 'stock_applied_by' => $actor->id]);

            $centralStore = Store::centralStore();
            $isCentralDistribution = $centralStore && $store->id !== $centralStore->id;

            $selected->filter(fn (PurchaseOrderRequestItem $allocation) => $allocation->purchaseOrderItem->item_type === PurchaseRequestItemType::STOCK)
                ->groupBy(fn (PurchaseOrderRequestItem $allocation): int => $allocation->purchaseOrderItem->item->id)
                ->each(function (Collection $allocations) use ($receipt, $store, $actor, $receivedQuantities, $centralStore, $isCentralDistribution): void {
                    $first = $allocations->first();
                    $quantity = $allocations->sum(fn (PurchaseOrderRequestItem $allocation) => $receivedQuantities[$allocation->id]);

                    $this->stocks->handle(
                        $store,
                        $first->purchaseOrderItem->item,
                        (string) $quantity,
                        StockMovementType::ORDER_RECEIVED,
                        "Penerimaan {$receipt->number}",
                        $receipt->notes,
                        increment: true,
                        reference: $receipt,
                        actor: $actor,
                    );

                    if ($isCentralDistribution && $quantity > 0) {
                        $this->stocks->handle(
                            $centralStore,
                            $first->purchaseOrderItem->item,
                            (string) $quantity,
                            StockMovementType::DISTRIBUTION_OUT,
                            "Distribusi ke {$store->name} ({$receipt->number})",
                            $receipt->notes,
                            increment: false,
                            reference: $receipt,
                            actor: $actor,
                            decrement: true,
                        );
                    }
                });

            $this->synchronizeOrderStatus($purchaseOrder, $allAllocations);
            $this->logger->log('receipt.confirmed', $receipt, newValues: [
                'number' => $receipt->number,
                'purchase_order_id' => $purchaseOrder->id,
                'store_id' => $store->id,
                'item_count' => $selected->count(),
            ]);

            return $receipt->load(['items.purchaseOrderItem', 'items.purchaseRequestItem']);
        }, 3);
    }

    private function ensureAssignedStore(User $actor, Store $store): void
    {
        $assigned = $store->is_active && $actor->stores()->whereKey($store->id)
            ->wherePivot('is_active', true)->exists();
        if (! $assigned) {
            throw ValidationException::withMessages(['store_id' => 'Toko tidak tersedia untuk akun Anda.']);
        }
    }

    /**
     * @param  Collection<int, PurchaseOrderRequestItem>  $allocations
     * @param  Collection<int, array{allocation_id: int, received_quantity: string}>  $input
     * @return array<int, int>
     */
    private function validateQuantities(Collection $allocations, Collection $input, Store $store): array
    {
        $result = [];
        foreach ($allocations as $allocation) {
            if ($allocation->purchaseRequestItem->purchaseRequest->store_id !== $store->id) {
                throw ValidationException::withMessages(['items' => 'Alokasi bukan milik toko yang dipilih.']);
            }

            $alreadyReceived = ReceiptItem::query()
                ->where('purchase_order_item_id', $allocation->purchase_order_item_id)
                ->where('purchase_request_item_id', $allocation->purchase_request_item_id)
                ->whereHas('receipt', fn ($query) => $query->where('status', ReceiptStatus::CONFIRMED))
                ->sum('received_quantity');
            $outstanding = $allocation->allocated_quantity - (int) $alreadyReceived;
            $quantity = (int) $input[$allocation->id]['received_quantity'];
            if ($quantity <= 0 || $quantity > $outstanding) {
                throw ValidationException::withMessages([
                    "items.{$allocation->id}.received_quantity" => 'Jumlah diterima wajib lebih dari 0 dan tidak boleh melebihi outstanding.',
                ]);
            }
            $result[$allocation->id] = $quantity;
        }

        return $result;
    }

    /** @param Collection<int, PurchaseOrderRequestItem> $allocations */
    private function synchronizeOrderStatus(PurchaseOrder $purchaseOrder, Collection $allocations): void
    {
        $ordered = $allocations->sum(fn (PurchaseOrderRequestItem $allocation) => $allocation->allocated_quantity);
        $received = ReceiptItem::query()
            ->whereIn('purchase_order_item_id', $purchaseOrder->items()->pluck('id'))
            ->whereHas('receipt', fn ($query) => $query->where('status', ReceiptStatus::CONFIRMED))
            ->get()->sum(fn (ReceiptItem $item) => $item->received_quantity);
        $next = $received >= $ordered ? PurchaseOrderStatus::COMPLETED : PurchaseOrderStatus::PARTIALLY_RECEIVED;

        if ($purchaseOrder->status !== $next) {
            $this->transition->handle($purchaseOrder, $next, 'Penerimaan toko dikonfirmasi.');
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<int, array{allocation_id: int, received_quantity: string}>
     */
    private function normalizeItems(array $data): array
    {
        $items = [];
        foreach ((array) ($data['items'] ?? []) as $item) {
            if (is_array($item)) {
                $items[] = [
                    'allocation_id' => (int) ($item['allocation_id'] ?? 0),
                    'received_quantity' => (string) ($item['received_quantity'] ?? '0'),
                ];
            }
        }

        return $items;
    }
}

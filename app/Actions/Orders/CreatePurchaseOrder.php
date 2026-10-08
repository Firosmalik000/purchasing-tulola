<?php

namespace App\Actions\Orders;

use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemType;
use App\Enums\PurchaseRequestStatus;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderRequestItem;
use App\Models\PurchaseRequestItem;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreatePurchaseOrder
{
    public function __construct(private GeneratePurchaseOrderNumber $numbers, private ActivityLogger $logger) {}

    /** @param array<string, mixed> $data */
    public function handle(User $actor, array $data): PurchaseOrder
    {
        return DB::transaction(function () use ($actor, $data): PurchaseOrder {
            $allocationInput = collect($this->normalizeAllocations($data))->keyBy(fn (array $value) => $value['purchase_request_item_id']);
            $ids = $allocationInput->keys()->sort()->values();
            $lines = PurchaseRequestItem::query()->whereIn('id', $ids)->orderBy('id')->lockForUpdate()
                ->with(['purchaseRequest.store:id,code,name', 'item:id,sku,name', 'unit:id,name,symbol'])->get()->keyBy('id');

            if ($lines->keys()->sort()->values()->all() !== $ids->all()) {
                throw ValidationException::withMessages(['allocations' => 'Item perencanaan tidak valid.']);
            }

            $quantities = $this->validateAvailableQuantities($lines, $allocationInput);
            $order = PurchaseOrder::create([
                'number' => $this->numbers->handle(),
                'supplier_id' => $data['supplier_id'] ?? null,
                'order_date' => $data['order_date'],
                'expected_date' => $data['expected_date'] ?? null,
                'payment_method' => $data['payment_method'] ?? null,
                'payment_term' => $data['payment_term'] ?? null,
                'notes' => $data['notes'] ?? null,
                'status' => PurchaseOrderStatus::DRAFT,
                'created_by' => $actor->id,
            ]);

            foreach ($this->groupLines($lines, $quantities) as $group) {
                $orderItem = $order->items()->create([
                    'item_type' => $group['type'], 'item_id' => $group['item_id'], 'name' => $group['name'],
                    'unit_id' => $group['unit_id'], 'quantity' => $group['quantity'], 'unit_price' => 0, 'total' => 0,
                ]);
                foreach ($group['allocations'] as $lineId => $quantity) {
                    $orderItem->allocations()->create(['purchase_request_item_id' => $lineId, 'allocated_quantity' => $quantity]);
                }
            }

            $this->logger->log('purchase_order.created', $order, newValues: [
                'number' => $order->number, 'allocation_count' => $quantities->count(),
            ]);

            return $order->load(['items.allocations.purchaseRequestItem']);
        }, 3);
    }

    /**
     * @param  Collection<int, PurchaseRequestItem>  $lines
     * @param  Collection<int, array{purchase_request_item_id: int, allocated_quantity: string}>  $input
     * @return Collection<int, numeric-string>
     */
    private function validateAvailableQuantities(Collection $lines, Collection $input): Collection
    {
        return $lines->mapWithKeys(function (PurchaseRequestItem $line) use ($input): array {
            if ($line->purchaseRequest->status !== PurchaseRequestStatus::PROCESSED || (float) $line->approved_quantity <= 0) {
                throw ValidationException::withMessages(['allocations' => 'Hanya item request berstatus Diproses yang dapat dialokasikan.']);
            }

            $allocated = PurchaseOrderRequestItem::query()->where('purchase_request_item_id', $line->id)
                ->whereHas('purchaseOrderItem.purchaseOrder', fn ($query) => $query->where('status', '!=', PurchaseOrderStatus::CANCELLED))
                ->lockForUpdate()->get()->sum(fn (PurchaseOrderRequestItem $allocation) => (float) $allocation->allocated_quantity);
            $available = max((float) $line->approved_quantity - $allocated, 0);
            $quantity = (float) $input[$line->id]['allocated_quantity'];
            if ($quantity <= 0 || $quantity > $available) {
                throw ValidationException::withMessages(["allocations.{$line->id}.allocated_quantity" => 'Jumlah alokasi wajib lebih dari 0 dan tidak boleh melebihi sisa approved quantity.']);
            }

            return [$line->id => number_format($quantity, 3, '.', '')];
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<int, array{purchase_request_item_id: int, allocated_quantity: string}>
     */
    private function normalizeAllocations(array $data): array
    {
        $allocations = [];
        foreach ((array) ($data['allocations'] ?? []) as $allocation) {
            if (! is_array($allocation)) {
                continue;
            }
            $allocations[] = [
                'purchase_request_item_id' => (int) ($allocation['purchase_request_item_id'] ?? 0),
                'allocated_quantity' => (string) ($allocation['allocated_quantity'] ?? '0'),
            ];
        }

        return $allocations;
    }

    /**
     * @param  Collection<int, PurchaseRequestItem>  $lines
     * @param  Collection<int, numeric-string>  $quantities
     * @return array<int, array{type: PurchaseRequestItemType, item_id: int|null, name: string|null, unit_id: int, quantity: string, allocations: array<int, string>}>
     */
    private function groupLines(Collection $lines, Collection $quantities): array
    {
        return $lines->groupBy(fn (PurchaseRequestItem $line) => $line->type === PurchaseRequestItemType::STOCK ? "STOCK:{$line->item_id}:{$line->unit_id}" : "SPECIAL:{$line->id}")
            ->map(function (Collection $group) use ($quantities): array {
                $first = $group->first();
                $allocations = $group->mapWithKeys(fn (PurchaseRequestItem $line) => [$line->id => $quantities[$line->id]])->all();

                return [
                    'type' => $first->type, 'item_id' => $first->item_id,
                    'name' => $first->type === PurchaseRequestItemType::SPECIAL ? $first->name : null,
                    'unit_id' => $first->unit_id,
                    'quantity' => number_format(array_sum(array_map('floatval', $allocations)), 3, '.', ''),
                    'allocations' => $allocations,
                ];
            })->values()->all();
    }
}

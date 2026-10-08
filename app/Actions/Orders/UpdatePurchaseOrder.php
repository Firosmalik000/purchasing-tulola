<?php

namespace App\Actions\Orders;

use App\Enums\PurchaseOrderStatus;
use App\Models\PurchaseOrder;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Support\Decimal;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdatePurchaseOrder
{
    public function __construct(private ActivityLogger $logger) {}

    /** @param array<string, mixed> $data */
    public function handle(PurchaseOrder $purchaseOrder, User $actor, array $data): PurchaseOrder
    {
        return DB::transaction(function () use ($purchaseOrder, $actor, $data): PurchaseOrder {
            $purchaseOrder = PurchaseOrder::query()->with('items')->lockForUpdate()->findOrFail($purchaseOrder->id);
            if ($purchaseOrder->status !== PurchaseOrderStatus::DRAFT) {
                throw ValidationException::withMessages(['status' => 'Hanya draft pesanan yang dapat diperbarui.']);
            }

            $prices = collect($this->normalizePrices($data));
            if ($prices->keys()->sort()->values()->all() !== $purchaseOrder->items->pluck('id')->sort()->values()->all()) {
                throw ValidationException::withMessages(['items' => 'Seluruh item pesanan harus memiliki harga.']);
            }

            $purchaseOrder->update([
                'supplier_id' => $data['supplier_id'] ?? null, 'order_date' => $data['order_date'],
                'expected_date' => $data['expected_date'] ?? null, 'payment_method' => $data['payment_method'] ?? null,
                'payment_term' => $data['payment_term'] ?? null, 'notes' => $data['notes'] ?? null,
            ]);
            foreach ($purchaseOrder->items as $item) {
                $price = number_format((float) $prices[$item->id], 2, '.', '');
                $item->update(['unit_price' => $price, 'total' => Decimal::moneyTotal($item->quantity, $price)]);
            }
            $this->logger->log('purchase_order.updated', $purchaseOrder, newValues: [
                'number' => $purchaseOrder->number,
                'total' => $purchaseOrder->items()->sum('total'),
                'updated_by' => $actor->id,
            ]);

            return $purchaseOrder->load(['supplier', 'items.item', 'items.unit', 'items.allocations']);
        }, 3);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<int, string>
     */
    private function normalizePrices(array $data): array
    {
        $prices = [];
        foreach ((array) ($data['items'] ?? []) as $item) {
            if (! is_array($item)) {
                continue;
            }
            $prices[(int) ($item['id'] ?? 0)] = (string) ($item['unit_price'] ?? '0');
        }

        return $prices;
    }
}

<?php

namespace App\Actions\Orders;

use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemType;
use App\Enums\PurchaseRequestStatus;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseRequestItem;
use App\Support\Decimal;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class BuildPurchasePlan
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, array<string, mixed>>
     */
    public function handle(array $filters): LengthAwarePaginator
    {
        $keyword = trim((string) ($filters['keyword'] ?? ''));
        $groupBy = (string) ($filters['group_by'] ?? 'item');
        $lines = PurchaseRequestItem::query()
            ->whereHas('purchaseRequest', fn ($query) => $query->where('status', PurchaseRequestStatus::PROCESSED))
            ->where('approved_quantity', '>', 0)
            ->with(['purchaseRequest.store:id,code,name', 'item.category:id,name', 'unit:id,name,symbol'])
            ->withSum(['orderAllocations as allocated_quantity' => fn ($query) => $query
                ->whereHas('purchaseOrderItem.purchaseOrder', fn ($orders) => $orders->where('status', '!=', PurchaseOrderStatus::CANCELLED))], 'allocated_quantity')
            ->when($keyword !== '', fn ($query) => $query->where(fn ($search) => $search
                ->where('name', 'like', "%{$keyword}%")
                ->orWhereHas('item', fn ($items) => $items->where('sku', 'like', "%{$keyword}%")->orWhere('name', 'like', "%{$keyword}%"))
                ->orWhereHas('purchaseRequest.store', fn ($stores) => $stores->where('code', 'like', "%{$keyword}%")->orWhere('name', 'like', "%{$keyword}%"))))
            ->orderBy('id')->get()
            ->filter(fn (PurchaseRequestItem $line) => (float) $line->approved_quantity > (float) ($line->allocated_quantity ?? 0));

        $lastPrices = PurchaseOrderItem::query()->whereIn('item_id', $lines->pluck('item_id')->filter()->unique())
            ->where('unit_price', '>', 0)->latest('id')->get()->unique('item_id')->pluck('unit_price', 'item_id');
        $groups = $lines->groupBy(fn (PurchaseRequestItem $line) => $this->groupKey($line, $groupBy))
            ->map(fn (Collection $group) => $this->formatGroup($group, $groupBy, $lastPrices))->values();
        $page = max(request()->integer('page'), 1);
        $perPage = 15;

        return new LengthAwarePaginator($groups->forPage($page, $perPage)->values(), $groups->count(), $perPage, $page, [
            'path' => request()->url(), 'query' => request()->query(),
        ]);
    }

    private function groupKey(PurchaseRequestItem $line, string $groupBy): string
    {
        return match ($groupBy) {
            'store' => 'store:'.$line->purchaseRequest->store_id,
            'category' => $line->type === PurchaseRequestItemType::STOCK ? 'category:'.$line->item?->item_category_id : 'category:special',
            default => $line->type === PurchaseRequestItemType::STOCK ? 'item:'.$line->item_id : 'special:'.$line->id,
        };
    }

    /**
     * @param  Collection<int, PurchaseRequestItem>  $group
     * @param  Collection<int, string>  $lastPrices
     * @return array<string, mixed>
     */
    private function formatGroup(Collection $group, string $groupBy, Collection $lastPrices): array
    {
        $first = $group->first();
        $lines = $group->map(function (PurchaseRequestItem $line) use ($lastPrices): array {
            $available = number_format((float) $line->approved_quantity - (float) ($line->allocated_quantity ?? 0), 3, '.', '');
            $price = (string) ($line->type === PurchaseRequestItemType::STOCK ? ($lastPrices[$line->item_id] ?? '0.00') : ($line->estimated_price ?? '0.00'));

            return [
                'id' => $line->id, 'type' => $line->type->value,
                'label' => $line->type === PurchaseRequestItemType::STOCK ? $line->item?->name : $line->name,
                'sku' => $line->item?->sku, 'unit' => $line->unit->symbol,
                'store' => $line->purchaseRequest->store, 'request_number' => $line->purchaseRequest->number,
                'requested_quantity' => $line->requested_quantity, 'approved_quantity' => $line->approved_quantity,
                'allocated_quantity' => number_format((float) ($line->allocated_quantity ?? 0), 3, '.', ''),
                'available_quantity' => $available, 'last_unit_price' => number_format((float) $price, 2, '.', ''),
                'estimated_total' => Decimal::moneyTotal($available, $price),
            ];
        })->values();

        $label = match ($groupBy) {
            'store' => $first->purchaseRequest->store->code.' — '.$first->purchaseRequest->store->name,
            'category' => $first->type === PurchaseRequestItemType::STOCK ? $first->item?->category?->name : 'Permintaan Khusus',
            default => $first->type === PurchaseRequestItemType::STOCK ? $first->item?->name : $first->name,
        };

        return [
            'key' => $this->groupKey($first, $groupBy), 'label' => $label,
            'stores' => $group->pluck('purchaseRequest.store.code')->unique()->values(),
            'total_requested' => number_format($group->sum(fn ($line) => (float) $line->requested_quantity), 3, '.', ''),
            'total_approved' => number_format($group->sum(fn ($line) => (float) $line->approved_quantity), 3, '.', ''),
            'total_available' => number_format($lines->sum(fn ($line) => (float) $line['available_quantity']), 3, '.', ''),
            'estimated_total' => number_format($lines->sum(fn ($line) => (float) $line['estimated_total']), 2, '.', ''),
            'lines' => $lines,
        ];
    }
}

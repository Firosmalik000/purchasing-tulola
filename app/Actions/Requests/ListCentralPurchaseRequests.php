<?php

namespace App\Actions\Requests;

use App\Enums\PurchaseRequestStatus;
use App\Models\PurchaseRequest;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ListCentralPurchaseRequests
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, PurchaseRequest>
     */
    public function handle(array $filters): LengthAwarePaginator
    {
        $keyword = trim((string) ($filters['keyword'] ?? ''));

        return PurchaseRequest::query()
            ->where('status', '!=', PurchaseRequestStatus::DRAFT)
            ->with(['store:id,code,name', 'requester:id,name'])
            ->withCount('items')
            ->when($filters['store_id'] ?? null, fn ($query, $storeId) => $query->where('store_id', $storeId))
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['type'] ?? null, fn ($query, $type) => $query->whereHas('items', fn ($items) => $items->where('type', $type)))
            ->when($filters['date_from'] ?? null, fn ($query, $date) => $query->whereDate('created_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn ($query, $date) => $query->whereDate('created_at', '<=', $date))
            ->when($keyword !== '', fn ($query) => $query->where(fn ($search) => $search
                ->where('number', 'like', "%{$keyword}%")
                ->orWhereHas('store', fn ($stores) => $stores->where('code', 'like', "%{$keyword}%")->orWhere('name', 'like', "%{$keyword}%"))
                ->orWhereHas('requester', fn ($users) => $users->where('name', 'like', "%{$keyword}%"))
                ->orWhereHas('items', fn ($items) => $items->where('name', 'like', "%{$keyword}%")->orWhereHas('item', fn ($masterItems) => $masterItems->where('sku', 'like', "%{$keyword}%")->orWhere('name', 'like', "%{$keyword}%")))))
            ->latest()
            ->paginate((int) ($filters['per_page'] ?? 15))
            ->withQueryString();
    }
}

<?php

namespace App\Http\Requests\Central;

use App\Enums\PurchaseRequestItemType;
use App\Enums\PurchaseRequestStatus;
use App\Models\PurchaseRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FilterPurchaseRequestsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', PurchaseRequest::class);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'store_id' => ['nullable', 'integer', Rule::exists('stores', 'id')],
            'status' => ['nullable', Rule::enum(PurchaseRequestStatus::class)->except(PurchaseRequestStatus::DRAFT)],
            'type' => ['nullable', Rule::enum(PurchaseRequestItemType::class)],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'keyword' => ['nullable', 'string', 'max:100'],
        ];
    }
}

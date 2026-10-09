<?php

namespace App\Http\Requests\Central;

use App\Enums\PurchaseOrderStatus;
use App\Models\PurchaseOrder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FilterPurchaseOrdersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', PurchaseOrder::class);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'status' => ['nullable', Rule::enum(PurchaseOrderStatus::class)],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'keyword' => ['nullable', 'string', 'max:100'],
        ];
    }
}

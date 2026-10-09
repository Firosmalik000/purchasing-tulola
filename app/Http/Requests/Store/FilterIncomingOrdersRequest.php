<?php

namespace App\Http\Requests\Store;

use App\Enums\PurchaseOrderStatus;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FilterIncomingOrdersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role === UserRole::STORE_PIC;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'store_id' => ['nullable', 'integer'],
            'status' => ['nullable', Rule::enum(PurchaseOrderStatus::class)->only([
                PurchaseOrderStatus::DRAFT,
                PurchaseOrderStatus::ORDERED,
                PurchaseOrderStatus::PARTIALLY_RECEIVED,
                PurchaseOrderStatus::COMPLETED,
                PurchaseOrderStatus::CANCELLED,
            ])],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ];
    }
}

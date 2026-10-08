<?php

namespace App\Http\Requests\Central;

use App\Models\PurchaseOrder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreatePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', PurchaseOrder::class);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'supplier_id' => ['nullable', Rule::exists('suppliers', 'id')->where('is_active', true)],
            'order_date' => ['required', 'date'], 'expected_date' => ['nullable', 'date', 'after_or_equal:order_date'],
            'payment_method' => ['nullable', 'string', 'max:255'], 'payment_term' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'], 'allocations' => ['required', 'array', 'min:1'],
            'allocations.*.purchase_request_item_id' => ['required', 'integer', 'distinct'],
            'allocations.*.allocated_quantity' => ['required', 'numeric', 'gt:0', 'decimal:0,3'],
        ];
    }

    public function messages(): array
    {
        return ['allocations.required' => 'Pilih minimal satu item perencanaan.', 'allocations.*.allocated_quantity.gt' => 'Jumlah alokasi wajib lebih dari 0.'];
    }
}

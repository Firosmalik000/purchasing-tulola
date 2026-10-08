<?php

namespace App\Http\Requests\Central;

use App\Models\PurchaseOrder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        $order = $this->route('purchase_order');

        return $order instanceof PurchaseOrder && $this->user()->can('update', $order);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'supplier_id' => ['nullable', Rule::exists('suppliers', 'id')->where('is_active', true)],
            'order_date' => ['required', 'date'], 'expected_date' => ['nullable', 'date', 'after_or_equal:order_date'],
            'payment_method' => ['nullable', 'string', 'max:255'], 'payment_term' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'], 'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'integer', 'distinct'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0', 'decimal:0,2'],
        ];
    }
}

<?php

namespace App\Http\Requests\Central;

use App\Enums\StockMovementType;
use App\Models\StoreStock;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStoreStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', StoreStock::class);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'store_id' => ['required', Rule::exists('stores', 'id')->where('is_active', true)],
            'item_id' => ['required', Rule::exists('items', 'id')->where('is_active', true)],
            'quantity' => ['required', 'numeric', 'min:0', 'decimal:0,3'],
            'supplier_id' => ['nullable', Rule::exists('suppliers', 'id')->where('is_active', true)],
            'unit_cost' => ['nullable', 'numeric', 'min:0', 'decimal:0,2'],
            'movement_type' => ['required', Rule::in([StockMovementType::MANUAL_UPDATE->value, StockMovementType::OPENING_BALANCE->value, StockMovementType::CORRECTION->value, StockMovementType::OTHER->value])],
            'reason' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'quantity.min' => 'Jumlah stok tidak boleh negatif.',
            'unit_cost.min' => 'Harga satuan tidak boleh negatif.',
            'reason.required' => 'Alasan perubahan stok wajib diisi.',
        ];
    }
}

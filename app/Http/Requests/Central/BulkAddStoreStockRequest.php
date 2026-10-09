<?php

namespace App\Http\Requests\Central;

use App\Enums\StockMovementType;
use App\Models\StoreStock;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkAddStoreStockRequest extends FormRequest
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
            'movement_type' => ['required', Rule::in([
                StockMovementType::STOCK_IN->value,
                StockMovementType::MANUAL_UPDATE->value,
                StockMovementType::OPENING_BALANCE->value,
                StockMovementType::CORRECTION->value,
                StockMovementType::OTHER->value,
            ])],
            'reason' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'supplier_id' => ['nullable', Rule::exists('suppliers', 'id')->where('is_active', true)],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', Rule::exists('items', 'id')->where('is_active', true)],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_cost' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Minimal pilih 1 barang untuk penambahan stok.',
            'items.min' => 'Minimal pilih 1 barang untuk penambahan stok.',
            'items.*.item_id.required' => 'Barang wajib dipilih.',
            'items.*.quantity.required' => 'Jumlah stok wajib diisi.',
            'items.*.quantity.min' => 'Jumlah stok minimal 1.',
            'items.*.quantity.integer' => 'Jumlah stok wajib berupa bilangan bulat.',
            'items.*.unit_cost.min' => 'Harga satuan tidak boleh negatif.',
            'items.*.unit_cost.integer' => 'Harga satuan wajib berupa bilangan bulat.',
            'reason.required' => 'Alasan penambahan stok wajib diisi.',
        ];
    }
}

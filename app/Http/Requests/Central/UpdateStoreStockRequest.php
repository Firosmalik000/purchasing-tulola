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
            'quantity' => ['required', 'integer', 'min:0'],
            'supplier_id' => ['nullable', Rule::exists('suppliers', 'id')->where('is_active', true)],
            'unit_cost' => ['nullable', 'integer', 'min:0'],
            'movement_type' => ['required', Rule::in([StockMovementType::MANUAL_UPDATE->value, StockMovementType::OPENING_BALANCE->value, StockMovementType::CORRECTION->value, StockMovementType::OTHER->value])],
            'reason' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'store_id.required' => 'Toko wajib dipilih.',
            'store_id.exists' => 'Toko yang dipilih tidak ditemukan atau tidak aktif.',
            'item_id.required' => 'Barang wajib dipilih.',
            'item_id.exists' => 'Barang yang dipilih tidak ditemukan atau tidak aktif.',
            'quantity.required' => 'Jumlah stok wajib diisi.',
            'quantity.min' => 'Jumlah stok tidak boleh negatif.',
            'quantity.integer' => 'Jumlah stok wajib berupa bilangan bulat.',
            'supplier_id.exists' => 'Supplier yang dipilih tidak ditemukan atau tidak aktif.',
            'unit_cost.min' => 'Harga satuan tidak boleh negatif.',
            'unit_cost.integer' => 'Harga satuan wajib berupa bilangan bulat.',
            'movement_type.required' => 'Jenis pergerakan stok wajib dipilih.',
            'movement_type.in' => 'Jenis pergerakan stok yang dipilih tidak valid.',
            'reason.required' => 'Alasan perubahan stok wajib diisi.',
            'reason.string' => 'Alasan perubahan stok harus berupa teks.',
            'reason.max' => 'Alasan perubahan stok maksimal 255 karakter.',
            'notes.string' => 'Catatan harus berupa teks.',
            'notes.max' => 'Catatan maksimal 2000 karakter.',
        ];
    }
}

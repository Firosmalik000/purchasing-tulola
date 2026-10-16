<?php

namespace App\Http\Requests\Central;

use App\Models\StoreStockStandard;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStoreStockStandardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', StoreStockStandard::class);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'store_id' => ['required', Rule::exists('stores', 'id')->where('is_active', true)],
            'item_id' => ['required', Rule::exists('items', 'id')->where('is_active', true)],
            'standard_quantity' => ['required', 'integer', 'min:0'],
            'min_quantity' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'store_id.required' => 'Toko wajib dipilih.',
            'store_id.exists' => 'Toko yang dipilih tidak ditemukan atau tidak aktif.',
            'item_id.required' => 'Barang wajib dipilih.',
            'item_id.exists' => 'Barang yang dipilih tidak ditemukan atau tidak aktif.',
            'standard_quantity.required' => 'Target stok penambahan wajib diisi.',
            'standard_quantity.integer' => 'Target stok penambahan wajib berupa bilangan bulat.',
            'standard_quantity.min' => 'Target stok penambahan tidak boleh negatif.',
            'min_quantity.integer' => 'Standar stok minimum wajib berupa bilangan bulat.',
            'min_quantity.min' => 'Standar stok minimum tidak boleh negatif.',
        ];
    }
}

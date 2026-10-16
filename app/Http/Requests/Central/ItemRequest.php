<?php

namespace App\Http\Requests\Central;

use App\Models\Item;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can($this->route('item') ? 'update' : 'create', $this->route('item') ?? Item::class);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'sku' => ['required', 'string', 'max:64', Rule::unique('items')->ignore($this->route('item'))],
            'name' => ['required', 'string', 'max:255'],
            'item_category_id' => ['required', Rule::exists('item_categories', 'id')->where('is_active', true)],
            'unit_id' => ['required', Rule::exists('units', 'id')->where('is_active', true)],
            'cost_price' => ['nullable', 'integer', 'min:0'],
            'min_stock' => ['nullable', 'integer', 'min:0'],
            'target_stock' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'sku.required' => 'Kode SKU barang wajib diisi.',
            'sku.string' => 'Kode SKU barang harus berupa teks.',
            'sku.max' => 'Kode SKU barang maksimal 64 karakter.',
            'sku.unique' => 'Kode SKU sudah terdaftar pada barang lain.',
            'name.required' => 'Nama barang wajib diisi.',
            'name.string' => 'Nama barang harus berupa teks.',
            'name.max' => 'Nama barang maksimal 255 karakter.',
            'item_category_id.required' => 'Kategori barang wajib dipilih.',
            'item_category_id.exists' => 'Kategori barang yang dipilih tidak ditemukan atau tidak aktif.',
            'unit_id.required' => 'Satuan barang wajib dipilih.',
            'unit_id.exists' => 'Satuan barang yang dipilih tidak ditemukan atau tidak aktif.',
            'cost_price.integer' => 'Harga modal wajib berupa bilangan bulat.',
            'cost_price.min' => 'Harga modal tidak boleh negatif.',
            'min_stock.integer' => 'Stok minimum wajib berupa bilangan bulat.',
            'min_stock.min' => 'Stok minimum tidak boleh negatif.',
            'target_stock.integer' => 'Standar target penambahan stok wajib berupa bilangan bulat.',
            'target_stock.min' => 'Standar target penambahan stok tidak boleh negatif.',
            'is_active.required' => 'Status aktif wajib dipilih.',
            'is_active.boolean' => 'Status aktif harus bernilai benar atau salah.',
        ];
    }
}

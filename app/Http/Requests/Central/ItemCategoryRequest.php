<?php

namespace App\Http\Requests\Central;

use App\Models\ItemCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ItemCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can($this->route('item_category') ? 'update' : 'create', $this->route('item_category') ?? ItemCategory::class);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('item_categories')->ignore($this->route('item_category'))],
            'code' => ['nullable', 'string', 'max:24', Rule::unique('item_categories')->ignore($this->route('item_category'))],
            'is_active' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama kategori wajib diisi.',
            'name.string' => 'Nama kategori harus berupa teks.',
            'name.max' => 'Nama kategori maksimal 255 karakter.',
            'name.unique' => 'Nama kategori sudah digunakan.',
            'code.string' => 'Kode kategori harus berupa teks.',
            'code.max' => 'Kode kategori maksimal 24 karakter.',
            'code.unique' => 'Kode kategori sudah digunakan.',
            'is_active.required' => 'Status aktif wajib dipilih.',
            'is_active.boolean' => 'Status aktif harus bernilai benar atau salah.',
        ];
    }
}

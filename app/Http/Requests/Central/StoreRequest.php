<?php

namespace App\Http\Requests\Central;

use App\Models\Store;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        $store = $this->route('store');

        return $store instanceof Store
            ? $this->user()->can('update', $store)
            : $this->user()->can('create', Store::class);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:24', Rule::unique('stores')->ignore($this->route('store'))],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Kode toko wajib diisi.',
            'code.unique' => 'Kode toko sudah digunakan.',
            'name.required' => 'Nama toko wajib diisi.',
        ];
    }
}

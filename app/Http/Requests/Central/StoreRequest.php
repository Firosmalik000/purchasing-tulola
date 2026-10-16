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
            'pic_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'is_pic' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Kode toko wajib diisi.',
            'code.string' => 'Kode toko harus berupa teks.',
            'code.max' => 'Kode toko maksimal 24 karakter.',
            'code.unique' => 'Kode toko sudah digunakan.',
            'name.required' => 'Nama toko wajib diisi.',
            'name.string' => 'Nama toko harus berupa teks.',
            'name.max' => 'Nama toko maksimal 255 karakter.',
            'address.max' => 'Alamat toko maksimal 2000 karakter.',
            'pic_user_id.exists' => 'Pengguna PIC toko yang dipilih tidak ditemukan.',
            'is_active.required' => 'Status aktif wajib dipilih.',
            'is_active.boolean' => 'Status aktif harus bernilai benar atau salah.',
            'is_pic.boolean' => 'Status PIC harus bernilai benar atau salah.',
        ];
    }
}

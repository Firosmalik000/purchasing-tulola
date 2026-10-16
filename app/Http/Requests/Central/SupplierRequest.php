<?php

namespace App\Http\Requests\Central;

use App\Models\Supplier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can($this->route('supplier') ? 'update' : 'create', $this->route('supplier') ?? Supplier::class);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:32', Rule::unique('suppliers')->ignore($this->route('supplier'))],
            'name' => ['required', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Kode supplier wajib diisi.',
            'code.string' => 'Kode supplier harus berupa teks.',
            'code.max' => 'Kode supplier maksimal 32 karakter.',
            'code.unique' => 'Kode supplier sudah digunakan.',
            'name.required' => 'Nama supplier wajib diisi.',
            'name.string' => 'Nama supplier harus berupa teks.',
            'name.max' => 'Nama supplier maksimal 255 karakter.',
            'contact_person.max' => 'Nama kontak person maksimal 255 karakter.',
            'phone.max' => 'Nomor telepon maksimal 32 karakter.',
            'email.email' => 'Format alamat email supplier tidak valid.',
            'email.max' => 'Alamat email supplier maksimal 255 karakter.',
            'address.max' => 'Alamat supplier maksimal 2000 karakter.',
            'is_active.required' => 'Status aktif wajib dipilih.',
            'is_active.boolean' => 'Status aktif harus bernilai benar atau salah.',
        ];
    }
}

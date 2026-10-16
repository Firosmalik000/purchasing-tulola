<?php

namespace App\Http\Requests\Central;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class CreateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manage-users');
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique(User::class)],
            'role' => ['required', Rule::enum(UserRole::class)],
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'is_active' => ['nullable', 'boolean'],
            'send_invitation' => ['nullable', 'boolean'],
            'store_id' => ['nullable', 'exists:stores,id'],
            'is_pic' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama pengguna wajib diisi.',
            'name.string' => 'Nama pengguna harus berupa teks.',
            'name.max' => 'Nama pengguna maksimal 255 karakter.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format alamat email tidak valid.',
            'email.max' => 'Alamat email maksimal 255 karakter.',
            'email.unique' => 'Alamat email sudah terdaftar.',
            'role.required' => 'Peran pengguna wajib dipilih.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'store_id.exists' => 'Toko yang dipilih tidak ditemukan.',
            'is_pic.boolean' => 'Status PIC harus bernilai benar atau salah.',
            'is_active.boolean' => 'Status aktif harus bernilai benar atau salah.',
            'send_invitation.boolean' => 'Pilihan kirim undangan harus bernilai benar atau salah.',
        ];
    }
}

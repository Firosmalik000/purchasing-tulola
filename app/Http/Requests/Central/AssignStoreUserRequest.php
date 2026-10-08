<?php

namespace App\Http\Requests\Central;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssignStoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('store'));
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'user_id' => [
                'required',
                Rule::exists('users', 'id')->where(fn ($query) => $query
                    ->where('role', UserRole::STORE_PIC->value)
                    ->where('is_active', true)),
            ],
            'is_pic' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return ['user_id.exists' => 'Pengguna PIC toko aktif tidak ditemukan.'];
    }
}

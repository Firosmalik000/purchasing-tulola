<?php

namespace App\Http\Requests\Central;

use App\Models\Unit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can($this->route('unit') ? 'update' : 'create', $this->route('unit') ?? Unit::class);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('units')->ignore($this->route('unit'))],
            'symbol' => ['required', 'string', 'max:24', Rule::unique('units')->ignore($this->route('unit'))],
            'is_active' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama satuan wajib diisi.',
            'name.string' => 'Nama satuan harus berupa teks.',
            'name.max' => 'Nama satuan maksimal 255 karakter.',
            'name.unique' => 'Nama satuan sudah digunakan.',
            'symbol.required' => 'Simbol satuan wajib diisi.',
            'symbol.string' => 'Simbol satuan harus berupa teks.',
            'symbol.max' => 'Simbol satuan maksimal 24 karakter.',
            'symbol.unique' => 'Simbol satuan sudah digunakan.',
            'is_active.required' => 'Status aktif wajib dipilih.',
            'is_active.boolean' => 'Status aktif harus bernilai benar atau salah.',
        ];
    }
}

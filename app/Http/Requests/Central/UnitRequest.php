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
}

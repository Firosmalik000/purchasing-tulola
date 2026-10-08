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
}

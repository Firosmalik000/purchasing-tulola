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
            'is_active' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'cost_price.integer' => 'Harga modal wajib berupa bilangan bulat.',
            'min_stock.integer' => 'Stok minimum wajib berupa bilangan bulat.',
        ];
    }
}

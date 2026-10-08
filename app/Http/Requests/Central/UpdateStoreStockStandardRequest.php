<?php

namespace App\Http\Requests\Central;

use App\Models\StoreStockStandard;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStoreStockStandardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', StoreStockStandard::class);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'store_id' => ['required', Rule::exists('stores', 'id')->where('is_active', true)],
            'item_id' => ['required', Rule::exists('items', 'id')->where('is_active', true)],
            'standard_quantity' => ['required', 'numeric', 'min:0', 'decimal:0,3'],
        ];
    }
}

<?php

namespace App\Http\Requests\Central;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class FilterPurchasePlanningRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('manage-orders');
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return ['group_by' => ['nullable', Rule::in(['item', 'store', 'category'])], 'keyword' => ['nullable', 'string', 'max:100']];
    }
}

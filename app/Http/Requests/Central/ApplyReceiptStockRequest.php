<?php

namespace App\Http\Requests\Central;

use App\Models\Receipt;
use Illuminate\Foundation\Http\FormRequest;

class ApplyReceiptStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        $receipt = $this->route('receipt');

        return $receipt instanceof Receipt && $this->user()->can('applyStock', $receipt);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return ['notes' => ['nullable', 'string', 'max:2000']];
    }
}

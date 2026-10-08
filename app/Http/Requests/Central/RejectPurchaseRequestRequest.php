<?php

namespace App\Http\Requests\Central;

use App\Models\PurchaseRequest;
use Illuminate\Foundation\Http\FormRequest;

class RejectPurchaseRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        $purchaseRequest = $this->route('purchase_request');

        return $purchaseRequest instanceof PurchaseRequest
            && $this->user()->can('reject', $purchaseRequest);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return ['reason' => ['required', 'string', 'max:2000']];
    }

    public function messages(): array
    {
        return ['reason.required' => 'Alasan penolakan wajib diisi.'];
    }
}

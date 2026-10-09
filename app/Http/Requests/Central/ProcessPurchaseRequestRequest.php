<?php

namespace App\Http\Requests\Central;

use App\Models\PurchaseRequest;
use Illuminate\Foundation\Http\FormRequest;

class ProcessPurchaseRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        $purchaseRequest = $this->route('purchase_request');

        return $purchaseRequest instanceof PurchaseRequest
            && $this->user()->can('process', $purchaseRequest);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'integer', 'distinct'],
            'items.*.approved_quantity' => ['required', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Detail persetujuan item wajib diisi.',
            'items.*.approved_quantity.required' => 'Jumlah disetujui wajib diisi.',
            'items.*.approved_quantity.min' => 'Jumlah disetujui tidak boleh negatif.',
            'items.*.approved_quantity.integer' => 'Jumlah disetujui wajib berupa bilangan bulat.',
        ];
    }
}

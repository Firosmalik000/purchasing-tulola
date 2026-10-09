<?php

namespace App\Http\Requests\Store;

use App\Models\Receipt;
use App\Models\Store;
use Illuminate\Foundation\Http\FormRequest;

class ConfirmReceiptRequest extends FormRequest
{
    public function authorize(): bool
    {
        $store = Store::query()->find($this->integer('store_id'));

        return $store instanceof Store && $this->user()->can('create', [Receipt::class, $store]);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'store_id' => ['required', 'integer', 'exists:stores,id'],
            'received_at' => ['required', 'date', 'before_or_equal:'.now()->addMinutes(5)->toDateTimeString()],
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.allocation_id' => ['required', 'integer', 'distinct', 'exists:purchase_order_request_items,id'],
            'items.*.received_quantity' => ['required', 'integer', 'gt:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Isi minimal satu jumlah penerimaan.',
            'items.min' => 'Isi minimal satu jumlah penerimaan.',
            'items.*.received_quantity.gt' => 'Jumlah diterima wajib lebih dari 0.',
            'items.*.received_quantity.integer' => 'Jumlah diterima wajib berupa bilangan bulat.',
            'received_at.before_or_equal' => 'Waktu penerimaan tidak boleh di masa depan.',
        ];
    }
}

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
            'store_id.required' => 'Toko penerima wajib dipilih.',
            'store_id.exists' => 'Toko yang dipilih tidak ditemukan.',
            'received_at.required' => 'Waktu penerimaan wajib diisi.',
            'received_at.date' => 'Format waktu penerimaan tidak valid.',
            'received_at.before_or_equal' => 'Waktu penerimaan tidak boleh di masa depan.',
            'notes.string' => 'Catatan harus berupa teks.',
            'notes.max' => 'Catatan maksimal 2000 karakter.',
            'items.required' => 'Isi minimal satu jumlah penerimaan.',
            'items.min' => 'Isi minimal satu jumlah penerimaan.',
            'items.*.allocation_id.required' => 'Alokasi pesanan wajib ada.',
            'items.*.allocation_id.exists' => 'Alokasi pesanan tidak ditemukan.',
            'items.*.received_quantity.required' => 'Jumlah diterima wajib diisi.',
            'items.*.received_quantity.gt' => 'Jumlah diterima wajib lebih dari 0.',
            'items.*.received_quantity.integer' => 'Jumlah diterima wajib berupa bilangan bulat.',
        ];
    }
}

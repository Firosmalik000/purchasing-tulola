<?php

namespace App\Http\Requests\Store;

use App\Enums\UserRole;
use App\Models\PurchaseRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SavePurchaseRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        $purchaseRequest = $this->route('purchase_request');

        return $purchaseRequest instanceof PurchaseRequest
            ? $this->user()->can('update', $purchaseRequest)
            : $this->user()->role === UserRole::STORE_PIC;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'action' => ['nullable', 'string', 'in:draft,submit'],
            'submit_immediately' => ['nullable', 'boolean'],
            'store_id' => ['nullable', 'integer'],
            'required_date' => ['nullable', 'date', 'after_or_equal:today'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'stock_items' => ['nullable', 'array'],
            'stock_items.*.item_id' => ['required', 'integer', 'distinct', Rule::exists('items', 'id')->where('is_active', true)],
            'stock_items.*.requested_quantity' => ['required', 'integer', 'gt:0'],
            'special_items' => ['nullable', 'array'],
            'special_items.*.existing_item_id' => ['nullable', 'integer'],
            'special_items.*.name' => ['required', 'string', 'max:255'],
            'special_items.*.description' => ['nullable', 'string', 'max:2000'],
            'special_items.*.sample_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'special_items.*.unit_id' => ['required', Rule::exists('units', 'id')->where('is_active', true)],
            'special_items.*.requested_quantity' => ['required', 'integer', 'gt:0'],
            'special_items.*.required_date' => ['nullable', 'date', 'after_or_equal:today'],
            'special_items.*.reason' => ['required', 'string', 'max:2000'],
        ];
    }

    /** @return array<callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if (count((array) $this->input('stock_items', [])) === 0 && count((array) $this->input('special_items', [])) === 0) {
                $validator->errors()->add('items', 'Tambahkan minimal satu item stok atau permintaan khusus.');
            }

            if (! $this->route('purchase_request')) {
                if (! $this->filled('store_id')) {
                    $validator->errors()->add('store_id', 'Toko wajib dipilih.');

                    return;
                }
                $allowed = $this->user()->stores()->whereKey($this->integer('store_id'))->wherePivot('is_active', true)->where('stores.is_active', true)->exists();
                if (! $allowed) {
                    $validator->errors()->add('store_id', 'Toko tidak tersedia untuk akun Anda.');
                }
            }
        }];
    }

    public function messages(): array
    {
        return [
            'stock_items.*.item_id.required' => 'Item wajib dipilih.',
            'stock_items.*.requested_quantity.gt' => 'Jumlah permintaan wajib lebih dari 0.',
            'stock_items.*.requested_quantity.integer' => 'Jumlah permintaan wajib berupa bilangan bulat.',
            'special_items.*.name.required' => 'Nama permintaan khusus wajib diisi.',
            'special_items.*.sample_image.image' => 'Foto sampel harus berupa file gambar.',
            'special_items.*.sample_image.mimes' => 'Foto sampel harus berformat JPG, PNG, atau WebP.',
            'special_items.*.sample_image.max' => 'Ukuran foto sampel maksimal 5 MB.',
            'special_items.*.requested_quantity.gt' => 'Jumlah permintaan wajib lebih dari 0.',
            'special_items.*.requested_quantity.integer' => 'Jumlah permintaan wajib berupa bilangan bulat.',
            'special_items.*.reason.required' => 'Alasan permintaan khusus wajib diisi.',
        ];
    }
}

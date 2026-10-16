<?php

namespace App\Http\Requests\Central;

use App\Enums\PurchaseRequestItemType;
use App\Enums\PurchaseRequestStatus;
use App\Models\PurchaseRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FilterPurchaseRequestsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', PurchaseRequest::class);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'store_id' => ['nullable', 'integer', Rule::exists('stores', 'id')],
            'status' => ['nullable', Rule::enum(PurchaseRequestStatus::class)->except(PurchaseRequestStatus::DRAFT)],
            'type' => ['nullable', Rule::enum(PurchaseRequestItemType::class)],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'keyword' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'store_id.exists' => 'Toko yang dipilih tidak ditemukan.',
            'date_from.date' => 'Format tanggal awal tidak valid.',
            'date_to.date' => 'Format tanggal akhir tidak valid.',
            'date_to.after_or_equal' => 'Tanggal akhir harus sama dengan atau setelah tanggal awal.',
            'keyword.max' => 'Kata kunci pencarian maksimal 100 karakter.',
        ];
    }
}

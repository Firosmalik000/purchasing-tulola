<?php

namespace App\Http\Requests\Central;

use App\Enums\ManagementReportType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class ManagementReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('view-management-reports');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'report' => ['nullable', Rule::enum(ManagementReportType::class)],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'store_id' => ['nullable', 'integer', 'exists:stores,id'],
            'category_id' => ['nullable', 'integer', 'exists:item_categories,id'],
            'order_id' => ['nullable', 'integer', 'exists:purchase_orders,id'],
        ];
    }

    /** @return array{report: string, date_from: string, date_to: string, store_id: int|null, category_id: int|null, order_id: int|null} */
    public function filters(): array
    {
        $validated = $this->validated();

        return [
            'report' => (string) ($validated['report'] ?? ManagementReportType::PURCHASING_REQUEST->value),
            'date_from' => (string) ($validated['date_from'] ?? now()->startOfMonth()->toDateString()),
            'date_to' => (string) ($validated['date_to'] ?? now()->toDateString()),
            'store_id' => isset($validated['store_id']) ? (int) $validated['store_id'] : null,
            'category_id' => isset($validated['category_id']) ? (int) $validated['category_id'] : null,
            'order_id' => isset($validated['order_id']) ? (int) $validated['order_id'] : null,
        ];
    }
}

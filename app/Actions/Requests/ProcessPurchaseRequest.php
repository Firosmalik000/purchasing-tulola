<?php

namespace App\Actions\Requests;

use App\Actions\Orders\CreateDraftOrderForRequest;
use App\Enums\PurchaseRequestItemStatus;
use App\Enums\PurchaseRequestStatus;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProcessPurchaseRequest
{
    public function __construct(
        private TransitionPurchaseRequestStatus $transition,
        private CreateDraftOrderForRequest $createDraftOrder,
    ) {}

    /** @param array<int, array<string, mixed>> $approvals */
    public function handle(PurchaseRequest $purchaseRequest, User $actor, array $approvals, ?string $notes = null): PurchaseRequest
    {
        return DB::transaction(function () use ($purchaseRequest, $actor, $approvals, $notes): PurchaseRequest {
            $purchaseRequest = PurchaseRequest::query()->with('items')->lockForUpdate()->findOrFail($purchaseRequest->id);
            $lines = $purchaseRequest->items->keyBy('id');
            $approvalMap = $this->validateApprovals($lines, $approvals);

            foreach ($lines as $line) {
                $quantity = $approvalMap[$line->id];
                $line->update([
                    'approved_quantity' => $quantity,
                    'status' => (float) $quantity > 0 ? PurchaseRequestItemStatus::APPROVED : PurchaseRequestItemStatus::REJECTED,
                ]);
            }

            $this->transition->handle(
                $purchaseRequest,
                PurchaseRequestStatus::PROCESSED,
                $actor,
                $notes,
                ['processed_at' => now()],
                ['approved_quantities' => $approvalMap],
            );

            $this->createDraftOrder->handle($purchaseRequest, $actor);

            return $purchaseRequest->load(['items.item', 'items.unit', 'statusHistories']);
        }, 3);
    }

    /**
     * @param  Collection<int, PurchaseRequestItem>  $lines
     * @param  array<int, array<string, mixed>>  $approvals
     * @return array<int, string>
     */
    private function validateApprovals(Collection $lines, array $approvals): array
    {
        $approvalMap = collect($approvals)->mapWithKeys(fn (array $approval) => [(int) $approval['id'] => number_format((float) $approval['approved_quantity'], 3, '.', '')]);

        if ($approvalMap->keys()->sort()->values()->all() !== $lines->keys()->sort()->values()->all()) {
            throw ValidationException::withMessages(['items' => 'Seluruh item permintaan harus ditinjau tepat satu kali.']);
        }

        foreach ($lines as $line) {
            if ((float) $approvalMap[$line->id] < 0) {
                throw ValidationException::withMessages(["items.{$line->id}.approved_quantity" => 'Jumlah disetujui tidak boleh negatif.']);
            }

            if ((float) $approvalMap[$line->id] > (float) $line->requested_quantity) {
                throw ValidationException::withMessages(["items.{$line->id}.approved_quantity" => 'Jumlah disetujui tidak boleh melebihi jumlah yang diminta.']);
            }
        }

        if (! $approvalMap->contains(fn (string $quantity) => (float) $quantity > 0)) {
            throw ValidationException::withMessages(['items' => 'Setujui minimal satu item, atau tolak seluruh permintaan.']);
        }

        return $approvalMap->all();
    }
}

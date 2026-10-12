<?php

namespace App\Actions\Requests;

use App\Actions\Orders\CreateDraftOrderForRequest;
use App\Enums\PurchaseRequestItemStatus;
use App\Enums\PurchaseRequestItemType;
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

            if ($purchaseRequest->status !== PurchaseRequestStatus::SUBMITTED) {
                throw ValidationException::withMessages([
                    'status' => 'Hanya permintaan berstatus Diajukan yang dapat ditinjau.',
                ]);
            }

            $lines = $purchaseRequest->items->keyBy('id');
            $approvalMap = $this->validateApprovals($lines, $approvals);
            $approvalsKeyed = collect($approvals)->keyBy('id');

            foreach ($lines as $line) {
                $quantity = $approvalMap[$line->id];
                $itemApproval = $approvalsKeyed->get($line->id) ?? [];
                $decision = $itemApproval['decision'] ?? null;
                $bankQty = (int) ($itemApproval['bank_quantity'] ?? 0);

                if ($line->type === PurchaseRequestItemType::SPECIAL) {
                    if ($decision === PurchaseRequestItemStatus::BANK_PERMINTAAN->value && $bankQty === 0) {
                        $bankQty = $quantity > 0 ? $quantity : $line->requested_quantity;
                        $quantity = 0;
                    }

                    if ($quantity > 0 && $bankQty > 0) {
                        $status = PurchaseRequestItemStatus::PARTIALLY_APPROVED;
                    } elseif ($quantity > 0) {
                        $status = PurchaseRequestItemStatus::APPROVED;
                    } elseif ($bankQty > 0) {
                        $status = PurchaseRequestItemStatus::BANK_PERMINTAAN;
                    } else {
                        $status = PurchaseRequestItemStatus::REJECTED;
                    }

                    $line->update([
                        'approved_quantity' => $quantity,
                        'bank_quantity' => $bankQty,
                        'status' => $status,
                    ]);
                } else {
                    $line->update([
                        'approved_quantity' => $quantity,
                        'bank_quantity' => 0,
                        'status' => $quantity > 0 ? PurchaseRequestItemStatus::APPROVED : PurchaseRequestItemStatus::REJECTED,
                    ]);
                }
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
     * @return array<int, int>
     */
    private function validateApprovals(Collection $lines, array $approvals): array
    {
        $approvalMap = collect($approvals)->mapWithKeys(fn (array $approval) => [(int) $approval['id'] => (int) $approval['approved_quantity']]);

        if ($approvalMap->keys()->sort()->values()->all() !== $lines->keys()->sort()->values()->all()) {
            throw ValidationException::withMessages(['items' => 'Seluruh item permintaan harus ditinjau tepat satu kali.']);
        }

        foreach ($lines as $line) {
            $itemApproval = collect($approvals)->firstWhere('id', $line->id) ?? [];
            $approvedQty = $approvalMap[$line->id];
            $bankQty = (int) ($itemApproval['bank_quantity'] ?? 0);

            if ($approvedQty < 0) {
                throw ValidationException::withMessages(["items.{$line->id}.approved_quantity" => 'Jumlah disetujui tidak boleh negatif.']);
            }

            if ($bankQty < 0) {
                throw ValidationException::withMessages(["items.{$line->id}.bank_quantity" => 'Jumlah bank permintaan tidak boleh negatif.']);
            }

            if (($approvedQty + $bankQty) > $line->requested_quantity) {
                throw ValidationException::withMessages(["items.{$line->id}.approved_quantity" => 'Total jumlah disetujui dan bank permintaan tidak boleh melebihi jumlah yang diminta.']);
            }
        }

        $hasApprovedOrBank = collect($approvals)->contains(function (array $item) {
            $approved = (int) ($item['approved_quantity'] ?? 0);
            $bank = (int) ($item['bank_quantity'] ?? 0);
            $decision = $item['decision'] ?? null;

            return $approved > 0 || $bank > 0 || $decision === PurchaseRequestItemStatus::BANK_PERMINTAAN->value;
        });

        if (! $hasApprovedOrBank) {
            throw ValidationException::withMessages(['items' => 'Setujui minimal satu item, atau tolak seluruh permintaan.']);
        }

        return $approvalMap->all();
    }
}

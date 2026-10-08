<?php

namespace App\Actions\Requests;

use App\Enums\PurchaseRequestStatus;
use App\Models\PurchaseRequest;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Validation\ValidationException;

class TransitionPurchaseRequestStatus
{
    public function __construct(private ActivityLogger $logger) {}

    /**
     * @param  array<string, mixed>  $attributes
     * @param  array<string, mixed>  $auditValues
     */
    public function handle(PurchaseRequest $request, PurchaseRequestStatus $next, User $actor, ?string $notes = null, array $attributes = [], array $auditValues = []): void
    {
        $previous = $request->status;

        if (! $previous->canTransitionTo($next)) {
            throw ValidationException::withMessages([
                'status' => "Status {$previous->label()} tidak dapat diubah menjadi {$next->label()}.",
            ]);
        }

        $request->update([...$attributes, 'status' => $next]);
        $request->statusHistories()->create([
            'from_status' => $previous,
            'to_status' => $next,
            'changed_by' => $actor->id,
            'notes' => $notes,
        ]);
        $this->logger->log($next->auditAction(), $request, ['status' => $previous->value], [
            'status' => $next->value,
            ...$auditValues,
        ]);
    }
}

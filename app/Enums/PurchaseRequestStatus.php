<?php

namespace App\Enums;

enum PurchaseRequestStatus: string
{
    case DRAFT = 'DRAFT';
    case SUBMITTED = 'SUBMITTED';
    case PROCESSED = 'PROCESSED';
    case REJECTED = 'REJECTED';
    case CANCELLED = 'CANCELLED';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft', self::SUBMITTED => 'Diajukan', self::PROCESSED => 'Disetujui',
            self::REJECTED => 'Ditolak', self::CANCELLED => 'Dibatalkan',
        };
    }

    public function canTransitionTo(self $next): bool
    {
        return in_array($next, match ($this) {
            self::DRAFT => [self::SUBMITTED, self::CANCELLED],
            self::SUBMITTED => [self::PROCESSED, self::REJECTED, self::CANCELLED],
            self::PROCESSED, self::REJECTED, self::CANCELLED => [],
        }, true);
    }

    public function auditAction(): string
    {
        return 'purchase_request.'.strtolower($this->value);
    }
}

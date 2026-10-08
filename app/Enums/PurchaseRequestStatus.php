<?php

namespace App\Enums;

enum PurchaseRequestStatus: string
{
    case DRAFT = 'DRAFT';
    case SUBMITTED = 'SUBMITTED';
    case PROCESSED = 'PROCESSED';
    case ORDERED = 'ORDERED';
    case COMPLETED = 'COMPLETED';
    case REJECTED = 'REJECTED';
    case CANCELLED = 'CANCELLED';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft', self::SUBMITTED => 'Diajukan', self::PROCESSED => 'Diproses',
            self::ORDERED => 'Dipesan', self::COMPLETED => 'Selesai', self::REJECTED => 'Ditolak', self::CANCELLED => 'Dibatalkan',
        };
    }

    public function canTransitionTo(self $next): bool
    {
        return in_array($next, match ($this) {
            self::DRAFT => [self::SUBMITTED, self::CANCELLED],
            self::SUBMITTED => [self::PROCESSED, self::REJECTED, self::CANCELLED],
            self::PROCESSED => [self::ORDERED, self::REJECTED, self::CANCELLED],
            self::ORDERED => [self::COMPLETED, self::CANCELLED],
            self::COMPLETED, self::REJECTED, self::CANCELLED => [],
        }, true);
    }

    public function auditAction(): string
    {
        return 'purchase_request.'.strtolower($this->value);
    }
}

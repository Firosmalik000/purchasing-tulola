<?php

namespace App\Enums;

enum PurchaseOrderStatus: string
{
    case DRAFT = 'DRAFT';
    case ORDERED = 'ORDERED';
    case PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED';
    case COMPLETED = 'COMPLETED';
    case CANCELLED = 'CANCELLED';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Proses',
            self::ORDERED => 'Menunggu Diterima',
            self::PARTIALLY_RECEIVED => 'Diterima Sebagian',
            self::COMPLETED => 'Selesai',
            self::CANCELLED => 'Dibatalkan',
        };
    }

    public function canTransitionTo(self $next): bool
    {
        return in_array($next, match ($this) {
            self::DRAFT => [self::ORDERED, self::CANCELLED],
            self::ORDERED => [self::PARTIALLY_RECEIVED, self::COMPLETED, self::CANCELLED],
            self::PARTIALLY_RECEIVED => [self::COMPLETED, self::CANCELLED],
            self::COMPLETED, self::CANCELLED => [],
        }, true);
    }
}

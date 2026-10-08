<?php

namespace App\Enums;

enum PurchaseOrderStatus: string
{
    case DRAFT = 'DRAFT';
    case ORDERED = 'ORDERED';
    case WAITING_RECEIPT = 'WAITING_RECEIPT';
    case PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED';
    case RECEIVED = 'RECEIVED';
    case COMPLETED = 'COMPLETED';
    case CANCELLED = 'CANCELLED';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft',
            self::ORDERED => 'Dipesan',
            self::WAITING_RECEIPT => 'Menunggu Diterima',
            self::PARTIALLY_RECEIVED => 'Diterima Sebagian',
            self::RECEIVED => 'Diterima',
            self::COMPLETED => 'Selesai',
            self::CANCELLED => 'Dibatalkan',
        };
    }

    public function canTransitionTo(self $next): bool
    {
        return in_array($next, match ($this) {
            self::DRAFT => [self::ORDERED, self::CANCELLED],
            self::ORDERED => [self::WAITING_RECEIPT, self::CANCELLED],
            self::WAITING_RECEIPT => [self::PARTIALLY_RECEIVED, self::RECEIVED, self::CANCELLED],
            self::PARTIALLY_RECEIVED => [self::RECEIVED, self::CANCELLED],
            self::RECEIVED => [self::COMPLETED],
            self::COMPLETED, self::CANCELLED => [],
        }, true);
    }
}

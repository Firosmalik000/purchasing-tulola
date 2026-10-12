<?php

namespace App\Enums;

enum PurchaseRequestItemStatus: string
{
    case APPROVED = 'APPROVED';
    case REJECTED = 'REJECTED';
    case BANK_PERMINTAAN = 'BANK_PERMINTAAN';
    case PARTIALLY_APPROVED = 'PARTIALLY_APPROVED';

    public function label(): string
    {
        return match ($this) {
            self::APPROVED => 'Disetujui',
            self::REJECTED => 'Ditolak',
            self::BANK_PERMINTAAN => 'Bank Permintaan',
            self::PARTIALLY_APPROVED => 'Disetujui Sebagian & Bank Permintaan',
        };
    }
}

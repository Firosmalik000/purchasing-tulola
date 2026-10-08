<?php

namespace App\Enums;

enum ReceiptStatus: string
{
    case CONFIRMED = 'CONFIRMED';

    public function label(): string
    {
        return match ($this) {
            self::CONFIRMED => 'Dikonfirmasi',
        };
    }
}

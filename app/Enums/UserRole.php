<?php

namespace App\Enums;

enum UserRole: string
{
    case SUPER_ADMIN = 'SUPER_ADMIN';
    case CENTRAL_ADMIN = 'CENTRAL_ADMIN';
    case PURCHASING = 'PURCHASING';
    case MANAGEMENT = 'MANAGEMENT';
    case STORE_PIC = 'STORE_PIC';

    public function label(): string
    {
        return match ($this) {
            self::SUPER_ADMIN => 'Super Admin',
            self::CENTRAL_ADMIN => 'Admin Pusat',
            self::PURCHASING => 'Purchasing',
            self::MANAGEMENT => 'Manajemen',
            self::STORE_PIC => 'PIC Toko',
        };
    }

    public function isCentral(): bool
    {
        return $this !== self::STORE_PIC;
    }
}

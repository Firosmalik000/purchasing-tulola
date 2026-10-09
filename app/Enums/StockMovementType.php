<?php

namespace App\Enums;

enum StockMovementType: string
{
    case STOCK_IN = 'STOCK_IN';
    case MANUAL_UPDATE = 'MANUAL_UPDATE';
    case ORDER_RECEIVED = 'ORDER_RECEIVED';
    case DISTRIBUTION_OUT = 'DISTRIBUTION_OUT';
    case DISTRIBUTION_CANCELLED = 'DISTRIBUTION_CANCELLED';
    case OPENING_BALANCE = 'OPENING_BALANCE';
    case CORRECTION = 'CORRECTION';
    case OTHER = 'OTHER';

    public function label(): string
    {
        return match ($this) {
            self::STOCK_IN => 'Tambah Stok',
            self::MANUAL_UPDATE => 'Pembaruan Manual',
            self::ORDER_RECEIVED => 'Penerimaan Pesanan',
            self::DISTRIBUTION_OUT => 'Distribusi ke Cabang',
            self::DISTRIBUTION_CANCELLED => 'Pembatalan Distribusi',
            self::OPENING_BALANCE => 'Saldo Awal',
            self::CORRECTION => 'Koreksi',
            self::OTHER => 'Lainnya',
        };
    }
}

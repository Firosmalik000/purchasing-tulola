<?php

namespace App\Enums;

enum StockMovementType: string
{
    case STOCK_IN = 'STOCK_IN';
    case MANUAL_UPDATE = 'MANUAL_UPDATE';
    case ORDER_RECEIVED = 'ORDER_RECEIVED';
    case OPENING_BALANCE = 'OPENING_BALANCE';
    case CORRECTION = 'CORRECTION';
    case OTHER = 'OTHER';

    public function label(): string
    {
        return match ($this) {
            self::STOCK_IN => 'Tambah Stok',
            self::MANUAL_UPDATE => 'Pembaruan Manual',
            self::ORDER_RECEIVED => 'Penerimaan Pesanan',
            self::OPENING_BALANCE => 'Saldo Awal',
            self::CORRECTION => 'Koreksi',
            self::OTHER => 'Lainnya',
        };
    }
}

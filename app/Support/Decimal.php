<?php

namespace App\Support;

final class Decimal
{
    public static function quantityMills(string $quantity): int
    {
        return self::scaledInteger($quantity, 3);
    }

    public static function quantity(int $mills): string
    {
        return sprintf('%d.%03d', intdiv($mills, 1000), abs($mills % 1000));
    }

    public static function moneyTotal(string $quantity, string $unitPrice): string
    {
        $quantityMills = self::quantityMills($quantity);
        $priceCents = self::scaledInteger($unitPrice, 2);
        $totalCents = intdiv(($quantityMills * $priceCents) + 500, 1000);

        return sprintf('%d.%02d', intdiv($totalCents, 100), $totalCents % 100);
    }

    private static function scaledInteger(string $value, int $scale): int
    {
        [$whole, $fraction] = array_pad(explode('.', $value, 2), 2, '');
        $fraction = substr(str_pad($fraction, $scale, '0'), 0, $scale);

        return ((int) $whole * (10 ** $scale)) + (int) $fraction;
    }
}

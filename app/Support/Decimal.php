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
        $prefix = $mills < 0 ? '-' : '';
        $absolute = abs($mills);

        return $prefix.sprintf('%d.%03d', intdiv($absolute, 1000), $absolute % 1000);
    }

    public static function moneyTotal(string $quantity, string $unitPrice): string
    {
        $quantityMills = self::quantityMills($quantity);
        $priceCents = self::moneyCents($unitPrice);
        $scaledTotal = $quantityMills * $priceCents;
        $totalCents = intdiv($scaledTotal + ($scaledTotal >= 0 ? 500 : -500), 1000);

        return self::money($totalCents);
    }

    public static function moneyCents(string $value): int
    {
        return self::scaledInteger($value, 2);
    }

    public static function money(int $cents): string
    {
        $prefix = $cents < 0 ? '-' : '';
        $absolute = abs($cents);

        return $prefix.sprintf('%d.%02d', intdiv($absolute, 100), $absolute % 100);
    }

    private static function scaledInteger(string $value, int $scale): int
    {
        $value = trim($value);
        $negative = str_starts_with($value, '-');
        $unsigned = ltrim($value, '+-');
        [$whole, $fraction] = array_pad(explode('.', $unsigned, 2), 2, '');
        $fraction = substr(str_pad($fraction, $scale, '0'), 0, $scale);
        $scaled = ((int) $whole * (10 ** $scale)) + (int) $fraction;

        return $negative ? -$scaled : $scaled;
    }
}

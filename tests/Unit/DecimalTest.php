<?php

namespace Tests\Unit;

use App\Support\Decimal;
use PHPUnit\Framework\TestCase;

class DecimalTest extends TestCase
{
    public function test_negative_fractional_values_preserve_their_sign(): void
    {
        $this->assertSame(-500, Decimal::quantityMills('-0.500'));
        $this->assertSame('-0.500', Decimal::quantity(-500));
        $this->assertSame(-125, Decimal::moneyCents('-1.25'));
        $this->assertSame('-1.25', Decimal::money(-125));
        $this->assertSame('-50.00', Decimal::moneyTotal('-0.500', '100.00'));
    }
}

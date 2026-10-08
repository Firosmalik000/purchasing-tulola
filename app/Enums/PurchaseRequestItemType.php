<?php

namespace App\Enums;

enum PurchaseRequestItemType: string
{
    case STOCK = 'STOCK';
    case SPECIAL = 'SPECIAL';
}

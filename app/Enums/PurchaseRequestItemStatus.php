<?php

namespace App\Enums;

enum PurchaseRequestItemStatus: string
{
    case APPROVED = 'APPROVED';
    case REJECTED = 'REJECTED';
}

<?php

namespace Database\Factories;

use App\Enums\PurchaseOrderStatus;
use App\Models\PurchaseOrder;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<PurchaseOrder> */
class PurchaseOrderFactory extends Factory
{
    public function definition(): array
    {
        return [
            'number' => 'ORD/'.fake()->unique()->bothify('#####'),
            'order_date' => now()->toDateString(),
            'status' => PurchaseOrderStatus::DRAFT,
            'created_by' => User::factory()->centralAdmin(),
        ];
    }
}

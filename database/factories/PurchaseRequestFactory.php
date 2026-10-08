<?php

namespace Database\Factories;

use App\Enums\PurchaseRequestStatus;
use App\Models\PurchaseRequest;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<PurchaseRequest> */
class PurchaseRequestFactory extends Factory
{
    public function definition(): array
    {
        return [
            'number' => 'REQ/'.fake()->unique()->bothify('???-#####'),
            'store_id' => Store::factory(),
            'requested_by' => User::factory(),
            'required_date' => now()->addWeek()->toDateString(),
            'notes' => fake()->sentence(),
            'status' => PurchaseRequestStatus::DRAFT,
        ];
    }

    public function submitted(): static
    {
        return $this->state(fn () => [
            'status' => PurchaseRequestStatus::SUBMITTED,
            'submitted_at' => now(),
        ]);
    }
}

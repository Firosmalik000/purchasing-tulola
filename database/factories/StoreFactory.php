<?php

namespace Database\Factories;

use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Store> */
class StoreFactory extends Factory
{
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->bothify('STR-###'),
            'name' => fake()->company(),
            'address' => fake()->address(),
            'is_active' => true,
        ];
    }
}

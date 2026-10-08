<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        Unit::query()->upsert(array_map(fn (string $value): array => [
            'name' => ucfirst($value), 'symbol' => $value, 'is_active' => true,
        ], ['pcs', 'box', 'pack', 'roll', 'bottle', 'carton', 'set', 'unit']), ['symbol'], ['name', 'is_active']);
    }
}

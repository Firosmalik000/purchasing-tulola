<?php

namespace Database\Seeders;

use App\Models\Store;
use Illuminate\Database\Seeder;

class StarterStoreSeeder extends Seeder
{
    public function run(): void
    {
        Store::query()->upsert([
            ['code' => 'HO-JKT', 'name' => 'Head Office Jakarta', 'address' => 'Jakarta', 'is_active' => true],
            ['code' => 'PP', 'name' => 'Pacific Place', 'address' => 'Jakarta', 'is_active' => true],
        ], ['code'], ['name', 'address', 'is_active']);
    }
}

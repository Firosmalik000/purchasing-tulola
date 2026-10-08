<?php

namespace Database\Seeders;

use App\Models\ItemCategory;
use Illuminate\Database\Seeder;

class ItemCategorySeeder extends Seeder
{
    public function run(): void
    {
        ItemCategory::query()->upsert([
            ['name' => 'Konsumsi', 'code' => 'KON', 'is_active' => true],
            ['name' => 'Cleaning', 'code' => 'CLN', 'is_active' => true],
            ['name' => 'Obat-obatan', 'code' => 'OBT', 'is_active' => true],
            ['name' => 'ATK', 'code' => 'ATK', 'is_active' => true],
            ['name' => 'Packaging', 'code' => 'PKG', 'is_active' => true],
            ['name' => 'Other', 'code' => 'OTH', 'is_active' => true],
        ], ['name'], ['code', 'is_active']);
    }
}

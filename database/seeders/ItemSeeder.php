<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\Unit;
use Illuminate\Database\Seeder;

class ItemSeeder extends Seeder
{
    public function run(): void
    {
        $categories = ItemCategory::query()->pluck('id', 'code');
        $units = Unit::query()->pluck('id', 'symbol');
        $rows = [
            ['KON-AQUA-220', 'Aqua Cube 220 ml', 'KON', 'carton'], ['KON-AQUA-330', 'Aqua 330 ml', 'KON', 'carton'], ['KON-BISCOFF', 'Biscoff', 'KON', 'pack'],
            ['CLN-ALKOHOL-SWAB', 'Alkohol Swab', 'CLN', 'box'], ['CLN-TISSUE-BASAH', 'Tissue Basah', 'CLN', 'pack'], ['CLN-TISSUE-NICE', 'Tissue Nice Kotak', 'CLN', 'box'], ['CLN-MASKER-HITAM', 'Masker Hitam', 'CLN', 'box'], ['CLN-PENGHARUM', 'Pengharum Ruangan', 'CLN', 'bottle'], ['CLN-HIT', 'Hit', 'CLN', 'bottle'], ['CLN-TRASHBAG-4050', 'Trashbag 40x50', 'CLN', 'pack'], ['CLN-RINSO', 'Rinso Detergen', 'CLN', 'pack'], ['CLN-MUSCLE-LANTAI', 'Muscle Pembersih Lantai', 'CLN', 'bottle'], ['CLN-REFILL-SERAP', 'Refill Serap Air', 'CLN', 'pack'], ['CLN-SUNLIGHT', 'Sunlight', 'CLN', 'bottle'],
            ['OBT-TOLAK-ANGIN', 'Tolak Angin', 'OBT', 'box'], ['OBT-VITAMIN-C', 'Vitamin C', 'OBT', 'box'], ['OBT-KAYU-PUTIH', 'Kayu Putih', 'OBT', 'bottle'], ['OBT-FRESHCARE', 'Freshcare', 'OBT', 'bottle'], ['OBT-HANSAPLAST', 'Hansaplast', 'OBT', 'box'], ['OBT-BETADINE', 'Betadine', 'OBT', 'bottle'],
            ['ATK-THERMAL-ROLL', 'Thermal Paper Roll', 'ATK', 'roll'], ['ATK-BOLPOIN-HITAM', 'Bolpoin Hitam', 'ATK', 'pcs'], ['ATK-HVS-A4', 'Kertas HVS A4', 'ATK', 'pack'], ['ATK-POSTIT-7676', 'Post-it 76 x 76 mm', 'ATK', 'pack'], ['ATK-POSTIT-3850', 'Post-it 38 x 50 mm', 'ATK', 'pack'], ['ATK-GUNTING', 'Gunting', 'ATK', 'pcs'], ['ATK-DOUBLE-TAPE', 'Double Tape', 'ATK', 'roll'], ['ATK-BINDER-105', 'Binder Klip 105', 'ATK', 'box'], ['ATK-LAKBAN-BENING', 'Lakban Bening', 'ATK', 'roll'],
            ['PKG-BOX-SIGNATURE', 'Box Signature', 'PKG', 'pcs'], ['PKG-POUCH', 'Pouch', 'PKG', 'pcs'], ['PKG-PAPERBAG-M', 'Paperbag M', 'PKG', 'pcs'],
        ];

        Item::query()->upsert(array_map(fn (array $row): array => [
            'sku' => $row[0], 'name' => $row[1], 'item_category_id' => $categories[$row[2]], 'unit_id' => $units[$row[3]], 'is_active' => true,
        ], $rows), ['sku'], ['name', 'item_category_id', 'unit_id', 'is_active']);
    }
}

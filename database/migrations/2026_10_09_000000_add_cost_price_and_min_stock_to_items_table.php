<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->decimal('cost_price', 18, 2)->default(0)->after('unit_id');
            $table->decimal('min_stock', 14, 3)->default(0)->after('cost_price');
        });

        // Backfill initial cost_price from existing average_unit_cost if available
        DB::table('items')->orderBy('id')->chunkById(100, function ($items): void {
            foreach ($items as $item) {
                $lastCost = DB::table('store_stocks')
                    ->where('item_id', $item->id)
                    ->where('average_unit_cost', '>', 0)
                    ->latest('updated_at')
                    ->value('average_unit_cost');

                $defaultMin = DB::table('store_stock_standards')
                    ->where('item_id', $item->id)
                    ->where('standard_quantity', '>', 0)
                    ->latest('updated_at')
                    ->value('standard_quantity');

                $updates = [];
                if ($lastCost !== null) {
                    $updates['cost_price'] = $lastCost;
                }
                if ($defaultMin !== null) {
                    $updates['min_stock'] = $defaultMin;
                }

                if (! empty($updates)) {
                    DB::table('items')->where('id', $item->id)->update($updates);
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn(['cost_price', 'min_stock']);
        });
    }
};

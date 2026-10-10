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
            $table->unsignedBigInteger('target_stock')->default(0)->after('min_stock');
        });

        Schema::table('store_stock_standards', function (Blueprint $table) {
            $table->unsignedBigInteger('min_quantity')->nullable()->after('standard_quantity');
        });

        // Safe backfill: Set initial target_stock equal to min_stock for existing items where min_stock > 0
        DB::table('items')->where('min_stock', '>', 0)->update([
            'target_stock' => DB::raw('min_stock'),
        ]);
    }

    public function down(): void
    {
        Schema::table('store_stock_standards', function (Blueprint $table) {
            $table->dropColumn('min_quantity');
        });

        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn('target_stock');
        });
    }
};

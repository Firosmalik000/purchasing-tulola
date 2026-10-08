<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            $table->timestamp('stock_applied_at')->nullable()->after('status')->index();
            $table->foreignId('stock_applied_by')->nullable()->after('stock_applied_at')
                ->constrained('users')->nullOnDelete();
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->unique(
                ['reference_type', 'reference_id', 'store_id', 'item_id'],
                'stock_movement_reference_store_item_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropUnique('stock_movement_reference_store_item_unique');
        });

        Schema::table('receipts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('stock_applied_by');
            $table->dropColumn('stock_applied_at');
        });
    }
};

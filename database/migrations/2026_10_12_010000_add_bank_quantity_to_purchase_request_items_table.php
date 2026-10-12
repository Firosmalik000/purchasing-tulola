<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_request_items', function (Blueprint $table) {
            $table->unsignedInteger('bank_quantity')->default(0)->after('approved_quantity');
            $table->timestamp('bank_ordered_at')->nullable()->after('bank_quantity');
        });

        DB::table('purchase_request_items')
            ->where('status', 'BANK_PERMINTAAN')
            ->update([
                'bank_quantity' => DB::raw('COALESCE(approved_quantity, requested_quantity, 0)'),
            ]);
    }

    public function down(): void
    {
        Schema::table('purchase_request_items', function (Blueprint $table) {
            $table->dropColumn(['bank_quantity', 'bank_ordered_at']);
        });
    }
};

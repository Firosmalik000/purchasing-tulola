<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table): void {
            $table->unsignedBigInteger('min_stock')->nullable()->default(null)->change();
            $table->unsignedBigInteger('target_stock')->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        DB::table('items')->whereNull('min_stock')->update(['min_stock' => 0]);
        DB::table('items')->whereNull('target_stock')->update(['target_stock' => 0]);

        Schema::table('items', function (Blueprint $table): void {
            $table->unsignedBigInteger('min_stock')->nullable(false)->default(0)->change();
            $table->unsignedBigInteger('target_stock')->nullable(false)->default(0)->change();
        });
    }
};

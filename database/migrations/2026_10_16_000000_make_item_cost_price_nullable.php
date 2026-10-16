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
            $table->unsignedBigInteger('cost_price')->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        DB::table('items')->whereNull('cost_price')->update(['cost_price' => 0]);

        Schema::table('items', function (Blueprint $table): void {
            $table->unsignedBigInteger('cost_price')->nullable(false)->default(0)->change();
        });
    }
};

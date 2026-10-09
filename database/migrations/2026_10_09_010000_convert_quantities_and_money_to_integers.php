<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** @var array<string, list<string>> */
    private array $columns = [
        'items' => ['cost_price', 'min_stock'],
        'store_stocks' => ['quantity', 'average_unit_cost', 'total_value'],
        'store_stock_standards' => ['standard_quantity'],
        'stock_movements' => ['previous_quantity', 'new_quantity', 'quantity_difference', 'unit_cost', 'movement_value', 'previous_value', 'new_value'],
        'purchase_request_items' => ['current_stock_snapshot', 'standard_stock_snapshot', 'suggested_quantity', 'requested_quantity', 'approved_quantity'],
        'purchase_order_items' => ['quantity'],
        'purchase_order_request_items' => ['allocated_quantity'],
        'receipt_items' => ['ordered_quantity', 'received_quantity'],
    ];

    public function up(): void
    {
        $this->assertNoFractionalValues();

        Schema::table('items', function (Blueprint $table): void {
            $table->unsignedBigInteger('cost_price')->default(0)->change();
            $table->unsignedBigInteger('min_stock')->default(0)->change();
        });
        Schema::table('store_stocks', function (Blueprint $table): void {
            $table->unsignedBigInteger('quantity')->default(0)->change();
            $table->unsignedBigInteger('average_unit_cost')->default(0)->change();
            $table->unsignedBigInteger('total_value')->default(0)->change();
        });
        Schema::table('store_stock_standards', fn (Blueprint $table) => $table->unsignedBigInteger('standard_quantity')->default(0)->change());
        Schema::table('stock_movements', function (Blueprint $table): void {
            $table->unsignedBigInteger('previous_quantity')->change();
            $table->unsignedBigInteger('new_quantity')->change();
            $table->bigInteger('quantity_difference')->change();
            $table->unsignedBigInteger('unit_cost')->nullable()->change();
            $table->bigInteger('movement_value')->nullable()->change();
            $table->unsignedBigInteger('previous_value')->default(0)->change();
            $table->unsignedBigInteger('new_value')->default(0)->change();
        });
        Schema::table('purchase_request_items', function (Blueprint $table): void {
            $table->unsignedBigInteger('current_stock_snapshot')->nullable()->change();
            $table->unsignedBigInteger('standard_stock_snapshot')->nullable()->change();
            $table->unsignedBigInteger('suggested_quantity')->nullable()->change();
            $table->unsignedBigInteger('requested_quantity')->change();
            $table->unsignedBigInteger('approved_quantity')->nullable()->change();
        });
        Schema::table('purchase_order_items', fn (Blueprint $table) => $table->unsignedBigInteger('quantity')->change());
        Schema::table('purchase_order_request_items', fn (Blueprint $table) => $table->unsignedBigInteger('allocated_quantity')->change());
        Schema::table('receipt_items', function (Blueprint $table): void {
            $table->unsignedBigInteger('ordered_quantity')->change();
            $table->unsignedBigInteger('received_quantity')->change();
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table): void {
            $table->decimal('cost_price', 18, 2)->default(0)->change();
            $table->decimal('min_stock', 14, 3)->default(0)->change();
        });
        Schema::table('store_stocks', function (Blueprint $table): void {
            $table->decimal('quantity', 14, 3)->default(0)->change();
            $table->decimal('average_unit_cost', 18, 2)->default(0)->change();
            $table->decimal('total_value', 20, 2)->default(0)->change();
        });
        Schema::table('store_stock_standards', fn (Blueprint $table) => $table->decimal('standard_quantity', 14, 3)->default(0)->change());
        Schema::table('stock_movements', function (Blueprint $table): void {
            $table->decimal('previous_quantity', 14, 3)->change();
            $table->decimal('new_quantity', 14, 3)->change();
            $table->decimal('quantity_difference', 14, 3)->change();
            $table->decimal('unit_cost', 18, 2)->nullable()->change();
            $table->decimal('movement_value', 20, 2)->nullable()->change();
            $table->decimal('previous_value', 20, 2)->default(0)->change();
            $table->decimal('new_value', 20, 2)->default(0)->change();
        });
        Schema::table('purchase_request_items', function (Blueprint $table): void {
            $table->decimal('current_stock_snapshot', 14, 3)->nullable()->change();
            $table->decimal('standard_stock_snapshot', 14, 3)->nullable()->change();
            $table->decimal('suggested_quantity', 14, 3)->nullable()->change();
            $table->decimal('requested_quantity', 14, 3)->change();
            $table->decimal('approved_quantity', 14, 3)->nullable()->change();
        });
        Schema::table('purchase_order_items', fn (Blueprint $table) => $table->decimal('quantity', 14, 3)->change());
        Schema::table('purchase_order_request_items', fn (Blueprint $table) => $table->decimal('allocated_quantity', 14, 3)->change());
        Schema::table('receipt_items', function (Blueprint $table): void {
            $table->decimal('ordered_quantity', 14, 3)->change();
            $table->decimal('received_quantity', 14, 3)->change();
        });
    }

    private function assertNoFractionalValues(): void
    {
        foreach ($this->columns as $table => $columns) {
            foreach ($columns as $column) {
                $hasFraction = DB::table($table)
                    ->whereNotNull($column)
                    ->whereRaw("{$column} <> ROUND({$column}, 0)")
                    ->exists();

                if ($hasFraction) {
                    throw new RuntimeException("Tidak dapat mengubah {$table}.{$column} ke integer karena masih terdapat nilai pecahan.");
                }
            }
        }
    }
};

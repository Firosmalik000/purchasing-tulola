<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('purchase_orders')->where('status', 'WAITING_RECEIPT')->update(['status' => 'ORDERED']);
        DB::table('purchase_orders')->where('status', 'RECEIVED')->update(['status' => 'COMPLETED']);

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->foreignId('purchase_request_id')->nullable()->after('number')
                ->constrained()->restrictOnDelete();
        });

        DB::table('purchase_orders')->orderBy('id')->chunkById(100, function ($orders): void {
            foreach ($orders as $order) {
                $requestIds = DB::table('purchase_order_request_items')
                    ->join('purchase_order_items', 'purchase_order_items.id', '=', 'purchase_order_request_items.purchase_order_item_id')
                    ->join('purchase_request_items', 'purchase_request_items.id', '=', 'purchase_order_request_items.purchase_request_item_id')
                    ->where('purchase_order_items.purchase_order_id', $order->id)
                    ->distinct()->pluck('purchase_request_items.purchase_request_id');

                if ($requestIds->count() === 1) {
                    $requestId = $requestIds->first();
                    $orderCount = DB::table('purchase_order_request_items')
                        ->join('purchase_order_items', 'purchase_order_items.id', '=', 'purchase_order_request_items.purchase_order_item_id')
                        ->join('purchase_request_items', 'purchase_request_items.id', '=', 'purchase_order_request_items.purchase_request_item_id')
                        ->where('purchase_request_items.purchase_request_id', $requestId)
                        ->distinct()->count('purchase_order_items.purchase_order_id');

                    if ($orderCount !== 1) {
                        continue;
                    }

                    DB::table('purchase_orders')->where('id', $order->id)
                        ->update(['purchase_request_id' => $requestId]);
                }
            }
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->unique('purchase_request_id');
        });

        Schema::table('store_stocks', function (Blueprint $table) {
            $table->decimal('average_unit_cost', 18, 2)->default(0)->after('quantity');
            $table->decimal('total_value', 20, 2)->default(0)->after('average_unit_cost');
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('supplier_id')->nullable()->after('item_id')->constrained()->nullOnDelete();
            $table->decimal('unit_cost', 18, 2)->nullable()->after('quantity_difference');
            $table->decimal('movement_value', 20, 2)->nullable()->after('unit_cost');
            $table->decimal('previous_value', 20, 2)->default(0)->after('movement_value');
            $table->decimal('new_value', 20, 2)->default(0)->after('previous_value');
        });

        DB::table('store_stocks')->orderBy('id')->chunkById(100, function ($stocks): void {
            foreach ($stocks as $stock) {
                $lastCost = DB::table('purchase_order_items')
                    ->join('purchase_order_request_items', 'purchase_order_request_items.purchase_order_item_id', '=', 'purchase_order_items.id')
                    ->join('purchase_request_items', 'purchase_request_items.id', '=', 'purchase_order_request_items.purchase_request_item_id')
                    ->join('purchase_requests', 'purchase_requests.id', '=', 'purchase_request_items.purchase_request_id')
                    ->where('purchase_order_items.item_id', $stock->item_id)
                    ->where('purchase_requests.store_id', $stock->store_id)
                    ->where('purchase_order_items.unit_price', '>', 0)
                    ->latest('purchase_order_items.id')
                    ->value('purchase_order_items.unit_price');

                if ($lastCost === null) {
                    continue;
                }

                $averageCost = number_format((float) $lastCost, 2, '.', '');
                $totalValue = number_format((float) $stock->quantity * (float) $lastCost, 2, '.', '');
                DB::table('store_stocks')->where('id', $stock->id)->update([
                    'average_unit_cost' => $averageCost,
                    'total_value' => $totalValue,
                ]);
            }
        });

        DB::table('stock_movements')->orderBy('id')->chunkById(100, function ($movements): void {
            foreach ($movements as $movement) {
                $stock = DB::table('store_stocks')
                    ->where('store_id', $movement->store_id)
                    ->where('item_id', $movement->item_id)
                    ->first(['average_unit_cost']);

                if ($stock === null || (float) $stock->average_unit_cost <= 0) {
                    continue;
                }

                $cost = (float) $stock->average_unit_cost;
                DB::table('stock_movements')->where('id', $movement->id)->update([
                    'unit_cost' => number_format($cost, 2, '.', ''),
                    'movement_value' => number_format((float) $movement->quantity_difference * $cost, 2, '.', ''),
                    'previous_value' => number_format((float) $movement->previous_quantity * $cost, 2, '.', ''),
                    'new_value' => number_format((float) $movement->new_quantity * $cost, 2, '.', ''),
                ]);
            }
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->dropIndex(['supplier_id', 'status', 'order_date']);
            $table->dropColumn(['supplier_id', 'payment_method', 'payment_term']);
        });

        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->dropColumn(['unit_price', 'total']);
        });

        Schema::table('purchase_request_items', function (Blueprint $table) {
            $table->dropColumn('estimated_price');
        });

        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn('payment_term');
        });
    }

    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->string('payment_term')->nullable();
        });
        Schema::table('purchase_request_items', function (Blueprint $table) {
            $table->decimal('estimated_price', 18, 2)->nullable();
        });
        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->decimal('unit_price', 18, 2)->default(0);
            $table->decimal('total', 20, 2)->default(0);
        });
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->foreignId('supplier_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('payment_method')->nullable();
            $table->string('payment_term')->nullable();
            $table->index(['supplier_id', 'status', 'order_date']);
        });
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->dropColumn(['supplier_id', 'unit_cost', 'movement_value', 'previous_value', 'new_value']);
        });
        Schema::table('store_stocks', function (Blueprint $table) {
            $table->dropColumn(['average_unit_cost', 'total_value']);
        });
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropUnique(['purchase_request_id']);
            $table->dropForeign(['purchase_request_id']);
            $table->dropColumn('purchase_request_id');
        });
    }
};

<?php

use App\Models\StockBatch;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_number', 64)->unique();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->string('movement_type', 32)->index();
            $table->string('reason');
            $table->text('notes')->nullable();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('item_count')->default(1);
            $table->bigInteger('total_quantity')->default(0);
            $table->timestamps();
        });

        // Backfill existing unreferenced stock movements into batches
        $unreferenced = DB::table('stock_movements')
            ->whereNull('reference_type')
            ->orderBy('id')
            ->get();

        if ($unreferenced->isNotEmpty()) {
            // Group by store, movement_type, reason, created_by, and created_at timestamp
            $grouped = $unreferenced->groupBy(function ($row) {
                $time = Carbon::parse($row->created_at)->format('Y-m-d H:i:s');

                return "{$row->store_id}_{$row->movement_type}_{$row->reason}_{$row->created_by}_{$time}";
            });

            $seq = 1;
            foreach ($grouped as $rows) {
                $first = $rows->first();
                $dateStr = Carbon::parse($first->created_at)->format('Ymd');
                $batchNumber = sprintf('STK-%s-%04d', $dateStr, $seq++);
                $totalQty = $rows->sum('quantity_difference');

                $batchId = DB::table('stock_batches')->insertGetId([
                    'batch_number' => $batchNumber,
                    'store_id' => $first->store_id,
                    'movement_type' => $first->movement_type,
                    'reason' => $first->reason,
                    'notes' => $first->notes,
                    'supplier_id' => $first->supplier_id,
                    'created_by' => $first->created_by,
                    'item_count' => $rows->count(),
                    'total_quantity' => $totalQty,
                    'created_at' => $first->created_at,
                    'updated_at' => $first->created_at,
                ]);

                DB::table('stock_movements')
                    ->whereIn('id', $rows->pluck('id'))
                    ->update([
                        'reference_type' => StockBatch::class,
                        'reference_id' => $batchId,
                    ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('stock_movements')
            ->where('reference_type', StockBatch::class)
            ->update([
                'reference_type' => null,
                'reference_id' => null,
            ]);

        Schema::dropIfExists('stock_batches');
    }
};

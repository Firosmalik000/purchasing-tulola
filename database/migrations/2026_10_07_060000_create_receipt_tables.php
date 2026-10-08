<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('receipt_sequences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->restrictOnDelete();
            $table->string('period', 7);
            $table->unsignedInteger('last_number')->default(0);
            $table->timestamps();
            $table->unique(['store_id', 'period']);
        });

        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->string('number', 56)->unique();
            $table->foreignId('purchase_order_id')->constrained()->restrictOnDelete();
            $table->foreignId('store_id')->constrained()->restrictOnDelete();
            $table->foreignId('received_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('received_at');
            $table->text('notes')->nullable();
            $table->string('status', 24)->index();
            $table->timestamps();
            $table->index(['store_id', 'status', 'received_at']);
            $table->index(['purchase_order_id', 'store_id', 'received_at'], 'receipt_order_store_date_index');
        });

        Schema::create('receipt_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('receipt_id')->constrained()->cascadeOnDelete();
            $table->foreignId('purchase_order_item_id')->constrained()->restrictOnDelete();
            $table->foreignId('purchase_request_item_id')->nullable()->constrained()->restrictOnDelete();
            $table->decimal('ordered_quantity', 14, 3);
            $table->decimal('received_quantity', 14, 3);
            $table->timestamps();
            $table->unique(['receipt_id', 'purchase_order_item_id', 'purchase_request_item_id'], 'receipt_allocation_unique');
            $table->index(['purchase_order_item_id', 'purchase_request_item_id'], 'receipt_item_allocation_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipt_items');
        Schema::dropIfExists('receipts');
        Schema::dropIfExists('receipt_sequences');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_order_sequences', function (Blueprint $table) {
            $table->id();
            $table->string('period', 7)->unique();
            $table->unsignedInteger('last_number')->default(0);
            $table->timestamps();
        });

        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('number', 48)->unique();
            $table->foreignId('supplier_id')->nullable()->constrained()->restrictOnDelete();
            $table->date('order_date');
            $table->date('expected_date')->nullable();
            $table->string('payment_method')->nullable();
            $table->string('payment_term')->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 24)->index();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['supplier_id', 'status', 'order_date']);
            $table->index(['created_by', 'created_at']);
        });

        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained()->cascadeOnDelete();
            $table->string('item_type', 16)->index();
            $table->foreignId('item_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('name')->nullable();
            $table->foreignId('unit_id')->constrained()->restrictOnDelete();
            $table->decimal('quantity', 14, 3);
            $table->decimal('unit_price', 18, 2)->default(0);
            $table->decimal('total', 20, 2)->default(0);
            $table->timestamps();
            $table->index(['item_id', 'created_at']);
        });

        Schema::create('purchase_order_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('purchase_request_item_id')->constrained()->restrictOnDelete();
            $table->decimal('allocated_quantity', 14, 3);
            $table->timestamps();
            $table->unique(['purchase_order_item_id', 'purchase_request_item_id'], 'po_request_item_unique');
            $table->index(['purchase_request_item_id', 'created_at'], 'request_item_allocation_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_order_request_items');
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('purchase_order_sequences');
    }
};

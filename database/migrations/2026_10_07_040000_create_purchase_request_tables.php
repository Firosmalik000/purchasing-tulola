<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_request_sequences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->restrictOnDelete();
            $table->string('period', 7);
            $table->unsignedInteger('last_number')->default(0);
            $table->timestamps();
            $table->unique(['store_id', 'period']);
        });

        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->id();
            $table->string('number', 48)->unique();
            $table->foreignId('store_id')->constrained()->restrictOnDelete();
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->date('required_date')->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 24)->index();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('ordered_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['store_id', 'status', 'created_at']);
            $table->index(['requested_by', 'created_at']);
        });

        Schema::create('purchase_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_request_id')->constrained()->cascadeOnDelete();
            $table->string('type', 16)->index();
            $table->foreignId('item_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('name')->nullable();
            $table->text('description')->nullable();
            $table->foreignId('unit_id')->constrained()->restrictOnDelete();
            $table->decimal('current_stock_snapshot', 14, 3)->nullable();
            $table->decimal('standard_stock_snapshot', 14, 3)->nullable();
            $table->decimal('suggested_quantity', 14, 3)->nullable();
            $table->decimal('requested_quantity', 14, 3);
            $table->decimal('approved_quantity', 14, 3)->nullable();
            $table->decimal('estimated_price', 18, 2)->nullable();
            $table->date('required_date')->nullable();
            $table->text('reason')->nullable();
            $table->string('status', 24)->nullable();
            $table->timestamps();
            $table->index(['purchase_request_id', 'type']);
            $table->index(['item_id', 'created_at']);
        });

        Schema::create('purchase_request_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_request_id')->constrained()->cascadeOnDelete();
            $table->string('from_status', 24)->nullable();
            $table->string('to_status', 24);
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['purchase_request_id', 'created_at'], 'pr_status_hist_pr_id_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_request_status_histories');
        Schema::dropIfExists('purchase_request_items');
        Schema::dropIfExists('purchase_requests');
        Schema::dropIfExists('purchase_request_sequences');
    }
};

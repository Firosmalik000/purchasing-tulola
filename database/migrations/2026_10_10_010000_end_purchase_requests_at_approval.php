<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function (): void {
            DB::table('purchase_requests')
                ->whereIn('status', ['ORDERED', 'COMPLETED'])
                ->update(['status' => 'PROCESSED']);

            DB::table('purchase_requests')
                ->where('status', 'CANCELLED')
                ->whereExists(function ($query): void {
                    $query->selectRaw('1')
                        ->from('purchase_request_status_histories')
                        ->whereColumn('purchase_request_status_histories.purchase_request_id', 'purchase_requests.id')
                        ->where('purchase_request_status_histories.from_status', 'PROCESSED')
                        ->where('purchase_request_status_histories.to_status', 'CANCELLED')
                        ->where('purchase_request_status_histories.notes', 'Order internal dibatalkan.');
                })
                ->update(['status' => 'PROCESSED']);
        });
    }

    public function down(): void
    {
        // The former request status can no longer be reconstructed reliably.
        // Keeping PROCESSED is safe because it is valid in both workflow versions.
    }
};

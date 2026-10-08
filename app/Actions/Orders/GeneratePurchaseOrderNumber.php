<?php

namespace App\Actions\Orders;

use Illuminate\Support\Facades\DB;

class GeneratePurchaseOrderNumber
{
    public function handle(): string
    {
        $period = now()->format('Y/m');
        DB::table('purchase_order_sequences')->insertOrIgnore([
            'period' => $period, 'last_number' => 0, 'created_at' => now(), 'updated_at' => now(),
        ]);
        $sequence = DB::table('purchase_order_sequences')->where('period', $period)->lockForUpdate()->first();
        $next = ((int) $sequence->last_number) + 1;
        DB::table('purchase_order_sequences')->where('id', $sequence->id)->update(['last_number' => $next, 'updated_at' => now()]);

        return sprintf('ORD/%s/%04d', $period, $next);
    }
}

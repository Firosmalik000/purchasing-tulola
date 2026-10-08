<?php

namespace App\Actions\Requests;

use App\Models\Store;
use Illuminate\Support\Facades\DB;

class GeneratePurchaseRequestNumber
{
    public function handle(Store $store): string
    {
        $period = now()->format('Y/m');
        DB::table('purchase_request_sequences')->insertOrIgnore([
            'store_id' => $store->id, 'period' => $period, 'last_number' => 0, 'created_at' => now(), 'updated_at' => now(),
        ]);
        $sequence = DB::table('purchase_request_sequences')->where('store_id', $store->id)->where('period', $period)->lockForUpdate()->first();
        $next = ((int) $sequence->last_number) + 1;
        DB::table('purchase_request_sequences')->where('id', $sequence->id)->update(['last_number' => $next, 'updated_at' => now()]);

        return sprintf('REQ/%s/%s/%04d', strtoupper($store->code), $period, $next);
    }
}

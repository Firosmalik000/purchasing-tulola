<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->whereNotNull('invitation_sent_at')
            ->whereNull('invitation_token')
            ->whereNull('email_verified_at')
            ->update(['email_verified_at' => now()]);
    }

    public function down(): void
    {
        // The previous verification timestamp cannot be distinguished safely
        // from timestamps written by the invitation flow, so this backfill is
        // intentionally not reversed.
    }
};

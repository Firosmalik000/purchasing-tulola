<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class DevelopmentUserSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            return;
        }

        $password = config('app.development_admin.password');

        if (! is_string($password) || $password === '') {
            return;
        }

        User::query()->updateOrCreate(
            ['email' => config('app.development_admin.email')],
            [
                'name' => 'Development Super Admin',
                'password' => $password,
                'role' => UserRole::SUPER_ADMIN,
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1 Admin
        $admin = User::firstOrCreate(
            ['email' => 'admin@traffic.com'],
            [
                'name' => 'System Admin',
                'password' => Hash::make('password'),
                'phone' => '1234567890',
                'role' => 'admin'
            ]
        );
        $admin->assignRole('admin');

        // 5 Traffic Officers
        for ($i = 1; $i <= 5; $i++) {
            $officer = User::create([
                'name' => 'Officer ' . $i,
                'email' => "officer{$i}@traffic.com",
                'password' => Hash::make('password'),
                'phone' => '987654321' . $i,
                'role' => 'traffic_officer'
            ]);
            $officer->assignRole('traffic_officer');
        }

        // 10 Public Users
        for ($i = 1; $i <= 10; $i++) {
            $public = User::create([
                'name' => 'Public User ' . $i,
                'email' => "user{$i}@traffic.com",
                'password' => Hash::make('password'),
                'phone' => '555123456' . $i,
                'role' => 'public_user'
            ]);
            $public->assignRole('public_user');
        }
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Incident;

class IncidentSeeder extends Seeder
{
    public function run(): void
    {
        Incident::factory()->count(100)->create();
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            $table->uuid('tracking_id')->nullable()->unique()->after('id');
            $table->string('reporter_name')->nullable()->after('reported_by');
            $table->string('reporter_phone')->nullable()->after('reporter_name');
        });
    }

    public function down(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            $table->dropColumn(['tracking_id', 'reporter_name', 'reporter_phone']);
        });
    }
};

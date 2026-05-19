<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incident_updates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('incident_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->text('message');
            $table->string('status_change')->nullable();
            $table->enum('type', ['update', 'status_change', 'assignment', 'resolution'])->default('update');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incident_updates');
    }
};

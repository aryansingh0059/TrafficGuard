<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->enum('type', ['accident', 'congestion', 'roadblock', 'signal_failure', 'hazard']);
            $table->enum('severity', ['low', 'medium', 'high', 'critical']);
            $table->enum('status', ['reported', 'active', 'under_investigation', 'resolved', 'closed'])->default('reported');
            $table->string('location_name');
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->foreignId('reported_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->json('images')->nullable();
            $table->string('ai_severity')->nullable();
            $table->json('ai_suggestions')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};

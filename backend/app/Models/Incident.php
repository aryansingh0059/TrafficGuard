<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Incident extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (Incident $incident) {
            if (empty($incident->tracking_id)) {
                $incident->tracking_id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    protected $fillable = [
        'tracking_id',
        'title',
        'description',
        'type',
        'severity',
        'status',
        'location_name',
        'latitude',
        'longitude',
        'reported_by',
        'reporter_name',
        'reporter_phone',
        'assigned_to',
        'images',
        'ai_severity',
        'ai_suggestions',
        'resolved_at',
    ];

    protected $casts = [
        'images' => 'array',
        'ai_suggestions' => 'array',
        'resolved_at' => 'datetime',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function assignedOfficer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function updates(): HasMany
    {
        return $this->hasMany(IncidentUpdate::class);
    }
}

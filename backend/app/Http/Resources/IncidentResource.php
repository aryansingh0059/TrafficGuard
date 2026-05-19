<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class IncidentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $images = [];
        if ($this->images) {
            $images = collect($this->images)->map(function ($image) {
                return asset(Storage::url($image));
            })->toArray();
        }

        return [
            'id' => $this->id,
            'tracking_id' => $this->tracking_id,
            'title' => $this->title,
            'description' => $this->description,
            'type' => $this->type,
            'severity' => $this->severity,
            'status' => $this->status,
            'location' => [
                'name' => $this->location_name,
                'lat' => (float) $this->latitude,
                'lng' => (float) $this->longitude,
            ],
            'reporter' => [
                'id' => $this->reporter->id ?? null,
                'name' => $this->reporter->name ?? null,
            ],
            'assigned_officer' => [
                'id' => $this->assignedOfficer->id ?? null,
                'name' => $this->assignedOfficer->name ?? null,
            ],
            'images' => $images,
            'ai_analysis' => [
                'severity' => $this->ai_severity,
                'suggestions' => $this->ai_suggestions,
            ],
            'updates' => $this->updates()->with('user:id,name,role,profile_photo')->latest()->take(10)->get(),
            'resolved_at' => $this->resolved_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

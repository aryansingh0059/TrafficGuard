<?php

namespace App\Observers;

use App\Models\Incident;
use App\Models\IncidentUpdate;
use Illuminate\Support\Facades\Auth;

class IncidentObserver
{
    /**
     * Handle the Incident "updated" event.
     */
    public function updated(Incident $incident): void
    {
        if ($incident->wasChanged('status')) {
            $oldStatus = $incident->getOriginal('status');
            $newStatus = $incident->status;

            IncidentUpdate::create([
                'incident_id' => $incident->id,
                'user_id' => Auth::id() ?? $incident->reported_by,
                'message' => "Incident status changed from {$oldStatus} to {$newStatus}.",
                'status_change' => $newStatus,
                'type' => 'status_change',
            ]);
        }

        if ($incident->wasChanged('assigned_to')) {
            $officer = $incident->assignedOfficer;
            $name = $officer ? $officer->name : 'Unassigned';
            
            IncidentUpdate::create([
                'incident_id' => $incident->id,
                'user_id' => Auth::id() ?? $incident->reported_by,
                'message' => "Incident was assigned to {$name}.",
                'type' => 'assignment',
            ]);
        }
    }
}

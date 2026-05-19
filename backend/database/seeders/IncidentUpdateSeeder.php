<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Incident;
use App\Models\IncidentUpdate;

class IncidentUpdateSeeder extends Seeder
{
    public function run(): void
    {
        $resolvedIncidents = Incident::where('status', 'resolved')->get();

        foreach ($resolvedIncidents as $incident) {
            $numUpdates = rand(2, 5);
            $createdAt = $incident->created_at;
            $resolvedAt = $incident->resolved_at;

            // Generate timestamps between created_at and resolved_at
            $timestamps = [];
            for ($i = 0; $i < $numUpdates; $i++) {
                $timestamps[] = clone $createdAt->modify('+' . rand(1, 600) . ' minutes');
            }
            sort($timestamps);

            // Add an 'active' status change update
            IncidentUpdate::create([
                'incident_id' => $incident->id,
                'user_id' => $incident->assigned_to ?? 1,
                'message' => 'Officer has been dispatched and is en route.',
                'status_change' => 'active',
                'type' => 'status_change',
                'created_at' => $timestamps[0],
                'updated_at' => $timestamps[0]
            ]);

            // Add middle updates
            for ($i = 1; $i < $numUpdates - 1; $i++) {
                IncidentUpdate::create([
                    'incident_id' => $incident->id,
                    'user_id' => $incident->assigned_to ?? 1,
                    'message' => 'Monitoring the situation. Clearing debris from the right lane.',
                    'status_change' => null,
                    'type' => 'update',
                    'created_at' => $timestamps[$i],
                    'updated_at' => $timestamps[$i]
                ]);
            }

            // Add resolution update
            IncidentUpdate::create([
                'incident_id' => $incident->id,
                'user_id' => $incident->assigned_to ?? 1,
                'message' => 'Situation has been fully resolved. Normal traffic flow restored.',
                'status_change' => 'resolved',
                'type' => 'status_change',
                'created_at' => $resolvedAt,
                'updated_at' => $resolvedAt
            ]);
        }
    }
}

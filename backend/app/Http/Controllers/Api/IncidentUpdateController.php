<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\BaseController;
use App\Models\Incident;
use App\Models\IncidentUpdate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IncidentUpdateController extends BaseController
{
    public function index(Incident $incident): JsonResponse
    {
        $updates = $incident->updates()->with('user:id,name,role,profile_photo')->latest()->get();
        // Since the prompt says "index() returns all updates for an incident", I will use get() or pagination. 
        // Returning them all for timeline display is usually fine, or paginated. 
        // "returns all updates for an incident" implies getting all of them.
        return $this->successResponse($updates, 'Incident updates retrieved successfully.');
    }

    public function store(Request $request, Incident $incident): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'status_change' => 'nullable|string|in:reported,active,under_investigation,resolved,closed',
            'type' => 'nullable|string|in:update,status_change,assignment,resolution',
        ]);

        $update = IncidentUpdate::create([
            'incident_id' => $incident->id,
            'user_id' => $request->user()->id,
            'message' => $validated['message'],
            'status_change' => $validated['status_change'] ?? null,
            'type' => $validated['type'] ?? 'update',
        ]);

        // If a status change was requested and valid
        if (isset($validated['status_change']) && $validated['status_change'] !== $incident->status) {
            $incidentData = ['status' => $validated['status_change']];
            
            if ($validated['status_change'] === 'resolved') {
                $incidentData['resolved_at'] = now();
            }

            // Save quietly so the observer doesn't create a duplicate "status_change" update.
            $incident->fill($incidentData)->saveQuietly();
        }

        return $this->successResponse($update->load('user:id,name,role'), 'Update added successfully.', 201);
    }
}

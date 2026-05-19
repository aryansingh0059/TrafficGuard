<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\BaseController;
use App\Http\Requests\IncidentRequest;
use App\Http\Resources\IncidentResource;
use App\Models\Incident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class IncidentController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = Incident::with(['reporter', 'assignedOfficer']);

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('severity')) {
            $query->where('severity', $request->severity);
        }
        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }
        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('created_at', [$request->date_from, $request->date_to]);
        }

        $incidents = $query->latest()->paginate($request->get('per_page', 15));

        return $this->paginatedResponse(IncidentResource::collection($incidents)->resource, 'Incidents retrieved successfully.');
    }

    public function store(IncidentRequest $request, \App\Services\GroqService $groqService): JsonResponse
    {
        $data = $request->validated();
        $data['reported_by'] = $request->user()->id;
        $data['status'] = 'reported';

        try {
            if (empty($data['severity'])) {
                $predicted = $groqService->predictSeverity($data['description'], $data['type']);
                $data['severity'] = $predicted;
                $data['ai_severity'] = $predicted;
            }

            $data['ai_suggestions'] = $groqService->suggestActions($data['description'], $data['type'], $data['severity']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('AI Integration Error: ' . $e->getMessage());
            // Fallbacks in case service completely throws
            if (empty($data['severity'])) $data['severity'] = 'medium';
            $data['ai_suggestions'] = ['Dispatch officer', 'Monitor area'];
        }

        if ($request->hasFile('images')) {
            $imagePaths = [];
            foreach ($request->file('images') as $image) {
                $path = $image->store('incidents', 'public');
                $imagePaths[] = $path;
            }
            $data['images'] = $imagePaths;
        }

        $incident = Incident::create($data);

        // Broadcast Event for real-time map updates
        broadcast(new \App\Events\IncidentReported($incident));

        // Send Notifications to Officers for High/Critical incidents
        if (in_array($incident->severity, ['high', 'critical'])) {
            $officers = \App\Models\User::role('traffic_officer')->get();
            \Illuminate\Support\Facades\Notification::send($officers, new \App\Notifications\TrafficAlertNotification($incident));
        }

        return $this->successResponse(new IncidentResource($incident->load(['reporter', 'assignedOfficer'])), 'Incident reported successfully.', 201);
    }

    public function show(Incident $incident): JsonResponse
    {
        $incident->load(['reporter', 'assignedOfficer', 'updates.user']);
        return $this->successResponse(new IncidentResource($incident), 'Incident retrieved successfully.');
    }

    public function update(IncidentRequest $request, Incident $incident): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('images')) {
            if ($incident->images) {
                foreach ($incident->images as $oldImage) {
                    Storage::disk('public')->delete($oldImage);
                }
            }
            $imagePaths = [];
            foreach ($request->file('images') as $image) {
                $path = $image->store('incidents', 'public');
                $imagePaths[] = $path;
            }
            $data['images'] = $imagePaths;
        }

        $incident->update($data);

        return $this->successResponse(new IncidentResource($incident->load(['reporter', 'assignedOfficer'])), 'Incident updated successfully.');
    }

    public function destroy(Incident $incident): JsonResponse
    {
        if ($incident->images) {
            foreach ($incident->images as $image) {
                Storage::disk('public')->delete($image);
            }
        }

        $incident->delete();

        return $this->successResponse(null, 'Incident deleted successfully.');
    }

    public function resolve(Request $request, Incident $incident): JsonResponse
    {
        $incident->update([
            'status' => 'resolved',
            'resolved_at' => now(),
        ]);

        return $this->successResponse(new IncidentResource($incident), 'Incident marked as resolved.');
    }

    public function assign(Request $request, Incident $incident): JsonResponse
    {
        $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        $incident->update([
            'assigned_to' => $request->assigned_to,
            'status' => 'active',
        ]);

        return $this->successResponse(new IncidentResource($incident->load('assignedOfficer')), 'Incident assigned successfully.');
    }
}

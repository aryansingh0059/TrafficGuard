<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\BaseController;
use App\Models\Incident;
use App\Services\GroqService;
use App\Events\IncidentReported;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class PublicIncidentController extends BaseController
{
    public function report(Request $request, GroqService $groqService): JsonResponse
    {
        $data = $request->validate([
            'reporter_name' => 'required|string|max:255',
            'reporter_phone' => 'required|string|max:50',
            'description' => 'required|string',
            'type' => 'required|in:accident,congestion,roadblock,signal_failure,hazard',
            'location_name' => 'required|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'images' => 'nullable|array|max:3',
            'images.*' => 'image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $data['title'] = ucfirst(str_replace('_', ' ', $data['type'])) . ' reported by ' . $data['reporter_name'];
        $data['status'] = 'reported';
        $data['tracking_id'] = (string) Str::uuid();

        // AI Prediction Failsafe
        try {
            $predictedSeverity = $groqService->predictSeverity($data['description'], $data['type']);
            $data['severity'] = $predictedSeverity;
            $data['ai_severity'] = $predictedSeverity;
            $data['ai_suggestions'] = $groqService->suggestActions($data['description'], $data['type'], $data['severity']);
        } catch (\Exception $e) {
            Log::error('Public AI Integration Error: ' . $e->getMessage());
            $data['severity'] = 'medium'; // Default fallback
            $data['ai_suggestions'] = ['Dispatch available unit', 'Verify incident details on site'];
        }

        // Handle Images
        if ($request->hasFile('images')) {
            $imagePaths = [];
            foreach ($request->file('images') as $image) {
                if (count($imagePaths) >= 3) break;
                $path = $image->store('incidents', 'public');
                $imagePaths[] = '/storage/' . $path;
            }
            $data['images'] = $imagePaths;
        }

        $incident = Incident::create($data);

        // Broadcast Event for map updates
        broadcast(new IncidentReported($incident));

        // Alert officers if high/critical
        if (in_array($incident->severity, ['high', 'critical'])) {
            $officers = \App\Models\User::role('traffic_officer')->get();
            \Illuminate\Support\Facades\Notification::send($officers, new \App\Notifications\TrafficAlertNotification($incident));
        }

        return $this->successResponse([
            'tracking_id' => $incident->tracking_id,
            'status' => $incident->status,
            'message' => 'Incident reported successfully.'
        ], 'Incident reported successfully.', 201);
    }

    public function track(string $tracking_id): JsonResponse
    {
        $incident = Incident::with(['updates' => function($q) {
            $q->orderBy('created_at', 'desc');
        }])->where('tracking_id', $tracking_id)->first();

        if (!$incident) {
            return $this->errorResponse('Incident not found. Please check your tracking ID.', 404);
        }

        // Map safe data to avoid leaking AI info or reporter PII
        return $this->successResponse([
            'tracking_id' => $incident->tracking_id,
            'title' => $incident->title,
            'type' => $incident->type,
            'status' => $incident->status,
            'severity' => $incident->severity,
            'location_name' => $incident->location_name,
            'created_at' => $incident->created_at,
            'resolved_at' => $incident->resolved_at,
            'updates' => $incident->updates->map(function ($u) {
                return [
                    'message' => $u->message,
                    'status_change' => $u->status_change,
                    'type' => $u->type,
                    'created_at' => $u->created_at,
                ];
            })
        ], 'Incident tracking info retrieved.');
    }
}

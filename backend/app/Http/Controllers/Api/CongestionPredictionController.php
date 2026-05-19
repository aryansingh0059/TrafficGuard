<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\BaseController;
use App\Models\Incident;
use App\Services\GroqService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CongestionPredictionController extends BaseController
{
    public function predict(GroqService $groqService): JsonResponse
    {
        $predictions = Cache::remember('ai_congestion_predictions', 3600, function () use ($groqService) {
            
            $locations = Incident::where('created_at', '>=', Carbon::now()->subDays(30))
                ->select('location_name', 'latitude', 'longitude', DB::raw('COUNT(*) as count'))
                ->groupBy('location_name', 'latitude', 'longitude')
                ->orderByDesc('count')
                ->limit(20)
                ->get();

            $summary = [];
            foreach ($locations as $loc) {
                $incidents = Incident::where('location_name', $loc->location_name)
                    ->where('created_at', '>=', Carbon::now()->subDays(30))
                    ->get();
                
                $types = $incidents->countBy('type');
                $mostCommonType = $types->sortDesc()->keys()->first();
                
                $severityScore = $incidents->map(function ($i) {
                    $map = ['low'=>1,'medium'=>2,'high'=>3,'critical'=>4];
                    return $map[$i->severity] ?? 2;
                })->avg();

                $summary[] = [
                    'location_name' => $loc->location_name,
                    'lat' => $loc->latitude,
                    'lng' => $loc->longitude,
                    'count' => $loc->count,
                    'avg_severity_score' => round($severityScore, 1),
                    'most_common_type' => $mostCommonType
                ];
            }

            $dataJson = json_encode($summary);

            if ($dataJson === '[]') {
                return []; 
            }

            $systemPrompt = "You are a traffic prediction AI. Always respond in valid JSON only, no explanation.";
            $userMessage = "Based on this 30-day traffic incident data: {$dataJson}. Predict the 5 highest-risk locations for the next 24 hours. Return a JSON array of objects with: location_name, latitude, longitude, risk_score (0-100), reason (one sentence), predicted_type.";

            $response = $groqService->chat([['role' => 'user', 'content' => $userMessage]], $systemPrompt, 1000);

            $response = preg_replace('/```json\s*/', '', $response);
            $response = preg_replace('/```/', '', $response);

            $parsed = json_decode(trim($response), true);
            
            return is_array($parsed) ? $parsed : [];
        });

        return $this->successResponse($predictions, 'AI congestion predictions retrieved successfully.');
    }
}

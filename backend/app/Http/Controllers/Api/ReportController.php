<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\BaseController;
use App\Models\Incident;
use App\Services\GroqService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends BaseController
{
    public function generate(Request $request, GroqService $groqService): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'report_type' => 'required|in:daily,weekly,monthly,custom',
        ]);

        $startDate = Carbon::parse($request->start_date)->startOfDay();
        $endDate = Carbon::parse($request->end_date)->endOfDay();

        $incidents = Incident::whereBetween('created_at', [$startDate, $endDate])->get();
        $total = $incidents->count();

        if ($total === 0) {
            return $this->errorResponse('No incidents found for the selected period to generate a report.', 404);
        }

        $types = $incidents->countBy('type')->map(function ($count) use ($total) {
            return ['count' => $count, 'percentage' => round(($count / $total) * 100, 1)];
        });

        $severities = $incidents->countBy('severity');
        $resolved = $incidents->where('status', 'resolved')->count();
        $resolutionRate = round(($resolved / $total) * 100, 1);
        $criticalCount = $incidents->where('severity', 'critical')->count();

        $avgResponseBySeverity = Incident::whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('resolved_at')
            ->select('severity', DB::raw('AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) as avg_hours'))
            ->groupBy('severity')
            ->get()
            ->pluck('avg_hours', 'severity')
            ->map(fn($v) => round((float)$v, 2));

        $hotspots = Incident::whereBetween('created_at', [$startDate, $endDate])
            ->select('location_name', DB::raw('COUNT(*) as count'))
            ->groupBy('location_name')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        $data = json_encode([
            'total_incidents' => $total,
            'breakdown_by_type' => $types,
            'breakdown_by_severity' => $severities,
            'resolution_rate_percent' => $resolutionRate,
            'critical_incidents' => $criticalCount,
            'avg_response_time_hours_by_severity' => $avgResponseBySeverity,
            'top_5_hotspots' => $hotspots
        ]);

        $systemPrompt = "You are a professional traffic management report writer. Write in formal report style. Use markdown.";
        $userMessage = "Generate a complete traffic management report for {$request->report_type} period {$startDate->toDateString()} to {$endDate->toDateString()} using this data: {$data}. Include: 1) Executive Summary, 2) Key Statistics, 3) Incident Analysis, 4) Hotspot Analysis, 5) Three Actionable Recommendations.";

        $reportText = $groqService->chat([['role' => 'user', 'content' => $userMessage]], $systemPrompt, 2000);

        return $this->successResponse([
            'report_text' => $reportText,
            'generated_at' => Carbon::now()->toDateTimeString(),
            'period' => "{$startDate->toDateString()} to {$endDate->toDateString()}"
        ], 'Report generated successfully.');
    }
}

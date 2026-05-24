<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\BaseController;
use App\Models\Incident;
use App\Services\GroqService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends BaseController
{
    /**
     * Compile report statistics for the given date range.
     * GET /api/v1/admin/reports/compile
     */
    public function compile(Request $request): JsonResponse
    {
        $from = $request->from ?? now()->subDays(30)->toDateString();
        $to   = $request->to   ?? now()->toDateString();

        $base = Incident::whereBetween(
            'created_at',
            [$from . ' 00:00:00', $to . ' 23:59:59']
        );

        // Active = status is 'reported' or 'active' (not yet resolved/closed)
        $active = (clone $base)
            ->whereNotIn('status', ['resolved', 'closed'])
            ->count();

        // Resolved = status is 'resolved' OR 'closed'
        $resolved = (clone $base)
            ->whereIn('status', ['resolved', 'closed'])
            ->count();

        $critical = (clone $base)
            ->where('severity', 'critical')
            ->count();

        $total = (clone $base)->count();

        // Avg resolution time in hours
        $avgResolution = (clone $base)
            ->whereNotNull('resolved_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) as avg')
            ->value('avg');

        // Incidents per day for trend chart
        $byDate = (clone $base)
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get()
            ->map(fn($r) => ['date' => $r->date, 'count' => (int) $r->count]);

        // By type for pie chart
        $byType = (clone $base)
            ->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->get()
            ->map(fn($r) => ['name' => ucfirst($r->type ?? 'unknown'), 'value' => (int) $r->count]);

        // By severity for bar chart
        $bySeverity = (clone $base)
            ->selectRaw('severity, COUNT(*) as count')
            ->groupBy('severity')
            ->get()
            ->map(fn($r) => ['name' => ucfirst($r->severity ?? 'unknown'), 'value' => (int) $r->count]);

        // By status breakdown
        $byStatus = (clone $base)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->map(fn($r) => [
                'name'  => ucfirst(str_replace('_', ' ', $r->status ?? 'unknown')),
                'value' => (int) $r->count,
            ]);

        // Top 10 hotspots
        $hotspots = (clone $base)
            ->selectRaw('location_name, COUNT(*) as count')
            ->groupBy('location_name')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(fn($r) => [
                'location' => $r->location_name,
                'count'    => (int) $r->count,
            ]);

        // Recent 5 incidents in period
        $recent = (clone $base)
            ->with('reporter:id,name')
            ->latest()
            ->limit(5)
            ->get(['id', 'title', 'type', 'severity', 'status', 'location_name', 'created_at', 'reported_by']);

        // Resolution rate
        $resolutionRate = $total > 0
            ? round(($resolved / $total) * 100, 1)
            : 0;

        // Severity ratio (critical %)
        $severityRatio = $total > 0
            ? round(($critical / $total) * 100, 1)
            : 0;

        // Today count (not date-range scoped)
        $todayCount = Incident::whereDate('created_at', today())->count();

        // Peak day from by_date
        $peakDay = collect($byDate)->sortByDesc('count')->first();

        // Most common type
        $mostCommonType = collect($byType)->sortByDesc('value')->first();

        return response()->json([
            'success' => true,
            'data'    => [
                'period'           => ['from' => $from, 'to' => $to],
                'total'            => $total,
                'active'           => $active,
                'resolved'         => $resolved,
                'critical'         => $critical,
                'avg_resolution'   => $avgResolution ? round((float) $avgResolution, 1) : null,
                'severity_ratio'   => $severityRatio,
                'resolution_rate'  => $resolutionRate,
                'today_count'      => $todayCount,
                'peak_day'         => $peakDay,
                'most_common_type' => $mostCommonType,
                'by_date'          => $byDate,
                'by_type'          => $byType,
                'by_severity'      => $bySeverity,
                'by_status'        => $byStatus,
                'hotspots'         => $hotspots,
                'recent'           => $recent,
            ],
        ]);
    }

    /**
     * Generate an AI-synthesized report using Groq.
     * POST /api/v1/admin/reports/synthesize
     */
    public function synthesize(Request $request): JsonResponse
    {
        $from = $request->from ?? now()->subDays(30)->toDateString();
        $to   = $request->to   ?? now()->toDateString();

        $base     = Incident::whereBetween('created_at', [$from . ' 00:00:00', $to . ' 23:59:59']);
        $total    = (clone $base)->count();
        $active   = (clone $base)->whereNotIn('status', ['resolved', 'closed'])->count();
        $resolved = (clone $base)->whereIn('status', ['resolved', 'closed'])->count();
        $critical = (clone $base)->where('severity', 'critical')->count();

        $byType = (clone $base)
            ->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->get()
            ->map(fn($r) => $r->type . ': ' . $r->count)
            ->join(', ');

        $hotspots = (clone $base)
            ->selectRaw('location_name, COUNT(*) as count')
            ->groupBy('location_name')
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->map(fn($r) => $r->location_name . ' (' . $r->count . ' incidents)')
            ->join(', ');

        $resRate = $total > 0 ? round(($resolved / $total) * 100, 1) : 0;

        $userMessage = "Generate a formal government traffic management analytical report for the period {$from} to {$to} with this data:
- Total Incidents: {$total}
- Active/Unresolved: {$active}
- Resolved/Closed: {$resolved}
- Critical Severity: {$critical}
- Resolution Rate: {$resRate}%
- Breakdown by Type: {$byType}
- Top Hotspot Locations: {$hotspots}

Write the report with exactly these 6 sections using these exact headers on their own line:
1) EXECUTIVE SUMMARY
2) KEY FINDINGS
3) INCIDENT PATTERN ANALYSIS
4) HIGH RISK AREAS
5) RECOMMENDATIONS
6) CONCLUSION

Use formal Government of India report language.
Be specific with the numbers provided.
For KEY FINDINGS use bullet points starting with •
For RECOMMENDATIONS use numbered points 1. 2. 3. 4. 5.
Keep total length under 600 words.";

        try {
            $reportText = app(GroqService::class)->makeRequest(
                "You are a senior traffic analyst for the Government of India. Write only formal analytical reports. Never refuse, always generate the report.",
                $userMessage,
                1500
            );

            return response()->json([
                'success' => true,
                'data'    => [
                    'report'       => $reportText,
                    'generated_at' => now()->format('d M Y, h:i A'),
                    'period'       => ['from' => $from, 'to' => $to],
                    'model'        => 'llama-3.3-70b-versatile',
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'AI synthesis failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Legacy: generate report via AI (kept for backward compatibility).
     * POST /api/v1/admin/ai/generate-report
     */
    public function generate(Request $request, GroqService $groqService): JsonResponse
    {
        $request->validate([
            'start_date'  => 'sometimes|date',
            'end_date'    => 'sometimes|date',
            'report_type' => 'sometimes|in:daily,weekly,monthly,custom',
        ]);

        $from = $request->from ?? $request->start_date ?? now()->subDays(30)->toDateString();
        $to   = $request->to   ?? $request->end_date   ?? now()->toDateString();

        $base     = Incident::whereBetween('created_at', [$from . ' 00:00:00', $to . ' 23:59:59']);
        $total    = (clone $base)->count();
        $resolved = (clone $base)->whereIn('status', ['resolved', 'closed'])->count();
        $critical = (clone $base)->where('severity', 'critical')->count();
        $resRate  = $total > 0 ? round(($resolved / $total) * 100, 1) : 0;

        $byType = (clone $base)
            ->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')->get()
            ->map(fn($r) => $r->type . ': ' . $r->count)->join(', ');

        $hotspots = (clone $base)
            ->selectRaw('location_name, COUNT(*) as count')
            ->groupBy('location_name')
            ->orderByDesc('count')->limit(5)->get()
            ->map(fn($r) => $r->location_name . ' (' . $r->count . ')')->join(', ');

        $systemPrompt  = "You are a professional traffic management report writer. Write in formal report style.";
        $userMessage   = "Generate a complete traffic management report for period {$from} to {$to}. Data: total={$total}, resolved={$resolved}, critical={$critical}, resolution_rate={$resRate}%, types: {$byType}, hotspots: {$hotspots}. Include: 1) Executive Summary, 2) Key Statistics, 3) Incident Analysis, 4) Hotspot Analysis, 5) Three Actionable Recommendations.";
        $reportText    = $groqService->chat([['role' => 'user', 'content' => $userMessage]], $systemPrompt, 2000);

        return $this->successResponse([
            'report'       => $reportText,
            'report_text'  => $reportText,
            'generated_at' => now()->toDateTimeString(),
            'period'       => "$from to $to",
        ], 'Report generated successfully.');
    }
}

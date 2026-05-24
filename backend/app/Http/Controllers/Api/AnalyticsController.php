<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\BaseController;
use App\Models\Incident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends BaseController
{
    private function applyDateFilter($query, Request $request)
    {
        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }
        return $query;
    }

    public function summary(Request $request)
    {
        $query = Incident::query();
        $this->applyDateFilter($query, $request);

        $total = (clone $query)->count();
        $active = (clone $query)->where('status', 'active')->count();
        $resolved = (clone $query)->where('status', 'resolved')->count();
        $critical = (clone $query)->where('severity', 'critical')->count();
        
        $avgResponseTime = (clone $query)->whereNotNull('resolved_at')
            ->select(DB::raw('AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) as avg_hours'))
            ->first()
            ->avg_hours;

        return $this->successResponse([
            'total_incidents' => $total,
            'active' => $active,
            'resolved' => $resolved,
            'critical_count' => $critical,
            'avg_response_time_hours' => round((float)$avgResponseTime, 2)
        ]);
    }

    public function byType(Request $request)
    {
        $query = Incident::query();
        $this->applyDateFilter($query, $request);

        $total = (clone $query)->count() ?: 1; // Prevent division by zero

        $data = $query->select('type as name', DB::raw('COUNT(*) as value'))
            ->groupBy('type')
            ->get()
            ->map(function ($item) use ($total) {
                return [
                    'name' => ucwords(str_replace('_', ' ', $item->name)),
                    'value' => $item->value,
                    'percentage' => round(($item->value / $total) * 100, 1)
                ];
            });

        return $this->successResponse($data);
    }

    public function byDate(Request $request)
    {
        $query = Incident::query();
        $this->applyDateFilter($query, $request);

        if (!$request->filled('from')) {
            $period = $request->get('period', '7d');
            $days = (int) str_replace('d', '', $period);
            $query->where('created_at', '>=', Carbon::now()->subDays($days));
        }

        $data = $query->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        return $this->successResponse($data);
    }

    public function bySeverity(Request $request)
    {
        $query = Incident::query();
        $this->applyDateFilter($query, $request);

        $data = $query->select('severity as name', DB::raw('COUNT(*) as value'))
            ->groupBy('severity')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => ucfirst($item->name),
                    'value' => $item->value
                ];
            });

        return $this->successResponse($data);
    }

    public function hotspots(Request $request)
    {
        $query = Incident::query();
        $this->applyDateFilter($query, $request);

        $data = $query->select('location_name as name', 'latitude as lat', 'longitude as lng', DB::raw('COUNT(*) as count'))
            ->groupBy('location_name', 'latitude', 'longitude')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        return $this->successResponse($data);
    }

    public function responseTime(Request $request)
    {
        $query = Incident::query()->whereNotNull('resolved_at');
        $this->applyDateFilter($query, $request);

        $data = $query->select('severity as name', DB::raw('AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) as value'))
            ->groupBy('severity')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => ucfirst($item->name),
                    'value' => round((float)$item->value, 2)
                ];
            });

        return $this->successResponse($data);
    }

    public function byStatus(Request $request)
    {
        $query = Incident::query();
        $this->applyDateFilter($query, $request);

        $data = $query->select('status as name', DB::raw('COUNT(*) as value'))
            ->groupBy('status')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->name,
                    'value' => $item->value
                ];
            });

        return $this->successResponse($data);
    }
}

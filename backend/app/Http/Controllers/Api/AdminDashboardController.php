<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\BaseController;
use App\Models\Incident;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends BaseController
{
    /**
     * GET /admin/dashboard/summary
     * Returns site-wide statistics for the admin dashboard.
     */
    public function summary(Request $request): JsonResponse
    {
        $totalIncidents  = Incident::count();
        $activeCount     = Incident::where('status', 'active')->count();
        $resolvedCount   = Incident::where('status', 'resolved')->count();
        $criticalCount   = Incident::where('severity', 'critical')->count();
        $incidentsToday  = Incident::whereDate('created_at', today())->count();

        $totalUsers      = User::count();
        $totalOfficers   = User::role('traffic_officer')->count();

        // Average response time in hours (incidents that have been resolved)
        $avgResponseRaw  = Incident::whereNotNull('resolved_at')
            ->select(DB::raw('AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) as avg_hours'))
            ->first()
            ->avg_hours;

        return $this->successResponse([
            'total_incidents'    => $totalIncidents,
            'active_count'       => $activeCount,
            'resolved_count'     => $resolvedCount,
            'critical_count'     => $criticalCount,
            'total_users'        => $totalUsers,
            'total_officers'     => $totalOfficers,
            'incidents_today'    => $incidentsToday,
            'avg_response_time'  => round((float) $avgResponseRaw, 2),
        ]);
    }
}

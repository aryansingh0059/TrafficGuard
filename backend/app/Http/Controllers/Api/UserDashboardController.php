<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\BaseController;
use App\Models\Incident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserDashboardController extends BaseController
{
    /**
     * GET /user/dashboard/summary
     * Returns statistics scoped to the currently authenticated public user.
     */
    public function summary(Request $request): JsonResponse
    {
        $userId = auth()->id();

        $total    = Incident::where('reported_by', $userId)->count();
        $active   = Incident::where('reported_by', $userId)
                            ->whereIn('status', ['reported','active','under_investigation'])
                            ->count();
        $resolved = Incident::where('reported_by', $userId)
                            ->where('status', 'resolved')
                            ->count();
        $last     = Incident::where('reported_by', $userId)
                            ->latest()
                            ->first(['id','title','status','created_at','tracking_id']);

        return $this->successResponse([
            'total_reports'    => $total,
            'active_reports'   => $active,
            'resolved_reports' => $resolved,
            'last_report'      => $last,
        ]);
    }
}

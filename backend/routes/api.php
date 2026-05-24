<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Public Portal Routes (unauthenticated citizens)
    |--------------------------------------------------------------------------
    */
    Route::prefix('public')->group(function () {
        Route::post('/report', [App\Http\Controllers\Api\PublicIncidentController::class, 'report']);
        Route::get('/track/{tracking_id}', [App\Http\Controllers\Api\PublicIncidentController::class, 'track']);
    });

    /*
    |--------------------------------------------------------------------------
    | Auth Routes (Public)
    |--------------------------------------------------------------------------
    */
    Route::prefix('auth')->group(function () {
        Route::post('/register',        [AuthController::class, 'register']);
        Route::post('/login',           [AuthController::class, 'login']);
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/reset-password',  [AuthController::class, 'resetPassword']);
    });

    /*
    |--------------------------------------------------------------------------
    | Auth Routes (Protected — requires Sanctum token)
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
        Route::post('/logout',  [AuthController::class, 'logout']);
        Route::get('/profile',  [AuthController::class, 'profile']);
    });

    /*
    |--------------------------------------------------------------------------
    | ADMIN Routes — require auth + admin role
    |--------------------------------------------------------------------------
    */
    Route::middleware(['auth:sanctum', 'check_role:admin'])->prefix('admin')->group(function () {

        // Admin dashboard summary
        Route::get('/dashboard/summary', [App\Http\Controllers\Api\AdminDashboardController::class, 'summary']);

        // Incident management (all users)
        Route::get('/incidents',               [App\Http\Controllers\Api\IncidentController::class, 'index']);
        Route::post('/incidents',              [App\Http\Controllers\Api\IncidentController::class, 'store']);
        Route::get('/incidents/{incident}',    [App\Http\Controllers\Api\IncidentController::class, 'show']);
        Route::match(['put','patch'], '/incidents/{incident}', [App\Http\Controllers\Api\IncidentController::class, 'update']);
        Route::delete('/incidents/{incident}', [App\Http\Controllers\Api\IncidentController::class, 'destroy']);
        Route::post('/incidents/{incident}/assign',  [App\Http\Controllers\Api\IncidentController::class, 'assign']);
        Route::post('/incidents/{incident}/resolve', [App\Http\Controllers\Api\IncidentController::class, 'resolve']);

        // User management
        Route::get('/users', function (\Illuminate\Http\Request $request) {
            $query = \App\Models\User::query();
            if ($request->filled('role')) {
                $query->role($request->role);
            }
            if ($request->get('sort') === 'incidents_count') {
                $query->withCount('incidents')
                    ->orderByDesc('incidents_count');
                if ($request->filled('limit')) {
                    $query->limit((int)$request->limit);
                }
                $users = $query->get(['id', 'name', 'email', 'role', 'status', 'created_at']);
                foreach ($users as $user) {
                    $lastIncident = \App\Models\Incident::where('reported_by', $user->id)
                        ->latest('created_at')
                        ->first();
                    $user->last_report_date = $lastIncident ? $lastIncident->created_at->toIso8601String() : null;
                }
                return response()->json([
                    'data' => $users
                ]);
            }
            return response()->json([
                'data' => $query->orderByDesc('created_at')
                    ->get(['id', 'name', 'email', 'role', 'status', 'created_at'])
            ]);
        });
        Route::post('/users', function (\Illuminate\Http\Request $request) {
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8',
                'role' => 'required|string|in:admin,public_user,traffic_officer',
            ]);

            $user = \App\Models\User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => bcrypt($request->password),
                'role' => $request->role,
                'status' => 'active',
            ]);

            if (class_exists(\Spatie\Permission\Models\Role::class)) {
                $user->assignRole($request->role);
            }

            return response()->json([
                'message' => 'User created successfully.',
                'data' => $user
            ], 201);
        });
        Route::patch('/users/{id}/status', function (\Illuminate\Http\Request $request, $id) {
            $user = \App\Models\User::findOrFail($id);
            $user->status = $request->status === 'active' ? 'active' : 'inactive';
            $user->save();
            return response()->json(['message' => 'User status updated.', 'data' => $user]);
        });

        // Analytics (admin-only)
        Route::prefix('analytics')->group(function () {
            Route::get('/summary',      [App\Http\Controllers\Api\AnalyticsController::class, 'summary']);
            Route::get('/by-type',      [App\Http\Controllers\Api\AnalyticsController::class, 'byType']);
            Route::get('/by-date',      [App\Http\Controllers\Api\AnalyticsController::class, 'byDate']);
            Route::get('/by-severity',  [App\Http\Controllers\Api\AnalyticsController::class, 'bySeverity']);
            Route::get('/by-status',    [App\Http\Controllers\Api\AnalyticsController::class, 'byStatus']);
            Route::get('/hotspots',     [App\Http\Controllers\Api\AnalyticsController::class, 'hotspots']);
            Route::get('/response-time',[App\Http\Controllers\Api\AnalyticsController::class, 'responseTime']);
        });

        // Reports (compile + AI synthesis)
        Route::get('reports/compile',      [App\Http\Controllers\Api\ReportController::class, 'compile']);
        Route::post('reports/synthesize',  [App\Http\Controllers\Api\ReportController::class, 'synthesize']);

        // AI / Reports
        Route::prefix('ai')->group(function () {
            Route::get('/congestion-predictions', [App\Http\Controllers\Api\CongestionPredictionController::class, 'predict']);
            Route::post('/generate-report',       [App\Http\Controllers\Api\ReportController::class, 'generate']);
        });

        // Alerts
        Route::prefix('alerts')->group(function () {
            Route::get('/',              [App\Http\Controllers\Api\AlertController::class, 'index']);
            Route::patch('/{id}/read',   [App\Http\Controllers\Api\AlertController::class, 'markRead']);
            Route::post('/read-all',     [App\Http\Controllers\Api\AlertController::class, 'markAllRead']);
            Route::get('/count',         [App\Http\Controllers\Api\AlertController::class, 'count']);
        });

        // Incident updates
        Route::get('/incidents/{incident}/updates',  [App\Http\Controllers\Api\IncidentUpdateController::class, 'index']);
        Route::post('/incidents/{incident}/updates', [App\Http\Controllers\Api\IncidentUpdateController::class, 'store']);
    });

    /*
    |--------------------------------------------------------------------------
    | PUBLIC USER Routes — require auth + public_user role
    |--------------------------------------------------------------------------
    */
    Route::middleware(['auth:sanctum', 'check_role:public_user'])->prefix('user')->group(function () {

        // User dashboard (own stats only)
        Route::get('/dashboard/summary', [App\Http\Controllers\Api\UserDashboardController::class, 'summary']);

        // Incidents scoped to this user only
        Route::get('/incidents', function (\Illuminate\Http\Request $request) {
            $incidents = \App\Models\Incident::where('reported_by', auth()->id())
                ->latest()
                ->paginate(10);
            return response()->json(['data' => $incidents]);
        });
        Route::post('/incidents', [App\Http\Controllers\Api\IncidentController::class, 'store']);
        Route::get('/incidents/{incident}', function (\Illuminate\Http\Request $request, $id) {
            $incident = \App\Models\Incident::where('reported_by', $request->user()->id)->findOrFail($id);
            return response()->json(['data' => $incident]);
        });

        // Track by tracking_id (same as public portal but requires auth)
        Route::get('/track/{tracking_id}', [App\Http\Controllers\Api\PublicIncidentController::class, 'track']);
    });

    /*
    |--------------------------------------------------------------------------
    | Shared Protected Routes (any authenticated user)
    | Keep these for backward compatibility with existing frontend pages
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->group(function () {
        // Change password (shared operation)
        Route::post('/user/change-password', function (\Illuminate\Http\Request $request) {
            $request->validate([
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed',
            ]);

            $user = $request->user();

            if (!\Illuminate\Support\Facades\Hash::check($request->current_password, $user->password)) {
                return response()->json(['message' => 'The provided current password does not match our records.'], 422);
            }

            $user->password = \Illuminate\Support\Facades\Hash::make($request->new_password);
            $user->save();

            return response()->json(['message' => 'Password updated successfully.']);
        });

        // Read-only incidents (used by live map — any logged in user)
        Route::get('/incidents', [App\Http\Controllers\Api\IncidentController::class, 'index']);
        Route::get('/incidents/{incident}', [App\Http\Controllers\Api\IncidentController::class, 'show']);
        Route::get('/incidents/{incident}/updates', [App\Http\Controllers\Api\IncidentUpdateController::class, 'index']);
        Route::post('/incidents', [App\Http\Controllers\Api\IncidentController::class, 'store']);
        Route::match(['put','patch'], '/incidents/{incident}', [App\Http\Controllers\Api\IncidentController::class, 'update']);
        Route::delete('/incidents/{incident}', [App\Http\Controllers\Api\IncidentController::class, 'destroy']);
        Route::post('/incidents/{incident}/assign',  [App\Http\Controllers\Api\IncidentController::class, 'assign']);
        Route::post('/incidents/{incident}/resolve', [App\Http\Controllers\Api\IncidentController::class, 'resolve']);
        Route::post('/incidents/{incident}/updates', [App\Http\Controllers\Api\IncidentUpdateController::class, 'store']);

        // Analytics (frontend still calls /analytics/*, keep these working)
        Route::prefix('analytics')->group(function () {
            Route::get('/summary',       [App\Http\Controllers\Api\AnalyticsController::class, 'summary']);
            Route::get('/by-type',       [App\Http\Controllers\Api\AnalyticsController::class, 'byType']);
            Route::get('/by-date',       [App\Http\Controllers\Api\AnalyticsController::class, 'byDate']);
            Route::get('/by-severity',   [App\Http\Controllers\Api\AnalyticsController::class, 'bySeverity']);
            Route::get('/hotspots',      [App\Http\Controllers\Api\AnalyticsController::class, 'hotspots']);
            Route::get('/response-time', [App\Http\Controllers\Api\AnalyticsController::class, 'responseTime']);
        });

        // AI (frontend calls /ai/*)
        Route::prefix('ai')->group(function () {
            Route::get('/congestion-predictions', [App\Http\Controllers\Api\CongestionPredictionController::class, 'predict']);
            Route::post('/generate-report',       [App\Http\Controllers\Api\ReportController::class, 'generate']);
        });

        // Users list (used by IncidentManagementPage assign dropdown)
        Route::get('/users', function (\Illuminate\Http\Request $request) {
            $query = \App\Models\User::query();
            if ($request->filled('role')) {
                $query->role($request->role);
            }
            return response()->json(['data' => $query->get(['id', 'name', 'email', 'role', 'status', 'created_at'])]);
        });

        // Alerts
        Route::prefix('alerts')->group(function () {
            Route::get('/',              [App\Http\Controllers\Api\AlertController::class, 'index']);
            Route::patch('/{id}/read',   [App\Http\Controllers\Api\AlertController::class, 'markRead']);
            Route::post('/read-all',     [App\Http\Controllers\Api\AlertController::class, 'markAllRead']);
            Route::get('/count',         [App\Http\Controllers\Api\AlertController::class, 'count']);
        });
    });

});

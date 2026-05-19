<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\BaseController;
use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends BaseController
{
    /**
     * Register a new user, assign role, and return Sanctum token.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'email'     => 'required|email|unique:users,email',
            'password'  => 'required|string|min:8|confirmed',
            'phone'     => 'nullable|string|max:20',
            'role'      => 'required|string|in:admin,public_user',
            'admin_key' => 'sometimes|nullable|string',
        ]);

        // If registering as admin, validate the secret key
        if ($validated['role'] === 'admin') {
            $secretKey = env('ADMIN_SECRET_KEY', 'CHANGE_ME_IN_PRODUCTION');
            if (empty($validated['admin_key']) || $validated['admin_key'] !== $secretKey) {
                return $this->errorResponse('Invalid Admin Secret Key. Access denied.', 403);
            }
        }

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone'    => $validated['phone'] ?? null,
            'role'     => $validated['role'],
            'status'   => 'active',
        ]);

        $user->assignRole($validated['role']);

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->successResponse([
            'user'  => $user->load('roles'),
            'token' => $token,
        ], 'Registration successful', 201);
    }

    /**
     * Authenticate user and return Sanctum token.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt(['email' => $validated['email'], 'password' => $validated['password']])) {
            return $this->errorResponse('Invalid email or password.', 401);
        }

        /** @var User $user */
        $user = Auth::user();

        if ($user->status === 'inactive') {
            Auth::logout();
            return $this->errorResponse('Your account has been deactivated. Please contact support.', 403);
        }

        // Revoke all old tokens for a clean session
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->successResponse([
            'user'  => $user->load('roles', 'permissions'),
            'token' => $token,
        ], 'Login successful');
    }

    /**
     * Revoke the current API token (logout).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->successResponse(null, 'Logged out successfully');
    }

    /**
     * Return the authenticated user's profile with roles and permissions.
     */
    public function profile(Request $request): JsonResponse
    {
        $user = clone $request->user();
        $user->load('roles', 'permissions');
        $user->setAttribute('unread_notifications_count', $request->user()->unreadNotifications()->count());

        return $this->successResponse([
            'user'        => $user,
            'roles'       => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ], 'Profile retrieved successfully');
    }

    /**
     * Send a password reset link to the given email.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();

        // Generate a plain token and store its hash in password_reset_tokens
        $token = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            ['token' => Hash::make($token), 'created_at' => now()]
        );

        $user->notify(new ResetPasswordNotification($token));

        return $this->successResponse(null, 'Password reset link has been sent to your email.');
    }

    /**
     * Reset the user's password using a valid token.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'     => 'required|email|exists:users,email',
            'token'     => 'required|string',
            'password'  => 'required|string|min:8|confirmed',
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->first();

        if (!$record || !Hash::check($validated['token'], $record->token)) {
            return $this->errorResponse('Invalid or expired reset token.', 422);
        }

        // Token expires after 60 minutes
        if (now()->diffInMinutes($record->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();
            return $this->errorResponse('Reset token has expired. Please request a new one.', 422);
        }

        $user = User::where('email', $validated['email'])->first();
        $user->update(['password' => Hash::make($validated['password'])]);

        // Revoke all tokens to force re-login
        $user->tokens()->delete();

        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

        return $this->successResponse(null, 'Password reset successfully. Please log in.');
    }
}

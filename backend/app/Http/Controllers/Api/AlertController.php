<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlertController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()->unreadNotifications()->latest()->get();
        return $this->successResponse($notifications, 'Unread alerts retrieved successfully.');
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->find($id);
        
        if (!$notification) {
            return $this->errorResponse('Alert not found.', 404);
        }

        $notification->markAsRead();
        return $this->successResponse(null, 'Alert marked as read.');
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();
        return $this->successResponse(null, 'All alerts marked as read.');
    }

    public function count(Request $request): JsonResponse
    {
        $count = $request->user()->unreadNotifications()->count();
        return $this->successResponse(['count' => $count], 'Unread count retrieved.');
    }
}

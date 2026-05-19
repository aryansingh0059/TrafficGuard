<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use App\Models\Incident;

class TrafficAlertNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $incident;

    public function __construct(Incident $incident)
    {
        $this->incident = $incident;
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'incident_id' => $this->incident->id,
            'title' => $this->incident->title,
            'severity' => $this->incident->severity,
            'location' => $this->incident->location_name,
            'message' => 'A ' . $this->incident->severity . ' severity incident has been reported at ' . $this->incident->location_name,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'id' => $this->id,
            'data' => $this->toArray($notifiable),
            'read_at' => null,
            'created_at' => now(),
        ]);
    }
}

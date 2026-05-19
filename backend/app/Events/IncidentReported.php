<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Incident;
use App\Http\Resources\IncidentResource;

class IncidentReported implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $incident;

    public function __construct(Incident $incident)
    {
        $this->incident = new IncidentResource($incident);
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('traffic-alerts'),
        ];
    }
    
    public function broadcastAs(): string
    {
        return 'incident.reported';
    }
}

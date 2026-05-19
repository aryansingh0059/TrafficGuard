<?php

namespace Tests\Feature;

use App\Services\GroqService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class GroqServiceTest extends TestCase
{
    public function test_chat_method_returns_parsed_response()
    {
        Http::fake([
            'api.groq.com/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'Hello from Groq!'
                        ]
                    ]
                ]
            ], 200)
        ]);

        $service = new GroqService();
        $response = $service->chat([['role' => 'user', 'content' => 'Hi']], 'You are a helpful assistant.');

        $this->assertEquals('Hello from Groq!', $response);
    }

    public function test_api_failure_is_logged_and_handled()
    {
        Log::shouldReceive('error')->once();

        Http::fake([
            'api.groq.com/*' => Http::response('Internal Server Error', 500)
        ]);

        $service = new GroqService();
        $response = $service->chat([['role' => 'user', 'content' => 'Hi']], 'System prompt');

        $this->assertEquals('Error communicating with AI service.', $response);
    }
}

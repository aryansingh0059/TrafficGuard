<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GroqService
{
    protected string $apiKey;
    protected string $model;
    protected string $baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

    public function __construct()
    {
        $this->apiKey = config('services.groq.api_key', '');
        $this->model = config('services.groq.model', 'llama-3.3-70b-versatile');
    }

    /**
     * Sends a simple single-turn request to Groq API.
     */
    public function makeRequest(string $systemPrompt, string $userMessage, int $maxTokens = 500): string
    {
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userMessage],
        ];

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(30)
                ->post($this->baseUrl, [
                    'model' => $this->model,
                    'messages' => $messages,
                    'max_tokens' => $maxTokens,
                ]);

            if ($response->successful()) {
                return $response->json('choices.0.message.content', '');
            }

            Log::error('Groq API Request Failed', ['status' => $response->status(), 'body' => $response->body()]);
            return 'Error communicating with AI service.';
        } catch (\Exception $e) {
            Log::error('Groq API Exception', ['message' => $e->getMessage()]);
            return 'An error occurred while communicating with the AI service.';
        }
    }

    /**
     * Sends a multi-turn conversation request to Groq API.
     */
    public function chat(array $messages, string $systemPrompt, int $maxTokens = 1000): string
    {
        $payloadMessages = [
            ['role' => 'system', 'content' => $systemPrompt]
        ];
        
        $payloadMessages = array_merge($payloadMessages, $messages);

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(30)
                ->post($this->baseUrl, [
                    'model' => $this->model,
                    'messages' => $payloadMessages,
                    'max_tokens' => $maxTokens,
                ]);

            if ($response->successful()) {
                return $response->json('choices.0.message.content', '');
            }

            Log::error('Groq API Request Failed', ['status' => $response->status(), 'body' => $response->body()]);
            return 'Error communicating with AI service.';
        } catch (\Exception $e) {
            Log::error('Groq API Exception', ['message' => $e->getMessage()]);
            return 'An error occurred while communicating with the AI service.';
        }
    }

    /**
     * Predicts incident severity based on description and type.
     */
    public function predictSeverity(string $description, string $type): string
    {
        $systemPrompt = "You are a traffic incident severity classifier. Respond with only one word: low, medium, high, or critical.";
        $userMessage = "Incident type: {$type}. Description: {$description}. What is the severity?";
        
        try {
            $response = $this->makeRequest($systemPrompt, $userMessage, 10);
            $response = strtolower(trim($response));
            
            if (in_array($response, ['low', 'medium', 'high', 'critical'])) {
                return $response;
            }
        } catch (\Exception $e) {
            Log::error('Groq predictSeverity failed: ' . $e->getMessage());
        }
        
        return 'medium';
    }

    /**
     * Generates a list of suggested actions based on incident details.
     */
    public function suggestActions(string $description, string $type, string $severity): array
    {
        $systemPrompt = "You are a traffic management expert. Respond only in JSON array format. Provide exactly 3 recommended response actions as strings.";
        $userMessage = "Incident type: {$type}. Severity: {$severity}. Description: {$description}. What are 3 immediate actions to take?";
        
        try {
            $response = $this->makeRequest($systemPrompt, $userMessage, 200);
            
            // Clean markdown block if present
            $response = preg_replace('/```json\s*/', '', $response);
            $response = preg_replace('/```/', '', $response);
            
            $json = json_decode(trim($response), true);
            if (is_array($json)) {
                return $json;
            }
        } catch (\Exception $e) {
            Log::error('Groq suggestActions failed: ' . $e->getMessage());
        }
        
        return [
            'Dispatch nearest traffic officer to the scene.',
            'Monitor traffic flow in the surrounding area.',
            'Alert commuters via traffic broadcast channels.'
        ];
    }
}

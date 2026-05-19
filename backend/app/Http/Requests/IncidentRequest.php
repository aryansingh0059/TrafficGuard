<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class IncidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'type' => 'required|in:accident,congestion,roadblock,signal_failure,hazard',
            'severity' => 'nullable|in:low,medium,high,critical',
            'location_name' => 'required|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'images' => 'nullable|array|max:5',
            'images.*' => 'image|mimes:jpeg,png,jpg|max:2048',
        ];

        if ($this->isMethod('PUT') || $this->isMethod('PATCH')) {
            $rules = array_map(function($rule) {
                return str_replace('required', 'sometimes', $rule);
            }, $rules);
            $rules['status'] = 'sometimes|in:reported,active,under_investigation,resolved,closed';
        }

        return $rules;
    }
}

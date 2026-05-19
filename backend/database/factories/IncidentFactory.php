<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use Illuminate\Support\Str;

class IncidentFactory extends Factory
{
    public function definition(): array
    {
        $types = ['accident', 'congestion', 'roadblock', 'signal_failure', 'hazard'];
        $type  = $this->faker->randomElement($types);

        // Weighted probabilities
        $severities = array_merge(
            array_fill(0, 40, 'low'),
            array_fill(0, 30, 'medium'),
            array_fill(0, 20, 'high'),
            array_fill(0, 10, 'critical')
        );
        $severity = $this->faker->randomElement($severities);

        $statuses = array_merge(
            array_fill(0, 30, 'reported'),
            array_fill(0, 30, 'active'),
            array_fill(0, 40, 'resolved')
        );
        $status = $this->faker->randomElement($statuses);

        // ── Locations spread across ALL major Indian states ──────────────────
        $locations = [
            // Punjab
            ['city' => 'Amritsar',   'lat' => 31.6340, 'lng' => 74.8723],
            ['city' => 'Ludhiana',   'lat' => 30.9010, 'lng' => 75.8573],
            ['city' => 'Jalandhar',  'lat' => 31.3260, 'lng' => 75.5762],

            // Haryana / Delhi NCR
            ['city' => 'New Delhi',      'lat' => 28.6139, 'lng' => 77.2090],
            ['city' => 'Dwarka Delhi',   'lat' => 28.5921, 'lng' => 77.0460],
            ['city' => 'Gurugram',       'lat' => 28.4595, 'lng' => 77.0266],
            ['city' => 'Faridabad',      'lat' => 28.4089, 'lng' => 77.3178],

            // Maharashtra
            ['city' => 'Mumbai',    'lat' => 19.0760, 'lng' => 72.8777],
            ['city' => 'Pune',      'lat' => 18.5204, 'lng' => 73.8567],
            ['city' => 'Nagpur',    'lat' => 21.1458, 'lng' => 79.0882],
            ['city' => 'Nashik',    'lat' => 19.9975, 'lng' => 73.7898],

            // Karnataka
            ['city' => 'Bangalore', 'lat' => 12.9716, 'lng' => 77.5946],
            ['city' => 'Mysore',    'lat' => 12.2958, 'lng' => 76.6394],
            ['city' => 'Hubli',     'lat' => 15.3647, 'lng' => 75.1240],

            // Tamil Nadu
            ['city' => 'Chennai',     'lat' => 13.0827, 'lng' => 80.2707],
            ['city' => 'Coimbatore',  'lat' => 11.0168, 'lng' => 76.9558],
            ['city' => 'Madurai',     'lat' =>  9.9252, 'lng' => 78.1198],
            ['city' => 'Tiruchirappalli', 'lat' => 10.7905, 'lng' => 78.7047],

            // Telangana
            ['city' => 'Hyderabad', 'lat' => 17.3850, 'lng' => 78.4867],
            ['city' => 'Warangal',  'lat' => 17.9784, 'lng' => 79.5941],

            // Gujarat
            ['city' => 'Ahmedabad', 'lat' => 23.0225, 'lng' => 72.5714],
            ['city' => 'Surat',     'lat' => 21.1702, 'lng' => 72.8311],
            ['city' => 'Vadodara',  'lat' => 22.3072, 'lng' => 73.1812],
            ['city' => 'Rajkot',    'lat' => 22.3039, 'lng' => 70.8022],

            // Rajasthan
            ['city' => 'Jaipur',   'lat' => 26.9124, 'lng' => 75.7873],
            ['city' => 'Jodhpur',  'lat' => 26.2389, 'lng' => 73.0243],
            ['city' => 'Udaipur',  'lat' => 24.5854, 'lng' => 73.7125],
            ['city' => 'Kota',     'lat' => 25.2138, 'lng' => 75.8648],

            // Uttar Pradesh
            ['city' => 'Lucknow',  'lat' => 26.8467, 'lng' => 80.9462],
            ['city' => 'Kanpur',   'lat' => 26.4499, 'lng' => 80.3319],
            ['city' => 'Varanasi', 'lat' => 25.3176, 'lng' => 82.9739],
            ['city' => 'Agra',     'lat' => 27.1767, 'lng' => 78.0081],
            ['city' => 'Meerut',   'lat' => 28.9845, 'lng' => 77.7064],

            // West Bengal
            ['city' => 'Kolkata',  'lat' => 22.5726, 'lng' => 88.3639],
            ['city' => 'Siliguri', 'lat' => 26.7271, 'lng' => 88.3953],
            ['city' => 'Asansol',  'lat' => 23.6833, 'lng' => 86.9667],

            // Madhya Pradesh
            ['city' => 'Bhopal',  'lat' => 23.2599, 'lng' => 77.4126],
            ['city' => 'Indore',  'lat' => 22.7196, 'lng' => 75.8577],
            ['city' => 'Gwalior', 'lat' => 26.2183, 'lng' => 78.1828],

            // Kerala
            ['city' => 'Kochi',             'lat' =>  9.9312, 'lng' => 76.2673],
            ['city' => 'Thiruvananthapuram','lat' =>  8.5241, 'lng' => 76.9366],
            ['city' => 'Kozhikode',         'lat' => 11.2588, 'lng' => 75.7804],

            // Andhra Pradesh
            ['city' => 'Visakhapatnam', 'lat' => 17.6868, 'lng' => 83.2185],
            ['city' => 'Vijayawada',    'lat' => 16.5062, 'lng' => 80.6480],
            ['city' => 'Guntur',        'lat' => 16.3067, 'lng' => 80.4365],

            // Bihar
            ['city' => 'Patna', 'lat' => 25.5941, 'lng' => 85.1376],
            ['city' => 'Gaya',  'lat' => 24.7914, 'lng' => 85.0002],

            // Odisha
            ['city' => 'Bhubaneswar', 'lat' => 20.2961, 'lng' => 85.8245],
            ['city' => 'Cuttack',     'lat' => 20.4625, 'lng' => 85.8828],

            // Assam
            ['city' => 'Guwahati', 'lat' => 26.1445, 'lng' => 91.7362],
            ['city' => 'Dibrugarh','lat' => 27.4728, 'lng' => 94.9120],

            // Jharkhand
            ['city' => 'Ranchi',   'lat' => 23.3441, 'lng' => 85.3096],
            ['city' => 'Jamshedpur','lat' => 22.8046, 'lng' => 86.2029],

            // Uttarakhand
            ['city' => 'Dehradun', 'lat' => 30.3165, 'lng' => 78.0322],
            ['city' => 'Haridwar', 'lat' => 29.9457, 'lng' => 78.1642],

            // Himachal Pradesh
            ['city' => 'Shimla',    'lat' => 31.1048, 'lng' => 77.1734],
            ['city' => 'Dharamsala','lat' => 32.2190, 'lng' => 76.3234],

            // Chhattisgarh
            ['city' => 'Raipur',   'lat' => 21.2514, 'lng' => 81.6296],
            ['city' => 'Bilaspur', 'lat' => 22.0797, 'lng' => 82.1391],

            // Goa
            ['city' => 'Panaji',  'lat' => 15.4909, 'lng' => 73.8278],
            ['city' => 'Margao',  'lat' => 15.2832, 'lng' => 73.9862],

            // Jammu & Kashmir
            ['city' => 'Srinagar','lat' => 34.0837, 'lng' => 74.7973],
            ['city' => 'Jammu',   'lat' => 32.7266, 'lng' => 74.8570],

            // Punjab (Chandigarh)
            ['city' => 'Chandigarh',   'lat' => 30.7333, 'lng' => 76.7794],
            ['city' => 'Patiala',      'lat' => 30.3398, 'lng' => 76.3869],
        ];

        $loc = $this->faker->randomElement($locations);

        $createdAt  = $this->faker->dateTimeBetween('-60 days', 'now');
        $resolvedAt = $status === 'resolved'
            ? (clone $createdAt)->modify('+' . rand(1, 48) . ' hours')
            : null;

        $officers    = User::role('traffic_officer')->pluck('id')->toArray();
        $publicUsers = User::role('public_user')->pluck('id')->toArray();

        $assignedTo = ($status === 'active' || $status === 'resolved') && !empty($officers)
            ? $this->faker->randomElement($officers)
            : null;

        $reportedBy = !empty($publicUsers) ? $this->faker->randomElement($publicUsers) : null;

        return [
            'tracking_id'   => Str::uuid(),
            'title'         => ucfirst(str_replace('_', ' ', $type)) . ' reported at ' . $loc['city'],
            'description'   => $this->faker->realText(120),
            'type'          => $type,
            'severity'      => $severity,
            'status'        => $status,
            'location_name' => $loc['city'],
            'latitude'      => $loc['lat'] + $this->faker->randomFloat(4, -0.008, 0.008),
            'longitude'     => $loc['lng'] + $this->faker->randomFloat(4, -0.008, 0.008),
            'reported_by'   => $reportedBy,
            'assigned_to'   => $assignedTo,
            'ai_severity'   => $severity,
            'ai_suggestions'=> ['Dispatch traffic unit', 'Divert ongoing traffic', 'Assess for medical requirement'],
            'created_at'    => $createdAt,
            'updated_at'    => $resolvedAt ?: $createdAt,
            'resolved_at'   => $resolvedAt,
        ];
    }
}

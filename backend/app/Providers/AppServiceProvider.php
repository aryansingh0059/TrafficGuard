<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Incident;
use App\Observers\IncidentObserver;
use App\Services\GroqService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(GroqService::class, function ($app) {
            return new GroqService();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Incident::observe(IncidentObserver::class);
    }
}

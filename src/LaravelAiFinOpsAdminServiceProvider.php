<?php

declare(strict_types=1);

namespace Padosoft\LaravelAiFinOpsAdmin;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class LaravelAiFinOpsAdminServiceProvider extends ServiceProvider
{
    private const CONFIG_PATH = __DIR__.'/../config/ai-finops-admin.php';

    public function register(): void
    {
        $this->mergeConfigFrom(self::CONFIG_PATH, 'ai-finops-admin');
    }

    public function boot(): void
    {
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'ai-finops-admin');

        if ($this->app->runningInConsole()) {
            $this->publishes([
                self::CONFIG_PATH => $this->app->configPath('ai-finops-admin.php'),
            ], 'ai-finops-admin-config');

            $this->publishes([
                __DIR__.'/../public/build' => public_path('vendor/ai-finops-admin'),
            ], 'ai-finops-admin-assets');
        }

        if (config('ai-finops-admin.enabled', true)) {
            $this->bootRoutes();
        }
    }

    private function bootRoutes(): void
    {
        Route::group([
            'prefix' => config('ai-finops-admin.route.prefix', 'admin/ai-finops'),
            'middleware' => config('ai-finops-admin.route.middleware', ['web']),
        ], function (): void {
            $router = $this->app['router'];
            $router->get('/', fn () => view('ai-finops-admin::admin'))->name('ai-finops-admin.home');
            $router->get('/{any}', fn () => view('ai-finops-admin::admin'))
                ->where('any', '.*')
                ->name('ai-finops-admin.spa');
        });
    }
}

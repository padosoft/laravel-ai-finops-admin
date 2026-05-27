<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Admin route
    |--------------------------------------------------------------------------
    | Where the React SPA is mounted. The package API it consumes lives in
    | padosoft/laravel-ai-finops under `api_base` (session + CSRF).
    */
    'enabled' => env('AI_FINOPS_ADMIN_ENABLED', true),

    'route' => [
        'prefix' => env('AI_FINOPS_ADMIN_PREFIX', 'admin/ai-finops'),
        // Include an authentication guard here. The default `auth` uses the
        // Laravel web guard. Swap for `auth:admin` or any custom guard as needed.
        'middleware' => ['web', 'auth'],
    ],

    /*
    | Base path of the laravel-ai-finops API the SPA calls. Null = derive from the
    | core's configured route prefix at render time.
    */
    'api_base' => env('AI_FINOPS_ADMIN_API_BASE'),

    'app_name' => env('AI_FINOPS_ADMIN_APP_NAME', 'AI FinOps'),

    /*
    | Absolute URL for the logout action rendered in the admin sidebar.
    | Defaults to `/logout` (Laravel Breeze / Jetstream convention).
    | Override when your app uses a different logout URL (e.g. `/admin/logout`).
    */
    'logout_url' => env('AI_FINOPS_ADMIN_LOGOUT_URL', '/logout'),
];

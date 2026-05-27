<?php

declare(strict_types=1);

namespace Padosoft\LaravelAiFinOpsAdmin\Tests\Feature;

use Illuminate\Auth\GenericUser;
use Orchestra\Testbench\TestCase as Orchestra;
use Padosoft\LaravelAiFinOps\LaravelAiFinOpsServiceProvider;
use Padosoft\LaravelAiFinOpsAdmin\LaravelAiFinOpsAdminServiceProvider;

/**
 * Tests that the default auth middleware correctly protects the admin panel.
 * Uses a separate TestCase (does NOT strip middleware like the base TestCase).
 */
class AdminAuthTest extends Orchestra
{
    protected function getPackageProviders($app): array
    {
        return [
            LaravelAiFinOpsServiceProvider::class,
            LaravelAiFinOpsAdminServiceProvider::class,
        ];
    }

    protected function defineEnvironment($app): void
    {
        // Use only 'auth' middleware (skip 'web' to avoid session-start issues in testbench).
        $app['config']->set('ai-finops-admin.route.middleware', ['auth']);
    }

    protected function defineRoutes($router): void
    {
        // Provide a named 'login' route so the Auth middleware can redirect guests.
        $router->get('login', fn () => 'Login page')->name('login');
    }

    public function test_unauthenticated_guest_is_redirected(): void
    {
        $this->get('/admin/ai-finops')->assertRedirect();
    }

    public function test_authenticated_user_can_access_admin(): void
    {
        $user = new GenericUser(['id' => 1, 'name' => 'Test User', 'email' => 'test@example.com']);

        $this->actingAs($user)
            ->get('/admin/ai-finops')
            ->assertOk()
            ->assertSee('aifinops-admin', false);
    }
}

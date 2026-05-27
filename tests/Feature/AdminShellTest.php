<?php

declare(strict_types=1);

namespace Padosoft\LaravelAiFinOpsAdmin\Tests\Feature;

use Padosoft\LaravelAiFinOpsAdmin\LaravelAiFinOpsAdminServiceProvider;
use Padosoft\LaravelAiFinOpsAdmin\Tests\TestCase;

class AdminShellTest extends TestCase
{
    public function test_admin_provider_is_registered(): void
    {
        $this->assertArrayHasKey(
            LaravelAiFinOpsAdminServiceProvider::class,
            $this->app->getLoadedProviders(),
        );
    }

    public function test_admin_shell_renders_with_bootstrap(): void
    {
        $response = $this->get('/admin/ai-finops');

        $response->assertOk();
        $response->assertSee('aifinops-admin', false);
        $response->assertSee('window.AIFINOPS_ADMIN', false);
        $response->assertSee('AI FinOps', false);
    }

    public function test_spa_catch_all_renders_for_deep_links(): void
    {
        $this->get('/admin/ai-finops/budgets')->assertOk()->assertSee('aifinops-admin', false);
    }

    public function test_bootstrap_exposes_api_base_from_core_prefix(): void
    {
        $response = $this->get('/admin/ai-finops');

        // Defaults to the core route prefix (slashes are JSON-escaped in the bootstrap).
        $response->assertSee('"apiBase"', false);
        $response->assertSee('api\/ai-finops', false);
    }
}

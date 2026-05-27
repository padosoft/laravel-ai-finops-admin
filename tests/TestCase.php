<?php

declare(strict_types=1);

namespace Padosoft\LaravelAiFinOpsAdmin\Tests;

use Orchestra\Testbench\TestCase as Orchestra;
use Padosoft\LaravelAiFinOps\LaravelAiFinOpsServiceProvider;
use Padosoft\LaravelAiFinOpsAdmin\LaravelAiFinOpsAdminServiceProvider;

abstract class TestCase extends Orchestra
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
        // The admin shell route only renders a view; drop the `web` group (not
        // registered in the package test context) so the smoke test can reach it.
        $app['config']->set('ai-finops-admin.route.middleware', []);
    }
}

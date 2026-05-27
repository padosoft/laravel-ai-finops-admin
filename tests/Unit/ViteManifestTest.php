<?php

declare(strict_types=1);

namespace Padosoft\LaravelAiFinOpsAdmin\Tests\Unit;

use Padosoft\LaravelAiFinOpsAdmin\Support\ViteManifest;
use PHPUnit\Framework\TestCase;

class ViteManifestTest extends TestCase
{
    private string $dir;

    protected function setUp(): void
    {
        parent::setUp();
        $this->dir = sys_get_temp_dir().'/aifinops-admin-'.uniqid();
        mkdir($this->dir, 0777, true);
    }

    protected function tearDown(): void
    {
        @array_map('unlink', glob($this->dir.'/*') ?: []);
        @rmdir($this->dir);
        parent::tearDown();
    }

    public function test_reports_not_built_when_manifest_missing(): void
    {
        $entry = (new ViteManifest($this->dir, '/vendor/ai-finops-admin'))->entry();

        $this->assertFalse($entry['built']);
        $this->assertNull($entry['js']);
        $this->assertSame([], $entry['css']);
    }

    public function test_resolves_entry_js_and_css_from_manifest(): void
    {
        file_put_contents($this->dir.'/manifest.json', json_encode([
            'resources/js/admin/main.tsx' => [
                'file' => 'assets/main-abc.js',
                'css' => ['assets/main-abc.css'],
            ],
        ]));

        $entry = (new ViteManifest($this->dir, '/vendor/ai-finops-admin'))->entry();

        $this->assertTrue($entry['built']);
        $this->assertSame('/vendor/ai-finops-admin/assets/main-abc.js', $entry['js']);
        $this->assertSame(['/vendor/ai-finops-admin/assets/main-abc.css'], $entry['css']);
    }
}

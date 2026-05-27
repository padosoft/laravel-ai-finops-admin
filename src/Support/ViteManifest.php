<?php

declare(strict_types=1);

namespace Padosoft\LaravelAiFinOpsAdmin\Support;

/**
 * Minimal Vite manifest reader for a package-shipped SPA. Resolves the hashed
 * entry's JS + CSS from the built manifest so the Blade shell can emit tags
 * without depending on the host app's Vite config.
 */
class ViteManifest
{
    private const ENTRY = 'resources/js/admin/main.tsx';

    public function __construct(private readonly string $buildDir, private readonly string $baseUrl) {}

    public static function package(string $baseUrl): self
    {
        return new self(__DIR__.'/../../public/build', $baseUrl);
    }

    /** @return array{js: ?string, css: array<int,string>, built: bool} */
    public function entry(): array
    {
        $manifest = $this->read();

        if ($manifest === null || ! isset($manifest[self::ENTRY])) {
            return ['js' => null, 'css' => [], 'built' => false];
        }

        $chunk = $manifest[self::ENTRY];

        return [
            'js' => isset($chunk['file']) ? $this->url($chunk['file']) : null,
            'css' => array_map(fn ($f) => $this->url($f), $chunk['css'] ?? []),
            'built' => true,
        ];
    }

    private function read(): ?array
    {
        foreach (['/.vite/manifest.json', '/manifest.json'] as $path) {
            $file = $this->buildDir.$path;
            if (is_file($file)) {
                $decoded = json_decode((string) file_get_contents($file), true);

                return is_array($decoded) ? $decoded : null;
            }
        }

        return null;
    }

    private function url(string $file): string
    {
        return rtrim($this->baseUrl, '/').'/'.ltrim($file, '/');
    }
}

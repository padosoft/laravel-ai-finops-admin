@php
    use Padosoft\LaravelAiFinOpsAdmin\Support\ViteManifest;

    $apiBase = config('ai-finops-admin.api_base')
        ?: '/'.ltrim((string) config('ai-finops.routes.prefix', 'api/ai-finops'), '/');
    $assetBase = url('vendor/ai-finops-admin');
    $vite = ViteManifest::package($assetBase)->entry();
    $bootstrap = [
        'apiBase' => $apiBase,
        'adminBase' => url(config('ai-finops-admin.route.prefix', 'admin/ai-finops')),
        'csrfToken' => csrf_token(),
        'appName' => config('ai-finops-admin.app_name', 'AI FinOps'),
        'user' => optional(auth()->user())->only(['name', 'email']) ?? null,
    ];
@endphp
<!doctype html>
<html lang="en" data-theme="dark" data-accent="blue">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('ai-finops-admin.app_name', 'AI FinOps') }}</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @foreach ($vite['css'] as $css)
        <link rel="stylesheet" href="{{ $css }}">
    @endforeach
</head>
<body>
    <div id="aifinops-admin"></div>
    <script>window.AIFINOPS_ADMIN = @json($bootstrap);</script>
    @if ($vite['built'] && $vite['js'])
        <script type="module" src="{{ $vite['js'] }}"></script>
    @else
        <noscript>AI FinOps admin assets are not built. Run `npm ci && npm run build` in the package.</noscript>
        <div style="font-family:system-ui;padding:24px;color:#e6edf3;background:#0d1117">
            <strong>AI FinOps admin</strong> — frontend assets not built yet.
        </div>
    @endif
</body>
</html>

# Laravel AI FinOps · Admin Panel

> **The WOW control room for your AI spend.** A dense, Bloomberg-grade React console for
> [`padosoft/laravel-ai-finops`](https://github.com/padosoft/laravel-ai-finops) — dashboards, budgets,
> policies, approvals, cost-aware routing, forecasting, chargeback, alerts and a FinOps copilot.

<p>
  <a href="https://github.com/padosoft/laravel-ai-finops-admin/actions/workflows/ci.yml"><img src="https://github.com/padosoft/laravel-ai-finops-admin/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/PHP-8.3%2B-777BB4" alt="PHP">
  <img src="https://img.shields.io/badge/Laravel-12%20%7C%2013-FF2D20" alt="Laravel">
  <img src="https://img.shields.io/badge/React-19-61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Vite-6-646CFF" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind-v4-38BDF8" alt="Tailwind">
  <img src="https://img.shields.io/badge/license-Apache--2.0-blue" alt="License">
</p>

![AI FinOps admin dashboard](resources/screenshots/dashboard.png)

---

## What you get

A single React SPA mounted at `/admin/ai-finops` that drives **every** `laravel-ai-finops` endpoint —
**no mocks**, all live data over session + CSRF:

- **Dashboard** — KPIs, spend trend, top-models donut, budget burn, anomalies.
- **Usage Explorer** & **Call/Trace** — filterable ledger + per-step cost flame-graph.
- **Pricing** — LiteLLM mirror + sync + local overrides.
- **Budgets · Policies · Approvals · Chargeback · Alerts** — full governance, CRUD + workflows.
- **Forecast · Cost-aware Routing · What-if · Price Watcher · Credit Pools** — the intelligence layer.
- **FinOps Copilot · CO₂/ESG · Settings · Diagnostics**.

Dark/light themes, command-ready shell, accessible tables/drawers, dense data-first layout.

---

## Quick start

```bash
# 1. Install the core (if not already) and this admin panel
composer require padosoft/laravel-ai-finops
composer require padosoft/laravel-ai-finops-admin

# 2. Publish the built admin assets
php artisan vendor:publish --tag=ai-finops-admin-assets

# 3. (optional) publish config to change the route prefix / api base
php artisan vendor:publish --tag=ai-finops-admin-config
```

Open **`/admin/ai-finops`** (behind your app's `auth` middleware). That's it — the panel reads the
core API at `config('ai-finops.routes.prefix')`.

> Built assets ship with the package. Building from source: `npm ci && npm run build`.

---

## Stack

React 19 · Vite 6 · Tailwind v4 · TypeScript · React Router 7 · TanStack Query. The visual design
system is a pixel-perfect port of the approved prototype (`resources/css/design-system.css`). PHP
side is a thin Laravel package: a Blade shell + a Vite manifest reader serving the SPA.

## Configuration

`config/ai-finops-admin.php`: `route.prefix` (default `admin/ai-finops`), `route.middleware`
(default `['web','auth']`), `api_base` (defaults to the core prefix), `app_name`, `logout_url`.

## Testing

```bash
composer install && vendor/bin/phpunit   # PHP: shell renders + bootstrap
npm ci && npm run test                    # Vitest: components + screens (35 tests)
npm run build                             # Vite production build
```

CI runs PHP (8.3/8.4) + JS build/test on every PR.

## License

Apache-2.0 © [Padosoft](https://github.com/padosoft)

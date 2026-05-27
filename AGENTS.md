# laravel-ai-finops-admin — Agent Guide

React + Vite + Tailwind admin console for **`padosoft/laravel-ai-finops`** (installed from Packagist).
It serves a SPA at `/admin/ai-finops` that consumes the core API (session + CSRF) — **never mock**:
if a screen needs data/an endpoint the core lacks, fix/extend the **core**, tag + release it, bump the
dependency here, then finish the screen.

## Stack
- PHP `^8.3`, Laravel 12/13; package serves a Blade shell + built Vite assets (manifest reader).
- React 19, Vite 6, Tailwind v4, TypeScript, React Router 7, TanStack Query.
- Design system: the prototype's `styles.css` is shipped as `resources/css/design-system.css` (token-
  identical, pixel-perfect) + Tailwind utilities. Render the same classes via React components.

## Definition of Done (per screen/subtask)
- Wired to the **real** core API (no mocks at merge).
- PHPUnit (PHP), Vitest (components/hooks), and **Playwright covering all interactions** (desktop +
  tablet) for any UI.
- Local gates green: `composer validate`, `vendor/bin/phpunit`, `npm run build`, `npm run test`,
  `npm run e2e`; local Copilot `/review` clean; then push.

## Branch & PR loop
One branch per macro-task (T1…T8); subtask PRs into it; macro PR → `main`. PR reviewer = GitHub Copilot;
resolve CI + review before merge. Keep `docs/PROGRESS.md` (resume point) and `docs/LESSON.md` current.

## Build / serve
`npm ci && npm run build` produces `public/build` (manifest). The Blade shell reads the manifest via
`Support\ViteManifest`. Assets publish to `public/vendor/ai-finops-admin` in the host app.

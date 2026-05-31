# LESSON — laravel-ai-finops-admin

Non-obvious discoveries and patterns. Dated `YYYY-MM-DD`. Load before working; pass to subagents.

## 2026-06-01 — Playwright harness (multi-source pricing UI)

- **The repo had no Playwright setup** despite the `e2e` npm script and the AGENTS.md DoD. Built one
  that drives the REAL built React SPA in a browser without a Laravel host:
  - `index.html` (repo root) = standalone mount: a `#aifinops-admin` div + a `window.AIFINOPS_ADMIN`
    bootstrap (`adminBase:'/'` → router basename `/`) + `<script type=module src=/resources/js/admin/main.tsx>`.
  - `vite.e2e.config.ts` = base `/` (the prod `vite.config.ts` uses base `/vendor/ai-finops-admin/`,
    which is wrong for a root-served e2e page). `playwright.config.ts` runs `npx vite --config
    vite.e2e.config.ts` as its `webServer`; two projects (desktop 1440×900, tablet 1024×768).
  - The core API is stubbed per-test with `page.route('**/api/ai-finops/**', …)` reading
    `route.request().method()`/`postData()`. This is a pragmatic exception to AGENTS "never mock" —
    true backend e2e needs the whole Laravel+DB host, which isn't available in this package-only repo.
- **`page.getByLabel('Model')` is a SUBSTRING match** → it also matched "Search model". Use
  `{ exact: true }` when one label is a substring of another.
- **`Btn` did not forward `aria-label`** → added an optional `ariaLabel` prop. Icon-only buttons need it
  for both accessibility and `getByRole('button', { name })` / `getByLabel` targeting.
- **React Query cache invalidation scope matters**: creating a manual price must invalidate the whole
  `['pricing']` key (not just `['pricing','overrides']`), else the merged models catalog (source=manual)
  stays stale until reload.
- Tests after this work: Vitest 41, PHPUnit 8, Playwright 16 (8 × 2 projects), build green.

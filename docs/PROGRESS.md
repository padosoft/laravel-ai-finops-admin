# PROGRESS — laravel-ai-finops-admin

Dated work log (YYYY-MM-DD), newest first. Resume point for any session.

## 2026-06-01 — Cost cascade UI (mirrors core M9 / v1.2.x) — ✅ MERGED (PR #15) + RELEASED v1.2.0

- Spec: `docs/superpowers/specs/2026-06-01-cost-cascade-admin-design.md`.
- **Usage Explorer**: cost-method badge (actual/computed/estimated/covered) + `≈` estimated-tokens
  marker + drawer cost-method/billed-provider. **Diagnostics**: estimate-from-prompt textarea (case c).
  **Pricing**: manual mask gains media units (per_second/image/megapixel/request) + unit_rate for fal.
- Required a tiny core patch (v1.2.1) so `pricing/overrides` accepts media units + `unit_rate`.
- Tests: **Vitest 45** + **PHPUnit 8** + **Playwright 22** + build green.
- **Closed:** 2 local Copilot rounds + PR #15 (@copilot: 6 items → fixed: composer ^1.2.1 + lock,
  media token-costs forced 0 + inputs disabled, prompt trim, textarea class, README) → CI green
  (JS/PHP/Playwright) → merged → **released v1.2.0**. NEXT: nothing pending.

## 2026-06-01 — Multi-source pricing UI (mirrors backend M8) — ✅ MERGED (PR #14) + RELEASED v1.1.0

- Handoff spec: `docs/superpowers/specs/2026-05-31-multi-source-pricing-admin-design.md`.
- **Pricing screen**: model rows now show a **source** badge (litellm/openrouter/manual) + a `?source=`
  filter; per-source sync status line + `has_openrouter_key` indicator; "Add price" drawer gains
  **unit (per_token/per_million)**, **currency (USD/EUR)**, effective_from and note (regolo support).
- **New Subscriptions screen** (`/subscriptions`, nav under Consumption): canoni CRUD over
  `pricing/subscription-windows` — active windows flagged `covered · €0`, "End now" (PUT ends_at),
  delete via ConfirmModal.
- `Btn` gained an optional `ariaLabel` (accessibility + testability).
- **Subscriptions** now full CRUD: added **Edit** (PUT, prefilled drawer + Enabled toggle) alongside
  create / End-now / delete (addressed Copilot review).
- **Playwright harness built** (the repo had none): `index.html` + `vite.e2e.config.ts` (base '/') +
  `playwright.config.ts` (desktop 1440×900 + tablet 1024×768), API stubbed via `page.route`. Specs
  `e2e/pricing.spec.ts` + `e2e/subscriptions.spec.ts` cover all new interactions → **16 e2e green**
  (8 × 2 projects). CI gains an `e2e` job.
- Also: addOverride invalidates the whole `['pricing']` key so new manual prices surface in the catalog.
- Tests: **Vitest 42** + **PHPUnit 8** + **Playwright 16** + build, all green.
- **Closed:** 3 local Copilot `/review` rounds (all applied) → PR #14 → @copilot → CI green incl. the new
  **Playwright e2e** job → squash-merged → **tag + release v1.1.0**.
- **NEXT:** nothing pending. Future: Phase-2 OpenRouter per-endpoint prices (backend `use_endpoints`) would
  add an endpoint breakdown view here.

## 2026-05-27 — Admin complete

### T2–T8 — DONE
- T2 primitives + charts (ported SVG). T3 Dashboard/Usage/Trace. T4 Budgets/Policies/Approvals.
  T5 Pricing/Chargeback/Alerts. T6 Forecast/Routing/What-if/Price-watch/Credits.
  T7 Copilot/Footprint/Settings/Diagnostics. **All 19 nav screens wired to the real core API (no mocks).**
- T8: WOW README + tag/release. Security: removed dummy test APP_KEY (GitGuardian), ephemeral key in tests.
- Tests: Vitest 35 + PHPUnit 8, build green, CI PHP+JS. Each PR went through CI + Codex/Copilot review.
- **Known follow-up:** Playwright e2e infra (testbench serve + seed + browser) not yet wired — screens are
  covered by Vitest component/interaction tests with a fetch mock. Add Playwright per-screen in a later pass.



### M5.T1 — Admin foundation (branch `feat/admin-foundation`) — COMPLETE (pending PR→main)
- Package scaffolding: composer.json (require `padosoft/laravel-ai-finops` ^1.0 from Packagist),
  `LaravelAiFinOpsAdminServiceProvider` (admin routes + Blade shell), `config/ai-finops-admin.php`.
- Blade shell `admin.blade.php` + `Support\ViteManifest` (manifest reader) injecting
  `window.AIFINOPS_ADMIN` (apiBase from core prefix, csrf, adminBase, user).
- Frontend: Vite 6 + React 19 + Tailwind v4 + TS; design-system CSS ported from the prototype
  (`resources/css/design-system.css`, token-identical); API client (CSRF), TanStack Query;
  AppShell + Sidebar (full nav) + Topbar (theme toggle) + router; Dashboard wired to `/dashboard/kpis`;
  Placeholder for the remaining screens.
- Tests GREEN: PHPUnit 6/6, Vitest 4/4, `npm run build` ok, Pint ok. CI (PHP 8.3/8.4 + JS build/test).
- **Next:** T2 primitives + charts; T3 Login/Dashboard(full)/Usage/Trace with Playwright.
  Reminder: serving for Playwright needs a testbench workbench (add in T3).

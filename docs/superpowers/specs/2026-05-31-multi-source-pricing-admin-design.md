# Admin Handoff Spec — Multi-Source Pricing UI (mirrors backend M8)

- **Date:** 2026-05-31
- **Status:** Handoff — feeds the admin's own brainstorming → writing-plans → implementation loop
- **Backend source of truth:** `../laravel-ai-finops/docs/superpowers/specs/2026-05-31-multi-source-pricing-design.md`
  and plan `../laravel-ai-finops/docs/superpowers/plans/2026-05-31-multi-source-pricing.md`
- **Guardrail:** Playwright E2E for **every** new UI interaction (project DoD); Vitest for logic;
  same closure loop (local tests green → local Copilot `/review` zero comments → push → PR → @copilot
  reviewer → CI + Copilot green → merge).

## What changed in the backend (and why the UI must change)

The package went from a single LiteLLM price feed to **multi-source pricing**: LiteLLM ⊕ OpenRouter
(live API) ⊕ a first-class **manual** source (feed-less providers like **regolo.ai**, entered in EUR /
per-1M). Resolution = manual override → per-provider authority map → freshest per-source sync →
env tie-break. Two new cost concepts: **flat-rate subscription coverage windows** (covered calls cost
€0) and a per-provider **overhead %** for estimates. The ledger now freezes price provenance.

## Screens to update

### 1. Settings (`Ai-Finops-Web-Panel-settings`)
- **Sources**: enable/disable + reorder `litellm | openrouter | manual`; set `default_winner` order.
- **Per-provider authority map** editor (`provider → source`), e.g. `openrouter→openrouter`,
  `regolo→manual`, others → `litellm`.
- **OpenRouter key**: write-only field; show `has_openrouter_key` boolean (never the key). Replace/Clear.
- **Fees**: per-provider `markup_pct` (estimates overhead, e.g. OpenRouter ~5.5%).

### 2. Pricing Registry (`Ai-Finops-Web-Panel-pricing-registry` / `-override`)
- Add a **source** badge/column per model row; **filter by source** (`?source=`).
- Per-source **sync status** panel: for each source `{name, synced_at, models, has_key}` (replaces the
  single sync indicator).
- **Manual "Add price" mask** (the hand-entry cost form for regolo et al.): provider, model,
  input/output (+ optional cache), **unit toggle (per_token | per_million)**, **currency (EUR/USD)**,
  optional `effective_from`, `note`.

### 3. NEW — Subscription Windows (canoni) mask
- CRUD list + form: provider, label (e.g. "claude-max"), `starts_at`, `ends_at` (nullable = open),
  optional tenant/model scope, `enabled`, `note`. Make `ends_at` easy to shorten ("end now") for the
  exhaustion case. Covered calls then show €0 + `covered` status downstream.

### 4. Price Watcher (screenshot asset is `Ai-Finops-Web-Panel-price-whatcher.png` — filename misspelled in the repo)
- Add a **source** dimension to snapshots/comparisons.

### 5. Usage / Call-trace detail (`Ai-Finops-Web-Panel-call-trace` / `usage-details`)
- Surface ledger provenance from `metadata`: `price_source`, `rate_input`/`rate_output`,
  `source_synced_at`, `upstream_provider`, and the `covered_by` label + `covered` status.

## API contract (package side, under `/api/ai-finops`)

- `GET pricing/sync/status` → `{ synced_at, models, sources: [{name, enabled?, synced_at, models}],
  has_openrouter_key }`.
- `GET pricing/models?search=&source=&limit=` → rows: `{model, provider, input_cost_per_token,
  output_cost_per_token, source}`.
- `POST pricing/sync` → `{synced, models, synced_at}`.
- `GET|POST pricing/overrides`, `PUT|DELETE pricing/overrides/{id}` → now accept `unit`
  (`per_token|per_million`), `currency`, `effective_from`, `note`.
- `GET|POST pricing/subscription-windows`, `PUT|DELETE pricing/subscription-windows/{id}` →
  `{provider, label, starts_at, ends_at, enabled, tenant_id?, model?, note}`.
- Settings snapshot should expose `pricing.sources`, `provider_source_map`, `fees`,
  `has_openrouter_key` (the backend Settings endpoint may need a matching addition — coordinate).

## Next step for the admin repo

Run `superpowers:brainstorming` seeded with this doc, then `superpowers:writing-plans`, then implement
task-by-task with Playwright scenarios for each interaction, following the closure loop above.

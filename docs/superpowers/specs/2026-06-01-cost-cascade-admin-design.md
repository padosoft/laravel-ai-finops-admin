# Admin spec — Cost cascade UI (mirrors core M9 / v1.2.x)

- **Date:** 2026-06-01
- **Core:** `padosoft/laravel-ai-finops` v1.2.0 (cascade) + v1.2.1 (fal unit pricing via API).

## Implemented
- **Usage Explorer** (`Usage.tsx`): a **Method** badge per row (actual=green / computed=blue /
  estimated=yellow / covered=muted), an **`≈` estimated‑tokens marker**, and in the detail drawer the
  **cost method** + **billed (provider)** amount when present.
- **Diagnostics** (`Diagnostics.tsx`): an **estimate‑from‑prompt** textarea — paste a prompt and the
  server estimates tokens (case c); the result shows `method` + estimated tokens.
- **Pricing** (`Pricing.tsx`): the manual "Add price" mask gains **media units**
  (`per_second`/`per_image`/`per_megapixel`/`per_request`) + a **unit rate** field for fal.ai pricing.

## Tests
Vitest (Usage method badge + drawer, Diagnostics estimate‑from‑prompt, Pricing fal unit form) +
Playwright (`cost-cascade.spec.ts` + `pricing.spec.ts`) covering every new interaction, desktop+tablet.
Vitest 45 + PHPUnit 8 + Playwright 22 + build green.

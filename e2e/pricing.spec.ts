import { test, expect, type Page } from '@playwright/test';

type Captured = { url: string; method: string; body: unknown };

/** Stub the core API per test and record matching requests for assertions. */
async function stubApi(page: Page, captured: Captured[]) {
  await page.route('**/api/ai-finops/**', async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();
    let body: unknown = null;
    try {
      body = req.postData() ? JSON.parse(req.postData() as string) : null;
    } catch {
      body = req.postData();
    }
    captured.push({ url, method, body });

    const json = (data: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });

    if (url.includes('/pricing/models')) {
      return json({
        data: [{ model: 'gpt-5.1', provider: 'openai', input_cost_per_token: 0.000002, output_cost_per_token: 0.000008, source: 'litellm' }],
        count: 1,
      });
    }
    if (url.includes('/pricing/overrides')) {
      if (method === 'POST') return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 9 }) });
      return json({ data: [] });
    }
    if (url.includes('/pricing/sync/status')) {
      return json({
        synced_at: '2026-05-31T00:00:00Z',
        models: 2748,
        sources: [
          { name: 'litellm', synced_at: '2026-05-31T00:00:00Z', models: 2748 },
          { name: 'openrouter', synced_at: null, models: 0 },
        ],
        has_openrouter_key: true,
      });
    }
    return json({ data: [] });
  });
}

test.describe('Pricing screen (multi-source)', () => {
  test('shows source badge, per-source status and OpenRouter key indicator', async ({ page }) => {
    await stubApi(page, []);
    await page.goto('/pricing');

    await expect(page.getByText('gpt-5.1')).toBeVisible();
    await expect(page.getByText('OpenRouter key set')).toBeVisible();
    await expect(page.getByText(/litellm: 2748/)).toBeVisible();
  });

  test('filters models by source', async ({ page }) => {
    const captured: Captured[] = [];
    await stubApi(page, captured);
    await page.goto('/pricing');
    await expect(page.getByText('gpt-5.1')).toBeVisible();

    await page.getByLabel('Filter by source').selectOption('openrouter');

    await expect.poll(() => captured.some((c) => c.url.includes('/pricing/models') && c.url.includes('source=openrouter'))).toBe(true);
  });

  test('adds a manual price in EUR / per-million', async ({ page }) => {
    const captured: Captured[] = [];
    await stubApi(page, captured);
    await page.goto('/pricing');
    await expect(page.getByText('gpt-5.1')).toBeVisible();

    await page.getByRole('button', { name: 'Add price' }).click();
    await page.getByLabel('Model', { exact: true }).fill('Llama-3.3-70B-Instruct');
    await page.getByLabel('Input cost').fill('0.60');
    await page.getByLabel('Output cost').fill('2.70');
    await page.getByLabel('Unit').selectOption('per_million');
    await page.getByLabel('Currency').selectOption('EUR');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect
      .poll(() => {
        const post = captured.find((c) => c.url.includes('/pricing/overrides') && c.method === 'POST');
        return post ? (post.body as Record<string, unknown>) : null;
      })
      .toMatchObject({ unit: 'per_million', currency: 'EUR', input_cost_per_token: 0.6 });
  });

  test('adds a fal media override with a unit rate', async ({ page }) => {
    const captured: Captured[] = [];
    await stubApi(page, captured);
    await page.goto('/pricing');
    await expect(page.getByText('gpt-5.1')).toBeVisible();

    await page.getByRole('button', { name: 'Add price' }).click();
    await page.getByLabel('Model', { exact: true }).fill('flux-video');
    await page.getByLabel('Provider').fill('fal');
    await page.getByLabel('Unit').selectOption('per_second');
    await page.getByLabel('Unit rate').fill('0.0005');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect
      .poll(() => {
        const post = captured.find((c) => c.url.includes('/pricing/overrides') && c.method === 'POST');
        return post ? (post.body as Record<string, unknown>) : null;
      })
      .toMatchObject({ unit: 'per_second', unit_rate: 0.0005 });
  });
});

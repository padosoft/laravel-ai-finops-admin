import { test, expect, type Page } from '@playwright/test';

/** Stub the core API for the cost-cascade UI (usage method badge + estimate-from-prompt). */
async function stub(page: Page, captured: { url: string; method: string; body: unknown }[]) {
  await page.route('**/api/ai-finops/**', async (route) => {
    const req = route.request();
    const url = req.url();
    captured.push({ url, method: req.method(), body: req.postData() ? JSON.parse(req.postData() as string) : null });
    const json = (data: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (url.includes('/usage')) {
      return json({
        current_page: 1, last_page: 1, total: 1,
        data: [{ id: 1, created_at: '2026-06-01T10:00:00', provider: 'openrouter', model: 'llama-3.3', status: 'recorded', tokens_input: 100, tokens_output: 50, cost_total: '0.004200', trace_id: 't1', cost_method: 'actual', tokens_estimated: false, billed_cost: '0.004200', billed_currency: 'USD' }],
      });
    }
    if (url.includes('/health')) {
      return json({ package: 'padosoft/laravel-ai-finops', enabled: true, metering: true, enforcement: true });
    }
    if (url.includes('/diagnostics/estimate')) {
      return json({
        cost: { total: 0.0012, input: 0.0008, output: 0.0004, currency: 'USD' },
        method: 'estimated', tokens_estimated: true, tokens: { input: 12, output: 12 },
        price_source: 'litellm',
        decision: { action: 'allow', reason: '', budget_id: null, suggested_model: null },
      });
    }
    return json({ data: [] });
  });
}

test.describe('Cost cascade UI', () => {
  test('usage explorer shows the cost-method badge + billed cost', async ({ page }) => {
    await stub(page, []);
    await page.goto('/usage');

    await expect(page.getByText('llama-3.3')).toBeVisible();
    await expect(page.getByText('actual', { exact: true })).toBeVisible();

    await page.getByText('llama-3.3').click();
    await expect(page.getByText('Billed (provider)')).toBeVisible();
  });

  test('diagnostics estimates cost from a prompt (estimated method)', async ({ page }) => {
    const captured: { url: string; method: string; body: unknown }[] = [];
    await stub(page, captured);
    await page.goto('/diagnostics');

    await page.getByLabel('Model').fill('gpt-5.1');
    await page.getByLabel('Prompt text').fill('Summarize the quarterly report.');
    await page.getByRole('button', { name: 'Estimate' }).click();

    await expect(page.getByTestId('estimate-result')).toBeVisible();
    await expect(page.getByText('estimated', { exact: true })).toBeVisible();

    await expect
      .poll(() => {
        const post = captured.find((c) => c.url.includes('/diagnostics/estimate') && c.method === 'POST');
        return post ? (post.body as Record<string, unknown>) : null;
      })
      .toMatchObject({ prompt: 'Summarize the quarterly report.' });
  });
});

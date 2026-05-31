import { test, expect, type Page } from '@playwright/test';

type Captured = { url: string; method: string; body: unknown };

const activeWindow = {
  id: 7,
  provider: 'anthropic',
  label: 'claude-max',
  starts_at: '2026-05-01T00:00:00Z',
  ends_at: null,
  enabled: true,
  tenant_id: null,
  model: null,
  note: null,
};

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

    if (url.includes('/pricing/subscription-windows')) {
      if (method === 'GET') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [activeWindow] }) });
      if (method === 'DELETE') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ deleted: true }) });
      return route.fulfill({ status: method === 'POST' ? 201 : 200, contentType: 'application/json', body: JSON.stringify({ id: 7 }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
  });
}

test.describe('Subscriptions screen (canoni / €0 coverage)', () => {
  test('lists windows and flags active coverage as €0', async ({ page }) => {
    await stubApi(page, []);
    await page.goto('/subscriptions');

    await expect(page.getByText('claude-max')).toBeVisible();
    await expect(page.getByText(/covered · €0/)).toBeVisible();
  });

  test('creates a subscription', async ({ page }) => {
    const captured: Captured[] = [];
    await stubApi(page, captured);
    await page.goto('/subscriptions');

    await page.getByRole('button', { name: 'Add subscription' }).click();
    await page.getByLabel('Provider').fill('openai');
    await page.getByLabel('Plan label').fill('openai-pro');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect
      .poll(() => {
        const post = captured.find((c) => c.url.includes('/pricing/subscription-windows') && c.method === 'POST');
        return post ? (post.body as Record<string, unknown>) : null;
      })
      .toMatchObject({ provider: 'openai', label: 'openai-pro', enabled: true });
  });

  test('ends an active window now (PUT preserves fields)', async ({ page }) => {
    const captured: Captured[] = [];
    await stubApi(page, captured);
    await page.goto('/subscriptions');

    await page.getByRole('button', { name: 'End claude-max now' }).click();
    await page.getByRole('button', { name: 'End now', exact: true }).click();

    await expect
      .poll(() => {
        const put = captured.find((c) => c.url.includes('/pricing/subscription-windows/7') && c.method === 'PUT');
        return put ? (put.body as Record<string, unknown>) : null;
      })
      .toMatchObject({ provider: 'anthropic', label: 'claude-max', enabled: true });
  });

  test('edits an existing window', async ({ page }) => {
    const captured: Captured[] = [];
    await stubApi(page, captured);
    await page.goto('/subscriptions');

    await page.getByRole('button', { name: 'Edit claude-max' }).click();
    await page.getByLabel('Plan label').fill('claude-max-team');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect
      .poll(() => {
        const put = captured.find((c) => c.url.includes('/pricing/subscription-windows/7') && c.method === 'PUT');
        return put ? (put.body as Record<string, unknown>) : null;
      })
      .toMatchObject({ label: 'claude-max-team' });
  });

  test('deletes a window after confirm', async ({ page }) => {
    const captured: Captured[] = [];
    await stubApi(page, captured);
    await page.goto('/subscriptions');

    await page.getByRole('button', { name: 'Delete claude-max' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect.poll(() => captured.some((c) => c.url.includes('/pricing/subscription-windows/7') && c.method === 'DELETE')).toBe(true);
  });
});

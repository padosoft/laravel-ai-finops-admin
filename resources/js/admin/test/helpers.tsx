import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { ToastProvider } from '../components/Toast';

/** Render a component with the app's providers (fresh QueryClient, router, toasts). */
export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

/**
 * Stub global.fetch with a map of `path → json`. Matches the first key contained
 * in the request URL (longest key first, so specific routes win). Returns the spy.
 */
export function mockApi(routes: Record<string, unknown>) {
  const keys = Object.keys(routes).sort((a, b) => b.length - a.length);
  const spy = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    const match = keys.find((path) => url.includes(path));
    const body = match ? routes[match] : null;
    return new Response(JSON.stringify(body), {
      status: match ? 200 : 404,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', spy);
  return spy;
}

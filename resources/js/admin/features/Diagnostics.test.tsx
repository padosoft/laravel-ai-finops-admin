import { describe, it, expect, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockApi } from '../test/helpers';
import { Diagnostics } from './Diagnostics';

afterEach(() => vi.unstubAllGlobals());

const routes = () => ({
  '/health': { package: 'padosoft/laravel-ai-finops', enabled: true, metering: true, enforcement: true },
  '/diagnostics/estimate': {
    cost: { total: 0.0012, input: 0.0008, output: 0.0004, currency: 'USD' },
    method: 'estimated',
    tokens_estimated: true,
    tokens: { input: 12, output: 12 },
    price_source: 'litellm',
    decision: { action: 'allow', reason: '', budget_id: null, suggested_model: null },
  },
});

describe('Diagnostics', () => {
  it('estimates cost from a prompt and shows the estimated method', async () => {
    const spy = mockApi(routes());
    renderWithProviders(<Diagnostics />);

    fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'gpt-5.1' } });
    fireEvent.change(screen.getByLabelText('Prompt text'), { target: { value: 'Summarize this report.' } });
    fireEvent.click(screen.getByText('Estimate'));

    await waitFor(() => expect(screen.getByTestId('estimate-result')).toBeInTheDocument());
    expect(screen.getAllByText('estimated').length).toBeGreaterThan(0);

    // The POST sent `prompt` (not explicit token counts).
    const post = spy.mock.calls.find(([i, init]) => String(i).includes('/diagnostics/estimate') && (init as RequestInit)?.method === 'POST');
    const body = JSON.parse((post![1] as RequestInit).body as string);
    expect(body.prompt).toBe('Summarize this report.');
    expect(body.tokens_input).toBeUndefined();
  });
});

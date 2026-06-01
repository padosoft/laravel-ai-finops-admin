import { describe, it, expect, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockApi } from '../test/helpers';
import { Pricing } from './Pricing';

afterEach(() => vi.unstubAllGlobals());

const baseRoutes = () => ({
  '/pricing/models': {
    data: [{ model: 'gpt-5.1', provider: 'openai', input_cost_per_token: 0.000002, output_cost_per_token: 0.000008, source: 'litellm' }],
    count: 1,
  },
  '/pricing/overrides': { data: [{ id: 1, model: 'Llama-3.3', provider: 'regolo', input_cost_per_token: 0.6, output_cost_per_token: 2.7, currency: 'EUR', unit: 'per_million' }] },
  '/pricing/sync/status': {
    synced_at: '2026-05-31T00:00:00Z',
    models: 2748,
    sources: [
      { name: 'litellm', synced_at: '2026-05-31T00:00:00Z', models: 2748 },
      { name: 'openrouter', synced_at: null, models: 0 },
    ],
    has_openrouter_key: true,
  },
});

describe('Pricing', () => {
  it('lists models with a source badge and per-source status', async () => {
    mockApi(baseRoutes());
    renderWithProviders(<Pricing />);

    expect(await screen.findAllByText('gpt-5.1')).not.toHaveLength(0);
    // source badge in the models table
    expect(screen.getAllByText('litellm').length).toBeGreaterThan(0);
    // per-source status line + key indicator
    expect(screen.getByText(/litellm: 2748/)).toBeInTheDocument();
    expect(screen.getByText('OpenRouter key set')).toBeInTheDocument();
  });

  it('filters models by source', async () => {
    const spy = mockApi(baseRoutes());
    renderWithProviders(<Pricing />);

    await screen.findAllByText('gpt-5.1');
    fireEvent.change(screen.getByLabelText('Filter by source'), { target: { value: 'openrouter' } });

    await waitFor(() => {
      const called = spy.mock.calls.some(([input]) => String(input).includes('source=openrouter'));
      expect(called).toBe(true);
    });
  });

  it('adds a fal media override with a unit rate', async () => {
    const spy = mockApi(baseRoutes());
    renderWithProviders(<Pricing />);

    await screen.findAllByText('gpt-5.1');
    fireEvent.click(screen.getByText('Add price'));

    fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'flux-video' } });
    fireEvent.change(screen.getByLabelText('Provider'), { target: { value: 'fal' } });
    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'per_second' } });
    fireEvent.change(screen.getByLabelText('Unit rate'), { target: { value: '0.0005' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      const post = spy.mock.calls.find(
        ([input, init]) => String(input).includes('/pricing/overrides') && (init as RequestInit)?.method === 'POST',
      );
      expect(post).toBeTruthy();
      const body = JSON.parse((post![1] as RequestInit).body as string);
      expect(body.unit).toBe('per_second');
      expect(body.unit_rate).toBe(0.0005);
    });
  });

  it('adds a manual override in EUR / per-million', async () => {
    const spy = mockApi(baseRoutes());
    renderWithProviders(<Pricing />);

    await screen.findAllByText('gpt-5.1');
    fireEvent.click(screen.getByText('Add price'));

    fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'Llama-3.3-70B-Instruct' } });
    fireEvent.change(screen.getByLabelText('Input cost'), { target: { value: '0.60' } });
    fireEvent.change(screen.getByLabelText('Output cost'), { target: { value: '2.70' } });
    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'per_million' } });
    fireEvent.change(screen.getByLabelText('Currency'), { target: { value: 'EUR' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      const post = spy.mock.calls.find(
        ([input, init]) => String(input).includes('/pricing/overrides') && (init as RequestInit)?.method === 'POST',
      );
      expect(post).toBeTruthy();
      const body = JSON.parse((post![1] as RequestInit).body as string);
      expect(body.unit).toBe('per_million');
      expect(body.currency).toBe('EUR');
      expect(body.input_cost_per_token).toBe(0.6);
    });
  });
});

import { describe, it, expect, afterEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, mockApi } from '../test/helpers';
import { Pricing } from './Pricing';

afterEach(() => vi.unstubAllGlobals());

describe('Pricing', () => {
  it('lists mirror models and local overrides', async () => {
    mockApi({
      '/pricing/models': { data: [{ model: 'gpt-5.1', provider: 'openai', input_cost_per_token: 0.000002, output_cost_per_token: 0.000008 }], count: 1 },
      '/pricing/overrides': { data: [{ id: 1, model: 'gpt-5.1', provider: null, input_cost_per_token: 0.000001, output_cost_per_token: 0.000004, currency: 'USD' }] },
      '/pricing/sync/status': { synced_at: '2026-05-27T00:00:00Z', models: 2600 },
    });

    renderWithProviders(<Pricing />);

    expect(await screen.findAllByText('gpt-5.1')).not.toHaveLength(0);
    expect(screen.getByText(/2600 models/)).toBeInTheDocument();
  });
});

import { describe, it, expect, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockApi } from '../test/helpers';
import { Forecast } from './Forecast';
import { WhatIf } from './WhatIf';
import { Routing } from './Routing';
import { PriceWatch } from './PriceWatch';
import { Credits } from './Credits';

afterEach(() => vi.unstubAllGlobals());

describe('Forecast', () => {
  it('shows projection and acks an anomaly', async () => {
    const spy = mockApi({
      '/forecast': { period: 'month', spent: 100, projected: 300, days_elapsed: 10, days_in_period: 30, currency: 'USD' },
      '/anomalies': { data: [{ day: '2026-05-27', cost: 482, expected: 120, severity: 4.7, acked: false }] },
      '/anomalies/ack': { day: '2026-05-27' },
    });
    renderWithProviders(<Forecast />);
    expect(await screen.findByText('OPEN')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Ack'));
    await waitFor(() => expect(spy).toHaveBeenCalledWith(expect.stringContaining('/anomalies/ack'), expect.objectContaining({ method: 'POST' })));
  });
});

describe('WhatIf', () => {
  it('simulates a model switch and shows savings', async () => {
    mockApi({
      '/whatif/scenarios': { data: [] },
      '/whatif/simulate': { from_model: 'gpt-5.1', to_model: 'gpt-5.1-mini', calls: 1, current_cost: 0.1, projected_cost: 0.004, savings: 0.096, priced: true, message: null, currency: 'USD' },
    });
    renderWithProviders(<WhatIf />);
    fireEvent.change(screen.getByLabelText('From model'), { target: { value: 'gpt-5.1' } });
    fireEvent.change(screen.getByLabelText('To model'), { target: { value: 'gpt-5.1-mini' } });
    fireEvent.click(screen.getByText('Simulate'));
    await waitFor(() => expect(screen.getByTestId('whatif-result')).toBeInTheDocument());
  });
});

describe('Routing', () => {
  it('recommends the cheapest eligible model', async () => {
    mockApi({
      '/routing/rules': { data: [] },
      '/routing/quality-scores': { enabled: false, scores: {} },
      '/routing/simulate': { recommended: 'gpt-5.1-mini', min_quality: null, candidates: [{ model: 'gpt-5.1-mini', cost_metric: 0.000004, quality: null, eligible: true }] },
    });
    renderWithProviders(<Routing />);
    fireEvent.change(screen.getByLabelText('Candidates'), { target: { value: 'gpt-5.1, gpt-5.1-mini' } });
    fireEvent.click(screen.getByText('Recommend'));
    await waitFor(() => expect(screen.getByTestId('routing-result')).toBeInTheDocument());
  });
});

describe('PriceWatch', () => {
  it('lists detected changes', async () => {
    mockApi({
      '/price-watch/subscriptions': { data: [{ id: 1, model: 'gpt-x', provider: null, enabled: true }] },
      '/price-watch/changes': { data: [{ model: 'gpt-x', provider: null, old_input: 0.000002, new_input: 0.000001, input_change_pct: -50, captured_at: null }] },
    });
    renderWithProviders(<PriceWatch />);
    expect(await screen.findByText('-50.0%')).toBeInTheDocument();
  });
});

describe('Credits', () => {
  it('lists pools and opens the top-up drawer', async () => {
    mockApi({ '/credits/pools': { data: [{ id: 1, name: 'Team A', scope_type: 'cost_center', scope_id: 'a', balance: 15, currency: 'USD' }] } });
    renderWithProviders(<Credits />);
    expect(await screen.findByText('Team A')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Top up'));
    expect(screen.getByLabelText('Top-up amount')).toBeInTheDocument();
  });
});

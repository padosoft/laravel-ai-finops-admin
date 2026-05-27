import { describe, it, expect, afterEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockApi } from '../test/helpers';
import { Dashboard } from './Dashboard';

afterEach(() => vi.unstubAllGlobals());

describe('Dashboard', () => {
  it('renders KPIs, a top model, a budget burn and an anomaly from the API', async () => {
    mockApi({
      '/dashboard/kpis': { currency: 'USD', cost_today: 4827.42, cost_month_to_date: 87421, cost_total: 90000, calls_total: 184230, tokens_total: 412800000, avg_cost_per_call: 0.0262, models_count: 13 },
      '/dashboard/spend-trend': { data: [{ day: '2026-05-26', cost: 2800, calls: 100 }, { day: '2026-05-27', cost: 3100, calls: 120 }] },
      '/dashboard/top-models': { data: [{ model: 'gpt-5.1', cost: 18420, calls: 42100 }] },
      '/budgets': { data: [{ name: 'Engineering', percent: 81, state: 'warning' }] },
      '/anomalies': { data: [{ day: '2026-05-27', cost: 482, expected: 120, acked: false }] },
    });

    renderWithProviders(<Dashboard />);

    expect(await screen.findByText('$4,827.42')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('gpt-5.1')).toBeInTheDocument());
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('81%')).toBeInTheDocument();
    expect(screen.getByText('OPEN')).toBeInTheDocument();
  });
});

import { describe, it, expect, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockApi } from '../test/helpers';
import { Copilot } from './Copilot';
import { Footprint } from './Footprint';
import { Settings } from './Settings';
import { Diagnostics } from './Diagnostics';

afterEach(() => vi.unstubAllGlobals());

describe('Copilot', () => {
  it('asks a question and shows the not-configured default', async () => {
    mockApi({
      '/copilot/history': { data: [] },
      '/copilot/query': { answer: null, configured: false, data: { hint: 'Bind a CopilotProvider.' } },
    });
    renderWithProviders(<Copilot />);
    fireEvent.change(screen.getByLabelText('Question'), { target: { value: 'spend?' } });
    fireEvent.click(screen.getByText('Ask'));
    await waitFor(() => expect(screen.getByTestId('copilot-answer')).toBeInTheDocument());
    expect(screen.getByText('not configured')).toBeInTheDocument();
  });
});

describe('Footprint', () => {
  it('renders CO2 KPIs', async () => {
    mockApi({
      '/footprint/summary': { tokens: 1000, energy_kwh: 0.001, co2_grams: 0.4, co2_kg: 0.0004 },
      '/footprint/trend': { data: [{ day: '2026-05-27', tokens: 1000, energy_kwh: 0.001, co2_grams: 0.4 }] },
    });
    renderWithProviders(<Footprint />);
    expect(await screen.findByText('0.4 g')).toBeInTheDocument();
  });
});

describe('Settings', () => {
  it('shows runtime flags and stored kill switches', async () => {
    mockApi({
      '/settings': { enabled: true, metering: true, enforcement: true, kill_switch: false, currency: { base: 'USD', display: 'EUR' }, retention_days: 730, block_status: 402 },
      '/settings/kill-switch': { global_config: false, data: [{ id: 1, scope_type: 'provider', scope_id: 'openai', active: true, reason: 'incident' }] },
    });
    renderWithProviders(<Settings />);
    expect(await screen.findByText('USD → EUR')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });
});

describe('Diagnostics', () => {
  it('estimates cost + decision', async () => {
    mockApi({
      '/health': { package: 'padosoft/laravel-ai-finops', enabled: true, metering: true, enforcement: true },
      '/diagnostics/estimate': { cost: { total: 0.006, input: 0.002, output: 0.004, currency: 'USD' }, price_source: 'litellm', decision: { action: 'allow', reason: 'within budget', budget_id: null, suggested_model: null } },
    });
    renderWithProviders(<Diagnostics />);
    fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'gpt-5.1' } });
    fireEvent.click(screen.getByText('Estimate'));
    await waitFor(() => expect(screen.getByTestId('estimate-result')).toBeInTheDocument());
    expect(screen.getByText('allow')).toBeInTheDocument();
  });
});

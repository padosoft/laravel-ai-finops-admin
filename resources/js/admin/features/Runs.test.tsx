import { describe, it, expect, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockApi } from '../test/helpers';
import { Runs } from './Runs';

afterEach(() => vi.unstubAllGlobals());

const runRow = {
  invocation_id: 'inv_parent',
  agent: 'App\\Agents\\SupportAgent',
  provider: 'openai',
  model: 'gpt-4o-mini',
  parent_invocation_id: null,
  tenant_id: null,
  delegation_grant_id: null,
  steps: 2,
  tools: 1,
  failures: 0,
  cost_total: '0.030000',
  duration_ms: 450,
  ended_at: '2026-08-25T09:00:00+00:00',
};

const runDetail = {
  invocation_id: 'inv_parent',
  parent: null,
  steps: [
    {
      id: 1, kind: 'step', status: 'completed', step_number: 1, is_final_step: false,
      tool_name: null, tool_invocation_id: null, provider: 'openai', model: 'gpt-4o-mini',
      finish_reason: 'tool_calls', tokens_input: 100, tokens_output: 20,
      cost_total: '0.010000', duration_ms: 250, error_class: null, error_message: null,
    },
    {
      id: 2, kind: 'step', status: 'failed', step_number: 2, is_final_step: true,
      tool_name: null, tool_invocation_id: null, provider: 'openai', model: 'gpt-4o-mini',
      finish_reason: null, tokens_input: 0, tokens_output: 0,
      cost_total: '0', duration_ms: 1800, error_class: 'RuntimeException', error_message: 'upstream exploded',
    },
  ],
  tools: [
    {
      id: 3, kind: 'tool', status: 'failed', step_number: null, is_final_step: null,
      tool_name: 'refund_order', tool_invocation_id: 'tool_7', provider: null, model: null,
      finish_reason: null, tokens_input: 0, tokens_output: 0, cost_total: '0',
      duration_ms: 9000, error_class: 'RuntimeException', error_message: 'timed out',
    },
  ],
  children: [
    { invocation_id: 'inv_child', agent: 'App\\Agents\\BillingAgent', called_from_tool_invocation_id: 'tool_7', cost_total: '0.050000', duration_ms: 800, failures: 0 },
  ],
  ledger: [{ id: 11, status: 'failed', cost_total: '0.010000', currency: 'USD' }],
  totals: { steps: 2, tools: 1, failures: 2, tokens_input: 100, tokens_output: 20, cost_total: 0.01, duration_ms: 11050, currency: 'USD' },
};

describe('Runs', () => {
  it('lists runs and marks a root run as such', async () => {
    mockApi({ '/runs': { data: [runRow] } });

    renderWithProviders(<Runs />);

    await waitFor(() => expect(screen.getByText('SupportAgent')).toBeInTheDocument());
    expect(screen.getByText('root')).toBeInTheDocument();
  });

  it('marks a run that another agent delegated to', async () => {
    mockApi({ '/runs': { data: [{ ...runRow, invocation_id: 'inv_child', parent_invocation_id: 'inv_parent' }] } });

    renderWithProviders(<Runs />);

    await waitFor(() => expect(screen.getByText('delegated')).toBeInTheDocument());
  });

  it('opens a run and shows its steps, its tools and the runs it called', async () => {
    mockApi({
      '/runs/inv_parent': runDetail,
      '/runs': { data: [runRow] },
    });

    renderWithProviders(<Runs />);

    await waitFor(() => expect(screen.getByText('SupportAgent')).toBeInTheDocument());
    fireEvent.click(screen.getByText('SupportAgent'));

    // The chain card names the delegated run and the tool call that spawned it.
    await waitFor(() => expect(screen.getByText('BillingAgent')).toBeInTheDocument());
    expect(screen.getByText('from tool call tool_7')).toBeInTheDocument();
    expect(screen.getByText('This is a root run — nothing delegated to it.')).toBeInTheDocument();

    // A failing tool shows the time it burned before throwing, not just that it threw.
    expect(screen.getByText('refund_order')).toBeInTheDocument();
    expect(screen.getByText('9.0 s')).toBeInTheDocument();
  });

  it('tells the reader why the list is empty rather than showing nothing', async () => {
    mockApi({ '/runs': { data: [] } });

    renderWithProviders(<Runs />);

    await waitFor(() => expect(screen.getByText('No runs recorded yet')).toBeInTheDocument());
    expect(screen.getByText(/laravel\/ai \^0\.11/)).toBeInTheDocument();
  });
});

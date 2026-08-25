import { describe, it, expect, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockApi } from '../test/helpers';
import { Usage } from './Usage';

afterEach(() => vi.unstubAllGlobals());

const page = {
  current_page: 1,
  last_page: 1,
  total: 1,
  data: [
    { id: 1, created_at: '2026-05-27T10:00:00', provider: 'openrouter', model: 'gpt-5.1', status: 'recorded', tokens_input: 100, tokens_output: 50, cost_total: '0.006000', trace_id: 'trace-1', cost_method: 'actual', tokens_estimated: false, billed_cost: '0.006000', billed_currency: 'USD', delegation_grant_id: 'dgr_01TESTGRANT' },
  ],
};

describe('Usage', () => {
  it('lists calls and opens a detail drawer on row click', async () => {
    mockApi({ '/usage': page });
    renderWithProviders(<Usage />);

    expect(await screen.findByText('gpt-5.1')).toBeInTheDocument();

    fireEvent.click(screen.getByText('gpt-5.1'));
    await waitFor(() => expect(screen.getByText('Call #1')).toBeInTheDocument());
    expect(screen.getByText('trace-1')).toBeInTheDocument();
  });

  it('exposes filter inputs', () => {
    mockApi({ '/usage': page });
    renderWithProviders(<Usage />);
    expect(screen.getByLabelText('Filter by provider')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by model')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by delegation_grant_id')).toBeInTheDocument();
  });

  it('shows the delegation grant in the row and the detail drawer', async () => {
    mockApi({ '/usage': page });
    renderWithProviders(<Usage />);

    // Truncated marker in the row (title carries the full id).
    expect(await screen.findByTitle('dgr_01TESTGRANT')).toBeInTheDocument();

    fireEvent.click(screen.getByText('gpt-5.1'));
    await waitFor(() => expect(screen.getByText('Call #1')).toBeInTheDocument());
    expect(screen.getByText('Delegation grant')).toBeInTheDocument();
    expect(screen.getByText('dgr_01TESTGRANT')).toBeInTheDocument();
  });

  it('shows the cost-method badge and billed cost in the detail drawer', async () => {
    mockApi({ '/usage': page });
    renderWithProviders(<Usage />);

    // Method badge in the row.
    expect(await screen.findAllByText('actual')).not.toHaveLength(0);

    fireEvent.click(screen.getByText('gpt-5.1'));
    await waitFor(() => expect(screen.getByText('Call #1')).toBeInTheDocument());
    expect(screen.getByText('Billed (provider)')).toBeInTheDocument();
  });
});

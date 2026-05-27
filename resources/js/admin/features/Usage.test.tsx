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
    { id: 1, created_at: '2026-05-27T10:00:00', provider: 'openai', model: 'gpt-5.1', status: 'recorded', tokens_input: 100, tokens_output: 50, cost_total: '0.006000', trace_id: 'trace-1' },
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
  });
});

import { describe, it, expect, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockApi } from '../test/helpers';
import { Trace } from './Trace';

afterEach(() => vi.unstubAllGlobals());

describe('Trace', () => {
  it('loads a trace and renders per-step spans + totals', async () => {
    mockApi({
      '/trace': {
        trace_id: 'run-1',
        spans: [
          { id: 1, agent_step: 'plan', provider: 'openai', model: 'gpt-5.1', cost_total: '0.010000', tokens_input: 100, tokens_output: 40 },
          { id: 2, agent_step: 'answer', provider: 'openai', model: 'gpt-5.1-mini', cost_total: '0.002000', tokens_input: 80, tokens_output: 30 },
        ],
        totals: { calls: 2, cost_total: 0.012, tokens_input: 180, tokens_output: 70, currency: 'USD' },
        quality: {},
      },
    });

    renderWithProviders(<Trace />);

    fireEvent.change(screen.getByLabelText('Trace id'), { target: { value: 'run-1' } });
    fireEvent.click(screen.getByText('Load trace'));

    await waitFor(() => expect(screen.getByText('plan')).toBeInTheDocument());
    expect(screen.getByText('answer')).toBeInTheDocument();
    // totals KPI (2 spans)
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});

import { describe, it, expect, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockApi } from '../test/helpers';
import { Approvals } from './Approvals';

afterEach(() => vi.unstubAllGlobals());

describe('Approvals', () => {
  it('lists pending approvals and approves one', async () => {
    const spy = mockApi({
      '/approvals': { data: [{ id: 7, provider: 'openai', model: 'gpt-5.1', tenant_id: 'acme', estimated_cost: 5, currency: 'USD', status: 'pending', reason: 'policy: legal' }], total: 1 },
      '/approvals/7/approve': { id: 7, status: 'approved' },
    });

    renderWithProviders(<Approvals />);

    expect(await screen.findByText('gpt-5.1')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Approve'));

    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('/approvals/7/approve'), expect.objectContaining({ method: 'POST' })),
    );
  });
});

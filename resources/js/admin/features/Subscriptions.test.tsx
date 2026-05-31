import { describe, it, expect, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockApi } from '../test/helpers';
import { Subscriptions } from './Subscriptions';

afterEach(() => vi.unstubAllGlobals());

const activeWindow = {
  id: 7,
  provider: 'anthropic',
  label: 'claude-max',
  starts_at: '2026-05-01T00:00:00Z',
  ends_at: null,
  enabled: true,
  tenant_id: null,
  model: null,
  note: null,
};

describe('Subscriptions', () => {
  it('lists windows and flags active coverage as €0', async () => {
    mockApi({ '/pricing/subscription-windows': { data: [activeWindow] } });
    renderWithProviders(<Subscriptions />);

    expect(await screen.findByText('claude-max')).toBeInTheDocument();
    expect(screen.getByText(/covered · €0/)).toBeInTheDocument();
  });

  it('creates a subscription (canone)', async () => {
    const spy = mockApi({ '/pricing/subscription-windows': { data: [] } });
    renderWithProviders(<Subscriptions />);

    fireEvent.click(screen.getByText('Add subscription'));
    fireEvent.change(screen.getByLabelText('Provider'), { target: { value: 'anthropic' } });
    fireEvent.change(screen.getByLabelText('Plan label'), { target: { value: 'claude-max' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      const post = spy.mock.calls.find(
        ([input, init]) => String(input).includes('/pricing/subscription-windows') && (init as RequestInit)?.method === 'POST',
      );
      expect(post).toBeTruthy();
      const body = JSON.parse((post![1] as RequestInit).body as string);
      expect(body.provider).toBe('anthropic');
      expect(body.label).toBe('claude-max');
      expect(body.enabled).toBe(true);
    });
  });

  it('ends an active window now (PUT ends_at)', async () => {
    const spy = mockApi({ '/pricing/subscription-windows': { data: [activeWindow] } });
    renderWithProviders(<Subscriptions />);

    fireEvent.click(await screen.findByLabelText('End claude-max now'));

    await waitFor(() => {
      const put = spy.mock.calls.find(
        ([input, init]) => String(input).includes('/pricing/subscription-windows/7') && (init as RequestInit)?.method === 'PUT',
      );
      expect(put).toBeTruthy();
      const body = JSON.parse((put![1] as RequestInit).body as string);
      expect(typeof body.ends_at).toBe('string');
      // Ensure all existing fields are preserved (full-replace PUT must not drop them)
      expect(body.enabled).toBe(activeWindow.enabled);
      expect(body.starts_at).toBe(activeWindow.starts_at);
      expect(body.provider).toBe(activeWindow.provider);
      expect(body.label).toBe(activeWindow.label);
    });
  });

  it('confirms before deleting a window', async () => {
    const spy = mockApi({ '/pricing/subscription-windows': { data: [activeWindow] } });
    renderWithProviders(<Subscriptions />);

    fireEvent.click(await screen.findByLabelText('Delete claude-max'));
    // Confirm modal appears, then confirm.
    fireEvent.click(screen.getByText('Delete', { selector: 'button' }));

    await waitFor(() => {
      const del = spy.mock.calls.find(
        ([input, init]) => String(input).includes('/pricing/subscription-windows/7') && (init as RequestInit)?.method === 'DELETE',
      );
      expect(del).toBeTruthy();
    });
  });
});

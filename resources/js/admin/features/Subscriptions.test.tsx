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

  it('ends an active window now (PUT ends_at) after confirm', async () => {
    const spy = mockApi({ '/pricing/subscription-windows': { data: [activeWindow] } });
    renderWithProviders(<Subscriptions />);

    fireEvent.click(await screen.findByLabelText('End claude-max now'));
    // Confirm modal — its button's accessible name is the plain text "End now"
    // (the row trigger's name is the aria-label "End claude-max now").
    fireEvent.click(screen.getByRole('button', { name: 'End now' }));

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

  it('edits an existing window (prefilled drawer → PUT)', async () => {
    const spy = mockApi({ '/pricing/subscription-windows': { data: [activeWindow] } });
    renderWithProviders(<Subscriptions />);

    fireEvent.click(await screen.findByLabelText('Edit claude-max'));

    const label = screen.getByLabelText('Plan label') as HTMLInputElement;
    expect(label.value).toBe('claude-max'); // prefilled
    fireEvent.change(label, { target: { value: 'claude-max-team' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      const put = spy.mock.calls.find(
        ([input, init]) => String(input).includes('/pricing/subscription-windows/7') && (init as RequestInit)?.method === 'PUT',
      );
      expect(put).toBeTruthy();
      const body = JSON.parse((put![1] as RequestInit).body as string);
      expect(body.label).toBe('claude-max-team');
      expect(body.provider).toBe('anthropic');
      expect(body.enabled).toBe(true);
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

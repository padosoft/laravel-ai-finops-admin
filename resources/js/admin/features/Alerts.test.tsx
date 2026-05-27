import { describe, it, expect, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockApi } from '../test/helpers';
import { Alerts } from './Alerts';

afterEach(() => vi.unstubAllGlobals());

describe('Alerts', () => {
  it('lists channels and fires a test', async () => {
    const spy = mockApi({
      '/alerts/channels': { data: [{ id: 3, type: 'webhook', name: 'Ops', enabled: true, has_config: true }] },
      '/alerts/rules': { data: [] },
      '/alerts/log': { data: [] },
      '/budgets': { data: [] },
      '/alerts/channels/3/test': { tested: true, channel_id: 3 },
    });

    renderWithProviders(<Alerts />);

    expect(await screen.findByText('Ops')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Test'));

    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('/alerts/channels/3/test'), expect.objectContaining({ method: 'POST' })),
    );
  });
});

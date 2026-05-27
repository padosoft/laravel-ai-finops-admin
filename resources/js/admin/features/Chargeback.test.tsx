import { describe, it, expect, afterEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, mockApi } from '../test/helpers';
import { Chargeback } from './Chargeback';

afterEach(() => vi.unstubAllGlobals());

describe('Chargeback', () => {
  it('renders the allocation report and cost centers', async () => {
    mockApi({
      '/cost-centers': { data: [{ id: 1, code: 'rnd', name: 'R&D', owner: null, department: null }] },
      '/chargeback/report': { currency: 'USD', total: 10, data: [{ cost_center: 'rnd', name: 'R&D', cost: 8, calls: 12 }] },
    });

    renderWithProviders(<Chargeback />);

    expect(await screen.findByText(/Total 10 USD/)).toBeInTheDocument();
    expect(screen.getAllByText('R&D').length).toBeGreaterThan(0);
  });
});

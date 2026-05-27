import { describe, it, expect, afterEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders, mockApi } from '../test/helpers';
import { Budgets } from './Budgets';

afterEach(() => vi.unstubAllGlobals());

describe('Budgets', () => {
  it('lists budgets with burn % and opens the create drawer', async () => {
    mockApi({
      '/budgets': { data: [{ budget_id: 1, name: 'Eng', limit: 1000, spent: 810, percent: 81, currency: 'USD', state: 'warning', scope_type: 'cost_center', scope_id: 'eng', period: 'monthly' }] },
    });

    renderWithProviders(<Budgets />);

    expect(await screen.findByText('Eng')).toBeInTheDocument();
    expect(screen.getByText('81%')).toBeInTheDocument();

    fireEvent.click(screen.getByText(/New budget/));
    expect(screen.getByLabelText('Limit amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Period')).toBeInTheDocument();
  });
});

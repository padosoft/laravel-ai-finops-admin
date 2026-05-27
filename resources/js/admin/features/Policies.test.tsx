import { describe, it, expect, afterEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, mockApi } from '../test/helpers';
import { Policies } from './Policies';

afterEach(() => vi.unstubAllGlobals());

describe('Policies', () => {
  it('lists policies with their action badge', async () => {
    mockApi({
      '/policies': { data: [{ id: 1, name: 'Legal approval', scope_type: 'global', scope_id: null, min_cost: 1, model_match: null, action: 'require_approval', action_param: null, priority: 10, enabled: true }] },
    });

    renderWithProviders(<Policies />);

    expect(await screen.findByText('Legal approval')).toBeInTheDocument();
    expect(screen.getByText('require_approval')).toBeInTheDocument();
    expect(screen.getByText('cost ≥ 1')).toBeInTheDocument();
  });
});

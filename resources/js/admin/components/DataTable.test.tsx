import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, type Column } from './DataTable';

type Row = { id: number; model: string; cost: number };

const columns: Column<Row>[] = [
  { key: 'model', header: 'Model' },
  { key: 'cost', header: 'Cost', align: 'right', render: (r) => `$${r.cost.toFixed(2)}` },
];

describe('DataTable', () => {
  it('renders rows with custom cell renderers', () => {
    render(<DataTable columns={columns} rows={[{ id: 1, model: 'gpt-5.1', cost: 0.5 }]} rowKey={(r) => r.id} />);
    expect(screen.getByText('gpt-5.1')).toBeInTheDocument();
    expect(screen.getByText('$0.50')).toBeInTheDocument();
  });

  it('shows the empty state when there are no rows', () => {
    render(<DataTable columns={columns} rows={[]} rowKey={(r) => r.id} empty="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('fires onRowClick', () => {
    const onClick = vi.fn();
    render(<DataTable columns={columns} rows={[{ id: 7, model: 'm', cost: 1 }]} rowKey={(r) => r.id} onRowClick={onClick} />);
    fireEvent.click(screen.getByText('m'));
    expect(onClick).toHaveBeenCalledWith({ id: 7, model: 'm', cost: 1 });
  });
});

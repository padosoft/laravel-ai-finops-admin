import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/apiClient';
import { PageHead } from '../layout/AppShell';
import { Card, CardBody, Badge, Bar, Money, Btn, Drawer, ConfirmModal, Field } from '../components/ui';
import { DataTable, type Column } from '../components/DataTable';
import { useToast } from '../components/Toast';
import { Icon } from '../lib/icons';

type BudgetRow = {
  budget_id: number;
  name: string;
  limit: number;
  spent: number;
  percent: number;
  currency: string;
  state: 'ok' | 'warning' | 'exceeded';
  scope_type: string;
  scope_id: string | null;
  period: string;
};

const SCOPES = ['global', 'tenant', 'user', 'cost_center', 'provider', 'model', 'agent', 'purpose'];
const PERIODS = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'rolling'];

const emptyForm = { name: '', scope_type: 'global', scope_id: '', limit_amount: '', currency: 'USD', period: 'monthly', soft_limit_pct: '80', hard: true };

export function Budgets() {
  const qc = useQueryClient();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [toDelete, setToDelete] = useState<BudgetRow | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['budgets'], queryFn: () => api.get<{ data: BudgetRow[] }>('/budgets') });

  const create = useMutation({
    mutationFn: () =>
      api.post('/budgets', {
        name: form.name,
        scope_type: form.scope_type,
        scope_id: form.scope_type === 'global' ? null : form.scope_id,
        limit_amount: Number(form.limit_amount),
        currency: form.currency,
        period: form.period,
        soft_limit_pct: form.soft_limit_pct ? Number(form.soft_limit_pct) : null,
        hard: form.hard,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      setCreating(false);
      setForm(emptyForm);
      toast('Budget created', { kind: 'success' });
    },
    onError: (e) => toast('Could not create budget', { kind: 'error', message: e instanceof ApiError ? e.message : undefined }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.del(`/budgets/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      setToDelete(null);
      toast('Budget deleted', { kind: 'success' });
    },
  });

  const columns: Column<BudgetRow>[] = [
    { key: 'name', header: 'Name' },
    { key: 'scope', header: 'Scope', render: (b) => <span className="mono" style={{ fontSize: 11 }}>{b.scope_type}{b.scope_id ? `:${b.scope_id}` : ''}</span> },
    { key: 'period', header: 'Period' },
    { key: 'limit', header: 'Limit', align: 'right', render: (b) => <Money value={b.limit} /> },
    {
      key: 'burn',
      header: 'Burn',
      render: (b) => (
        <div style={{ width: 160 }}>
          <div className="row between" style={{ marginBottom: 3 }}>
            <Money value={b.spent} />
            <Badge tone={b.state === 'exceeded' ? 'red' : b.state === 'warning' ? 'yellow' : 'green'}>{b.percent.toFixed(0)}%</Badge>
          </div>
          <Bar pct={b.percent} tone={b.state === 'exceeded' ? 'danger' : b.state === 'warning' ? 'warn' : 'success'} />
        </div>
      ),
    },
    { key: 'actions', header: '', align: 'right', render: (b) => (
      <button className="iconbtn" aria-label="Delete budget" onClick={() => setToDelete(b)}><Icon name="x" /></button>
    ) },
  ];

  return (
    <>
      <PageHead title="Budgets" subtitle="Hierarchical spend limits & burndown" actions={<Btn variant="primary" size="sm" onClick={() => setCreating(true)}><Icon name="plus" /> New budget</Btn>} />

      <Card>
        <CardBody flush>
          {isLoading ? <div style={{ padding: 14, color: 'var(--fg-2)' }}>Loading…</div> : <DataTable columns={columns} rows={data?.data ?? []} rowKey={(b) => b.budget_id} empty="No budgets yet — create your first." />}
        </CardBody>
      </Card>

      <Drawer
        open={creating}
        onClose={() => setCreating(false)}
        title="New budget"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setCreating(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={() => create.mutate()} disabled={!form.name || !form.limit_amount || create.isPending}>Create</Btn>
          </>
        }
      >
        <div className="col" style={{ gap: 10 }}>
          <Field label="Name"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Name" /></Field>
          <Field label="Scope">
            <select className="select" value={form.scope_type} onChange={(e) => setForm({ ...form, scope_type: e.target.value })} aria-label="Scope type">
              {SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          {form.scope_type !== 'global' && (
            <Field label="Scope id"><input className="input" value={form.scope_id} onChange={(e) => setForm({ ...form, scope_id: e.target.value })} aria-label="Scope id" /></Field>
          )}
          <Field label="Limit"><input className="input" type="number" value={form.limit_amount} onChange={(e) => setForm({ ...form, limit_amount: e.target.value })} aria-label="Limit amount" /></Field>
          <Field label="Period">
            <select className="select" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} aria-label="Period">
              {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Soft limit %"><input className="input" type="number" value={form.soft_limit_pct} onChange={(e) => setForm({ ...form, soft_limit_pct: e.target.value })} aria-label="Soft limit percent" /></Field>
          <label className="row" style={{ gap: 8 }}>
            <input type="checkbox" checked={form.hard} onChange={(e) => setForm({ ...form, hard: e.target.checked })} /> Hard limit (blocks calls)
          </label>
        </div>
      </Drawer>

      <ConfirmModal
        open={!!toDelete}
        title="Delete budget"
        message={`Delete "${toDelete?.name}"? Child budgets are re-parented.`}
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.budget_id)}
      />
    </>
  );
}

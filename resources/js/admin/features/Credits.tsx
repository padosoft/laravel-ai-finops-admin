import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/apiClient';
import { fmtUsd } from '../lib/format';
import { PageHead } from '../layout/AppShell';
import { Card, CardBody, Btn, Drawer, Field, Money } from '../components/ui';
import { DataTable, type Column } from '../components/DataTable';
import { useToast } from '../components/Toast';
import { Icon } from '../lib/icons';

type Pool = { id: number; name: string; scope_type: string; scope_id: string | null; balance: number; currency: string };

const SCOPES = ['tenant', 'cost_center', 'user', 'global'];
const emptyForm = { name: '', scope_type: 'tenant', scope_id: '', balance: '0', currency: 'USD' };

export function Credits() {
  const qc = useQueryClient();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [topup, setTopup] = useState<{ pool: Pool; amount: string } | null>(null);

  const pools = useQuery({ queryKey: ['credits'], queryFn: () => api.get<{ data: Pool[] }>('/credits/pools') });

  const create = useMutation({
    mutationFn: () => api.post('/credits/pools', { name: form.name, scope_type: form.scope_type, scope_id: form.scope_type === 'global' ? null : form.scope_id, balance: Number(form.balance), currency: form.currency }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credits'] });
      setCreating(false);
      setForm(emptyForm);
      toast('Credit pool created', { kind: 'success' });
    },
    onError: (e) => toast('Could not create pool', { kind: 'error', message: e instanceof ApiError ? e.message : undefined }),
  });

  const doTopup = useMutation({
    mutationFn: () => api.post(`/credits/pools/${topup!.pool.id}/topup`, { amount: Number(topup!.amount) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credits'] });
      setTopup(null);
      toast('Top-up applied', { kind: 'success' });
    },
    onError: () => toast('Top-up failed', { kind: 'error' }),
  });

  const cols: Column<Pool>[] = [
    { key: 'name', header: 'Pool' },
    { key: 'scope', header: 'Scope', render: (p) => <span className="mono" style={{ fontSize: 11 }}>{p.scope_type}{p.scope_id ? `:${p.scope_id}` : ''}</span> },
    { key: 'balance', header: 'Balance', align: 'right', render: (p) => <Money value={Number(p.balance)} /> },
    { key: 'actions', header: '', align: 'right', render: (p) => <Btn size="sm" variant="ghost" onClick={() => setTopup({ pool: p, amount: '' })}>Top up</Btn> },
  ];

  return (
    <>
      <PageHead title="Credit Pools" subtitle="Prepaid credit allocation" actions={<Btn variant="primary" size="sm" onClick={() => setCreating(true)}><Icon name="plus" /> New pool</Btn>} />

      <Card>
        <CardBody flush>
          {pools.isLoading ? <div style={{ padding: 14, color: 'var(--fg-2)' }}>Loading…</div> : <DataTable columns={cols} rows={pools.data?.data ?? []} rowKey={(p) => p.id} empty="No credit pools." />}
        </CardBody>
      </Card>

      <Drawer
        open={creating}
        onClose={() => setCreating(false)}
        title="New credit pool"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setCreating(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={() => create.mutate()} disabled={!form.name || create.isPending}>Create</Btn>
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
          {form.scope_type !== 'global' && <Field label="Scope id"><input className="input" value={form.scope_id} onChange={(e) => setForm({ ...form, scope_id: e.target.value })} aria-label="Scope id" /></Field>}
          <Field label="Initial balance"><input className="input" type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} aria-label="Balance" /></Field>
        </div>
      </Drawer>

      <Drawer
        open={!!topup}
        onClose={() => setTopup(null)}
        title={`Top up · ${topup?.pool.name ?? ''}`}
        sub={topup ? `Balance ${fmtUsd(Number(topup.pool.balance))}` : undefined}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setTopup(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={() => doTopup.mutate()} disabled={!topup?.amount || Number(topup?.amount) <= 0 || doTopup.isPending}>Top up</Btn>
          </>
        }
      >
        <Field label="Amount"><input className="input" type="number" value={topup?.amount ?? ''} onChange={(e) => topup && setTopup({ ...topup, amount: e.target.value })} aria-label="Top-up amount" /></Field>
      </Drawer>
    </>
  );
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/apiClient';
import { PageHead } from '../layout/AppShell';
import { Card, CardBody, Badge, Btn, Drawer, ConfirmModal, Field } from '../components/ui';
import { DataTable, type Column } from '../components/DataTable';
import { useToast } from '../components/Toast';
import { Icon } from '../lib/icons';

type Policy = {
  id: number;
  name: string;
  scope_type: string;
  scope_id: string | null;
  min_cost: number | null;
  model_match: string | null;
  action: string;
  action_param: string | null;
  priority: number;
  enabled: boolean;
};

const SCOPES = ['global', 'tenant', 'user', 'cost_center', 'provider', 'model', 'agent', 'purpose'];
const ACTIONS = ['block', 'require_approval', 'downgrade', 'throttle', 'queue', 'allow'];
const emptyForm = { name: '', scope_type: 'global', scope_id: '', min_cost: '', model_match: '', action: 'block', action_param: '', priority: '100' };

const ACTION_TONE: Record<string, 'red' | 'yellow' | 'blue' | 'muted' | 'green'> = {
  block: 'red',
  require_approval: 'yellow',
  downgrade: 'blue',
  throttle: 'yellow',
  queue: 'muted',
  allow: 'green',
};

export function Policies() {
  const qc = useQueryClient();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [toDelete, setToDelete] = useState<Policy | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['policies'], queryFn: () => api.get<{ data: Policy[] }>('/policies') });

  const create = useMutation({
    mutationFn: () =>
      api.post('/policies', {
        name: form.name,
        scope_type: form.scope_type,
        scope_id: form.scope_type === 'global' ? null : form.scope_id,
        min_cost: form.min_cost ? Number(form.min_cost) : null,
        model_match: form.model_match || null,
        action: form.action,
        action_param: form.action_param || null,
        priority: Number(form.priority),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['policies'] });
      setCreating(false);
      setForm(emptyForm);
      toast('Policy created', { kind: 'success' });
    },
    onError: (e) => toast('Could not create policy', { kind: 'error', message: e instanceof ApiError ? e.message : undefined }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.del(`/policies/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['policies'] });
      setToDelete(null);
      toast('Policy deleted', { kind: 'success' });
    },
  });

  const columns: Column<Policy>[] = [
    { key: 'priority', header: 'Prio', mono: true },
    { key: 'name', header: 'Name' },
    { key: 'scope', header: 'Scope', render: (p) => <span className="mono" style={{ fontSize: 11 }}>{p.scope_type}{p.scope_id ? `:${p.scope_id}` : ''}</span> },
    { key: 'cond', header: 'When', render: (p) => <span style={{ fontSize: 11, color: 'var(--fg-2)' }}>{[p.min_cost != null ? `cost ≥ ${p.min_cost}` : '', p.model_match ? `model=${p.model_match}` : ''].filter(Boolean).join(', ') || 'any'}</span> },
    { key: 'action', header: 'Action', render: (p) => <Badge tone={ACTION_TONE[p.action] ?? 'muted'}>{p.action}{p.action_param ? `→${p.action_param}` : ''}</Badge> },
    { key: 'actions', header: '', align: 'right', render: (p) => <button className="iconbtn" aria-label="Delete policy" onClick={() => setToDelete(p)}><Icon name="x" /></button> },
  ];

  return (
    <>
      <PageHead title="Policies" subtitle="Declarative spend policies" actions={<Btn variant="primary" size="sm" onClick={() => setCreating(true)}><Icon name="plus" /> New policy</Btn>} />

      <Card>
        <CardBody flush>
          {isLoading ? <div style={{ padding: 14, color: 'var(--fg-2)' }}>Loading…</div> : <DataTable columns={columns} rows={data?.data ?? []} rowKey={(p) => p.id} empty="No policies yet." />}
        </CardBody>
      </Card>

      <Drawer
        open={creating}
        onClose={() => setCreating(false)}
        title="New policy"
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
          <Field label="Min cost (optional)"><input className="input" type="number" value={form.min_cost} onChange={(e) => setForm({ ...form, min_cost: e.target.value })} aria-label="Min cost" /></Field>
          <Field label="Model match (optional)"><input className="input" value={form.model_match} onChange={(e) => setForm({ ...form, model_match: e.target.value })} aria-label="Model match" /></Field>
          <Field label="Action">
            <select className="select" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} aria-label="Action">
              {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
          {form.action === 'downgrade' && <Field label="Downgrade to model"><input className="input" value={form.action_param} onChange={(e) => setForm({ ...form, action_param: e.target.value })} aria-label="Action param" /></Field>}
          <Field label="Priority"><input className="input" type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} aria-label="Priority" /></Field>
        </div>
      </Drawer>

      <ConfirmModal open={!!toDelete} title="Delete policy" message={`Delete "${toDelete?.name}"?`} confirmLabel="Delete" onCancel={() => setToDelete(null)} onConfirm={() => toDelete && remove.mutate(toDelete.id)} />
    </>
  );
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/apiClient';
import { PageHead } from '../layout/AppShell';
import { Card, CardHead, CardBody, Btn, Drawer, Field, Badge, ConfirmModal } from '../components/ui';
import { DataTable, type Column } from '../components/DataTable';
import { useToast } from '../components/Toast';
import { Icon } from '../lib/icons';

type Window = {
  id: number;
  provider: string;
  label: string;
  starts_at: string | null;
  ends_at: string | null;
  enabled: boolean;
  tenant_id: string | null;
  model: string | null;
  note: string | null;
};

const emptyForm = { provider: '', label: '', starts_at: '', ends_at: '', model: '', tenant_id: '', note: '' };

function isActive(w: Window): boolean {
  if (!w.enabled) return false;
  const now = Date.now();
  if (w.starts_at && new Date(w.starts_at).getTime() > now) return false;
  if (w.ends_at && new Date(w.ends_at).getTime() < now) return false;
  return true;
}

export function Subscriptions() {
  const qc = useQueryClient();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [endingId, setEndingId] = useState<number | null>(null);

  const windows = useQuery({ queryKey: ['subscription-windows'], queryFn: () => api.get<{ data: Window[] }>('/pricing/subscription-windows') });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['subscription-windows'] });
  };

  const create = useMutation({
    mutationFn: () =>
      api.post('/pricing/subscription-windows', {
        provider: form.provider,
        label: form.label,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        model: form.model || null,
        tenant_id: form.tenant_id || null,
        note: form.note || null,
        enabled: true,
      }),
    onSuccess: () => {
      invalidate();
      setCreating(false);
      setForm(emptyForm);
      toast('Subscription saved', { kind: 'success' });
    },
    onError: (e) => toast('Could not save subscription', { kind: 'error', message: e instanceof ApiError ? e.message : undefined }),
  });

  const endNow = useMutation({
    mutationFn: (w: Window) =>
      api.put(`/pricing/subscription-windows/${w.id}`, {
        provider: w.provider,
        label: w.label,
        ends_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      invalidate();
      toast('Subscription ended', { kind: 'success', message: 'Calls now priced normally' });
    },
    onError: () => toast('Could not end subscription', { kind: 'error' }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.del(`/pricing/subscription-windows/${id}`),
    onSuccess: () => {
      invalidate();
      setEndingId(null);
      toast('Subscription deleted', { kind: 'success' });
    },
    onError: () => toast('Could not delete', { kind: 'error' }),
  });

  const cols: Column<Window>[] = [
    { key: 'provider', header: 'Provider', mono: true },
    { key: 'label', header: 'Plan' },
    { key: 'state', header: 'State', render: (w) => (isActive(w) ? <Badge tone="green">covered · €0</Badge> : <Badge tone="muted">inactive</Badge>) },
    { key: 'starts_at', header: 'From', render: (w) => (w.starts_at ? new Date(w.starts_at).toLocaleDateString() : '—') },
    { key: 'ends_at', header: 'To', render: (w) => (w.ends_at ? new Date(w.ends_at).toLocaleDateString() : 'open') },
    { key: 'model', header: 'Scope', render: (w) => w.model ?? 'all models' },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (w) => (
        <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
          {isActive(w) && (
            <Btn size="sm" variant="ghost" onClick={() => endNow.mutate(w)} disabled={endNow.isPending} ariaLabel={`End ${w.label} now`}>
              End now
            </Btn>
          )}
          <Btn size="sm" variant="ghost" onClick={() => setEndingId(w.id)} ariaLabel={`Delete ${w.label}`}>
            <Icon name="x" />
          </Btn>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHead
        title="Subscriptions"
        subtitle="Flat-rate plans (canoni) — covered calls cost €0 while active"
        actions={
          <Btn variant="primary" size="sm" onClick={() => setCreating(true)}>
            <Icon name="plus" /> Add subscription
          </Btn>
        }
      />

      <Card>
        <CardHead title="Coverage windows" sub="Within an active window, calls to the provider are metered at €0 (tokens still tracked). Shorten “To” when the quota is spent." />
        <CardBody flush>
          <DataTable columns={cols} rows={windows.data?.data ?? []} rowKey={(w) => w.id} empty="No subscriptions — add a plan to meter covered calls at €0." />
        </CardBody>
      </Card>

      <Drawer
        open={creating}
        onClose={() => setCreating(false)}
        title="Add subscription (canone)"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setCreating(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={() => create.mutate()} disabled={!form.provider || !form.label || create.isPending}>Save</Btn>
          </>
        }
      >
        <div className="col" style={{ gap: 10 }}>
          <Field label="Provider"><input className="input" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} aria-label="Provider" placeholder="anthropic" /></Field>
          <Field label="Plan label"><input className="input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} aria-label="Plan label" placeholder="claude-max" /></Field>
          <Field label="From (optional)"><input className="input" type="date" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} aria-label="From" /></Field>
          <Field label="To (optional, blank = open)"><input className="input" type="date" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} aria-label="To" /></Field>
          <Field label="Model scope (optional, blank = all)"><input className="input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} aria-label="Model scope" /></Field>
          <Field label="Tenant scope (optional)"><input className="input" value={form.tenant_id} onChange={(e) => setForm({ ...form, tenant_id: e.target.value })} aria-label="Tenant scope" /></Field>
          <Field label="Note (optional)"><input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} aria-label="Note" /></Field>
        </div>
      </Drawer>

      <ConfirmModal
        open={endingId !== null}
        title="Delete subscription"
        message="Delete this coverage window? Calls to the provider will be priced normally."
        confirmLabel="Delete"
        onConfirm={() => endingId !== null && remove.mutate(endingId)}
        onCancel={() => setEndingId(null)}
      />
    </>
  );
}

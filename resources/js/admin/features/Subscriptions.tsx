import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/apiClient';
import { PageHead } from '../layout/AppShell';
import { Card, CardHead, CardBody, Btn, Drawer, Field, Badge, ConfirmModal } from '../components/ui';
import { DataTable, type Column } from '../components/DataTable';
import { useToast } from '../components/Toast';
import { Icon } from '../lib/icons';

type SubWindow = {
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

function isActive(w: SubWindow): boolean {
  if (!w.enabled) return false;
  const now = Date.now();
  if (w.starts_at && new Date(w.starts_at).getTime() > now) return false;
  if (w.ends_at && new Date(w.ends_at).getTime() < now) return false;
  return true;
}

const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : '');

export function Subscriptions() {
  const qc = useQueryClient();
  const toast = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm, enabled: true });
  const [endingId, setEndingId] = useState<number | null>(null);
  const [confirmEnd, setConfirmEnd] = useState<SubWindow | null>(null);

  const windows = useQuery({ queryKey: ['subscription-windows'], queryFn: () => api.get<{ data: SubWindow[] }>('/pricing/subscription-windows') });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['subscription-windows'] });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, enabled: true });
    setDrawerOpen(true);
  };

  const openEdit = (w: SubWindow) => {
    setEditingId(w.id);
    setForm({
      provider: w.provider,
      label: w.label,
      starts_at: toDateInput(w.starts_at),
      ends_at: toDateInput(w.ends_at),
      model: w.model ?? '',
      tenant_id: w.tenant_id ?? '',
      note: w.note ?? '',
      enabled: w.enabled,
    });
    setDrawerOpen(true);
  };

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        provider: form.provider,
        label: form.label,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        model: form.model || null,
        tenant_id: form.tenant_id || null,
        note: form.note || null,
        enabled: form.enabled,
      };
      return editingId === null
        ? api.post('/pricing/subscription-windows', payload)
        : api.put(`/pricing/subscription-windows/${editingId}`, payload);
    },
    onSuccess: () => {
      invalidate();
      setDrawerOpen(false);
      setEditingId(null);
      setForm({ ...emptyForm, enabled: true });
      toast('Subscription saved', { kind: 'success' });
    },
    onError: (e) => toast('Could not save subscription', { kind: 'error', message: e instanceof ApiError ? e.message : undefined }),
  });

  const endNow = useMutation({
    mutationFn: (w: SubWindow) =>
      api.put(`/pricing/subscription-windows/${w.id}`, {
        provider: w.provider,
        label: w.label,
        starts_at: w.starts_at,
        ends_at: new Date().toISOString(),
        enabled: w.enabled,
        model: w.model,
        tenant_id: w.tenant_id,
        note: w.note,
      }),
    onSuccess: () => {
      invalidate();
      setConfirmEnd(null);
      toast('Subscription ended', { kind: 'success', message: 'Calls now priced normally' });
    },
    onError: () => {
      setConfirmEnd(null);
      toast('Could not end subscription', { kind: 'error' });
    },
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

  const cols: Column<SubWindow>[] = [
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
            <Btn size="sm" variant="ghost" onClick={() => setConfirmEnd(w)} ariaLabel={`End ${w.label} now`}>
              End now
            </Btn>
          )}
          <Btn size="sm" variant="ghost" onClick={() => openEdit(w)} ariaLabel={`Edit ${w.label}`}>
            Edit
          </Btn>
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
          <Btn variant="primary" size="sm" onClick={openCreate}>
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
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId === null ? 'Add subscription (canone)' : 'Edit subscription'}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setDrawerOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={() => save.mutate()} disabled={!form.provider || !form.label || save.isPending}>Save</Btn>
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
          <label className="row" style={{ gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} aria-label="Enabled" />
            <span>Enabled</span>
          </label>
        </div>
      </Drawer>

      <ConfirmModal
        open={confirmEnd !== null}
        title="End subscription now"
        message="End this coverage window now? Calls to the provider will be priced normally (real cost) from this moment."
        confirmLabel="End now"
        onConfirm={() => confirmEnd !== null && endNow.mutate(confirmEnd)}
        onCancel={() => setConfirmEnd(null)}
      />

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

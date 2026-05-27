import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api, ApiError } from '../lib/apiClient';
import { PageHead } from '../layout/AppShell';
import { Card, CardHead, CardBody, Btn, Drawer, Field } from '../components/ui';
import { DataTable, type Column } from '../components/DataTable';
import { useToast } from '../components/Toast';
import { Icon } from '../lib/icons';

type ModelRow = { model: string; provider: string | null; input_cost_per_token: number | null; output_cost_per_token: number | null };
type Override = { id: number; model: string; provider: string | null; input_cost_per_token: number; output_cost_per_token: number; currency: string };

const emptyForm = { model: '', provider: '', input_cost_per_token: '', output_cost_per_token: '', currency: 'USD' };

export function Pricing() {
  const qc = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const models = useQuery({ queryKey: ['pricing', 'models', search], queryFn: () => api.get<{ data: ModelRow[]; count: number }>(`/pricing/models?search=${encodeURIComponent(search)}&limit=100`), placeholderData: keepPreviousData });
  const overrides = useQuery({ queryKey: ['pricing', 'overrides'], queryFn: () => api.get<{ data: Override[] }>('/pricing/overrides') });
  const status = useQuery({ queryKey: ['pricing', 'sync-status'], queryFn: () => api.get<{ synced_at: string | null; models: number }>('/pricing/sync/status') });

  const sync = useMutation({
    mutationFn: () => api.post<{ models: number }>('/pricing/sync'),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['pricing'] });
      toast('Pricing synced', { kind: 'success', message: `${r.models} models` });
    },
    onError: () => toast('Sync failed', { kind: 'error' }),
  });

  const addOverride = useMutation({
    mutationFn: () =>
      api.post('/pricing/overrides', {
        model: form.model,
        provider: form.provider || null,
        input_cost_per_token: Number(form.input_cost_per_token),
        output_cost_per_token: Number(form.output_cost_per_token),
        currency: form.currency,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing', 'overrides'] });
      setCreating(false);
      setForm(emptyForm);
      toast('Override saved', { kind: 'success' });
    },
    onError: (e) => toast('Could not save override', { kind: 'error', message: e instanceof ApiError ? e.message : undefined }),
  });

  const modelCols: Column<ModelRow>[] = [
    { key: 'model', header: 'Model', mono: true },
    { key: 'provider', header: 'Provider', render: (m) => m.provider ?? '—' },
    { key: 'input_cost_per_token', header: 'Input $/tok', align: 'right', render: (m) => <span className="mono">{m.input_cost_per_token ?? '—'}</span> },
    { key: 'output_cost_per_token', header: 'Output $/tok', align: 'right', render: (m) => <span className="mono">{m.output_cost_per_token ?? '—'}</span> },
  ];
  const overrideCols: Column<Override>[] = [
    { key: 'model', header: 'Model', mono: true },
    { key: 'provider', header: 'Provider', render: (o) => o.provider ?? 'any' },
    { key: 'input_cost_per_token', header: 'Input $/tok', align: 'right', render: (o) => <span className="mono">{o.input_cost_per_token}</span> },
    { key: 'output_cost_per_token', header: 'Output $/tok', align: 'right', render: (o) => <span className="mono">{o.output_cost_per_token}</span> },
  ];

  return (
    <>
      <PageHead
        title="Pricing"
        subtitle="LiteLLM mirror ⊕ local overrides"
        actions={
          <Btn variant="primary" size="sm" onClick={() => sync.mutate()} disabled={sync.isPending}>
            <Icon name="refresh-cw" /> Sync
          </Btn>
        }
      />

      <Card>
        <CardHead title="Models" sub={status.data ? `${status.data.models} models · synced ${status.data.synced_at ?? 'never'}` : undefined} actions={<input className="input sm" placeholder="search model" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search model" />} />
        <CardBody flush>
          {models.isLoading && !models.data ? <div style={{ padding: 14, color: 'var(--fg-2)' }}>Loading…</div> : <DataTable columns={modelCols} rows={models.data?.data ?? []} rowKey={(m) => `${m.model}:${m.provider ?? 'any'}`} empty="No models (sync pricing first)." />}
        </CardBody>
      </Card>

      <div style={{ marginTop: 14 }}>
        <Card>
          <CardHead title="Local overrides" sub="These win over the mirror" actions={<Btn size="sm" variant="ghost" onClick={() => setCreating(true)}><Icon name="plus" /> Add override</Btn>} />
          <CardBody flush>
            <DataTable columns={overrideCols} rows={overrides.data?.data ?? []} rowKey={(o) => o.id} empty="No overrides." />
          </CardBody>
        </Card>
      </div>

      <Drawer
        open={creating}
        onClose={() => setCreating(false)}
        title="Add price override"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setCreating(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={() => addOverride.mutate()} disabled={!form.model || !form.input_cost_per_token || !form.output_cost_per_token || addOverride.isPending}>Save</Btn>
          </>
        }
      >
        <div className="col" style={{ gap: 10 }}>
          <Field label="Model"><input className="input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} aria-label="Model" /></Field>
          <Field label="Provider (optional)"><input className="input" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} aria-label="Provider" /></Field>
          <Field label="Input $/token"><input className="input" type="number" step="any" value={form.input_cost_per_token} onChange={(e) => setForm({ ...form, input_cost_per_token: e.target.value })} aria-label="Input cost per token" /></Field>
          <Field label="Output $/token"><input className="input" type="number" step="any" value={form.output_cost_per_token} onChange={(e) => setForm({ ...form, output_cost_per_token: e.target.value })} aria-label="Output cost per token" /></Field>
        </div>
      </Drawer>
    </>
  );
}

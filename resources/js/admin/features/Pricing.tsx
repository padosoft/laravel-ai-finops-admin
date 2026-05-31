import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api, ApiError } from '../lib/apiClient';
import { PageHead } from '../layout/AppShell';
import { Card, CardHead, CardBody, Btn, Drawer, Field, Badge } from '../components/ui';
import { DataTable, type Column } from '../components/DataTable';
import { useToast } from '../components/Toast';
import { Icon } from '../lib/icons';

type ModelRow = {
  model: string;
  provider: string | null;
  input_cost_per_token: number | null;
  output_cost_per_token: number | null;
  source: string | null;
};
type Override = {
  id: number;
  model: string;
  provider: string | null;
  input_cost_per_token: number;
  output_cost_per_token: number;
  currency: string;
  unit?: string;
};
type SourceStatus = { name: string; synced_at: string | null; models: number };
type SyncStatus = { synced_at: string | null; models: number; sources?: SourceStatus[]; has_openrouter_key?: boolean };

const emptyForm = {
  model: '',
  provider: '',
  input_cost_per_token: '',
  output_cost_per_token: '',
  unit: 'per_token',
  currency: 'USD',
  effective_from: '',
  note: '',
};

const SOURCE_TONE: Record<string, 'green' | 'red' | 'yellow' | 'blue' | 'muted'> = {
  litellm: 'blue',
  openrouter: 'yellow',
  manual: 'green',
};

export function Pricing() {
  const qc = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const models = useQuery({
    queryKey: ['pricing', 'models', search, sourceFilter],
    queryFn: () => {
      const params = new URLSearchParams({ search, limit: '100' });
      if (sourceFilter) params.set('source', sourceFilter);
      return api.get<{ data: ModelRow[]; count: number }>(`/pricing/models?${params}`);
    },
    placeholderData: keepPreviousData,
  });
  const overrides = useQuery({ queryKey: ['pricing', 'overrides'], queryFn: () => api.get<{ data: Override[] }>('/pricing/overrides') });
  const status = useQuery({ queryKey: ['pricing', 'sync-status'], queryFn: () => api.get<SyncStatus>('/pricing/sync/status') });

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
        unit: form.unit,
        currency: form.currency,
        effective_from: form.effective_from || null,
        note: form.note || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing', 'overrides'] });
      setCreating(false);
      setForm(emptyForm);
      toast('Override saved', { kind: 'success' });
    },
    onError: (e) => toast('Could not save override', { kind: 'error', message: e instanceof ApiError ? e.message : undefined }),
  });

  const sourceBadge = (name: string | null) =>
    name ? <Badge tone={SOURCE_TONE[name] ?? 'muted'}>{name}</Badge> : <span>—</span>;

  const modelCols: Column<ModelRow>[] = [
    { key: 'model', header: 'Model', mono: true },
    { key: 'provider', header: 'Provider', render: (m) => m.provider ?? '—' },
    { key: 'source', header: 'Source', render: (m) => sourceBadge(m.source) },
    { key: 'input_cost_per_token', header: 'Input $/tok', align: 'right', render: (m) => <span className="mono">{m.input_cost_per_token ?? '—'}</span> },
    { key: 'output_cost_per_token', header: 'Output $/tok', align: 'right', render: (m) => <span className="mono">{m.output_cost_per_token ?? '—'}</span> },
  ];
  const overrideCols: Column<Override>[] = [
    { key: 'model', header: 'Model', mono: true },
    { key: 'provider', header: 'Provider', render: (o) => o.provider ?? 'any' },
    { key: 'input_cost_per_token', header: 'Input', align: 'right', render: (o) => <span className="mono">{o.input_cost_per_token}</span> },
    { key: 'output_cost_per_token', header: 'Output', align: 'right', render: (o) => <span className="mono">{o.output_cost_per_token}</span> },
    { key: 'unit', header: 'Unit', render: (o) => <span className="mono">{o.unit ?? 'per_token'}</span> },
    { key: 'currency', header: 'Cur', render: (o) => o.currency },
  ];

  const sources = status.data?.sources ?? [];
  const statusSub = status.data
    ? sources.length > 0
      ? sources.map((s) => `${s.name}: ${s.models} (${s.synced_at ? new Date(s.synced_at).toLocaleString() : 'never'})`).join(' · ')
      : `${status.data.models} models · synced ${status.data.synced_at ?? 'never'}`
    : undefined;

  return (
    <>
      <PageHead
        title="Pricing"
        subtitle="LiteLLM ⊕ OpenRouter ⊕ manual (override wins)"
        actions={
          <Btn variant="primary" size="sm" onClick={() => sync.mutate()} disabled={sync.isPending}>
            <Icon name="refresh-cw" /> Sync all
          </Btn>
        }
      />

      <Card>
        <CardHead
          title="Models"
          sub={statusSub}
          actions={
            <div className="row" style={{ gap: 8 }}>
              {status.data?.has_openrouter_key !== undefined && (
                <Badge tone={status.data.has_openrouter_key ? 'green' : 'muted'}>
                  {status.data.has_openrouter_key ? 'OpenRouter key set' : 'no OpenRouter key'}
                </Badge>
              )}
              <select className="input sm" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} aria-label="Filter by source">
                <option value="">all sources</option>
                <option value="litellm">litellm</option>
                <option value="openrouter">openrouter</option>
                <option value="manual">manual</option>
              </select>
              <input className="input sm" placeholder="search model" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search model" />
            </div>
          }
        />
        <CardBody flush>
          {models.isLoading && !models.data ? (
            <div style={{ padding: 14, color: 'var(--fg-2)' }}>Loading…</div>
          ) : (
            <DataTable columns={modelCols} rows={models.data?.data ?? []} rowKey={(m) => `${m.model}:${m.provider ?? 'any'}:${m.source ?? ''}`} empty="No models (sync pricing first)." />
          )}
        </CardBody>
      </Card>

      <div style={{ marginTop: 14 }}>
        <Card>
          <CardHead title="Local overrides" sub="Manual prices — these win over the feeds (regolo: EUR / per-1M)" actions={<Btn size="sm" variant="ghost" onClick={() => setCreating(true)}><Icon name="plus" /> Add price</Btn>} />
          <CardBody flush>
            <DataTable columns={overrideCols} rows={overrides.data?.data ?? []} rowKey={(o) => o.id} empty="No overrides." />
          </CardBody>
        </Card>
      </div>

      <Drawer
        open={creating}
        onClose={() => setCreating(false)}
        title="Add price (manual)"
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
          <Field label="Input cost"><input className="input" type="number" step="any" value={form.input_cost_per_token} onChange={(e) => setForm({ ...form, input_cost_per_token: e.target.value })} aria-label="Input cost" /></Field>
          <Field label="Output cost"><input className="input" type="number" step="any" value={form.output_cost_per_token} onChange={(e) => setForm({ ...form, output_cost_per_token: e.target.value })} aria-label="Output cost" /></Field>
          <Field label="Unit">
            <select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} aria-label="Unit">
              <option value="per_token">per token</option>
              <option value="per_million">per 1M tokens</option>
            </select>
          </Field>
          <Field label="Currency">
            <select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} aria-label="Currency">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </Field>
          <Field label="Effective from (optional)"><input className="input" type="date" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} aria-label="Effective from" /></Field>
          <Field label="Note (optional)"><input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} aria-label="Note" /></Field>
        </div>
      </Drawer>
    </>
  );
}

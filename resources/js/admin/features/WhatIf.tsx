import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import { fmtUsd } from '../lib/format';
import { PageHead } from '../layout/AppShell';
import { Card, CardHead, CardBody, Kpi, Btn, Field } from '../components/ui';
import { DataTable, type Column } from '../components/DataTable';
import { useToast } from '../components/Toast';

type SimResult = { from_model: string; to_model: string; calls: number; current_cost: number; projected_cost: number | null; savings: number | null; priced: boolean; message: string | null; currency: string };
type Scenario = { id: number; name: string; result: SimResult | null };

export function WhatIf() {
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState({ from_model: '', to_model: '', days: '30', name: '' });
  const [result, setResult] = useState<SimResult | null>(null);

  const scenarios = useQuery({ queryKey: ['whatif', 'scenarios'], queryFn: () => api.get<{ data: Scenario[] }>('/whatif/scenarios') });

  const simulate = useMutation({
    mutationFn: () => api.post<SimResult>('/whatif/simulate', { from_model: form.from_model, to_model: form.to_model, days: Number(form.days) }),
    onSuccess: (r) => setResult(r),
    onError: () => toast('Simulation failed', { kind: 'error' }),
  });

  const save = useMutation({
    mutationFn: () => api.post('/whatif/scenarios', { name: form.name, from_model: form.from_model, to_model: form.to_model, days: Number(form.days) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatif', 'scenarios'] });
      toast('Scenario saved', { kind: 'success' });
    },
  });

  const cols: Column<Scenario>[] = [
    { key: 'name', header: 'Scenario' },
    { key: 'savings', header: 'Savings', align: 'right', render: (s) => (s.result?.savings != null ? <span className="mono tnum">{fmtUsd(s.result.savings)}</span> : '—') },
  ];

  return (
    <>
      <PageHead title="What-if Simulator" subtitle="Replay traffic re-priced on another model" />

      <Card>
        <CardHead title="Simulate a model switch" />
        <CardBody>
          <div className="row" style={{ gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Field label="From model"><input className="input" value={form.from_model} onChange={(e) => setForm({ ...form, from_model: e.target.value })} aria-label="From model" /></Field>
            <Field label="To model"><input className="input" value={form.to_model} onChange={(e) => setForm({ ...form, to_model: e.target.value })} aria-label="To model" /></Field>
            <Field label="Days"><input className="input" type="number" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} aria-label="Days" style={{ width: 90 }} /></Field>
            <Btn variant="primary" onClick={() => simulate.mutate()} disabled={!form.from_model || !form.to_model || simulate.isPending}>Simulate</Btn>
          </div>

          {result && (
            <div className="kpi-grid cols-4" style={{ marginTop: 16 }} data-testid="whatif-result">
              <Kpi icon="activity" label="Calls" value={String(result.calls)} />
              <Kpi icon="dollar-sign" label="Current" value={fmtUsd(result.current_cost)} sub={result.currency} />
              <Kpi icon="dollar-sign" label="Projected" value={result.priced ? fmtUsd(result.projected_cost ?? 0) : '—'} />
              <Kpi icon="trending-down" label="Savings" value={result.priced ? fmtUsd(result.savings ?? 0) : 'n/a'} tone={result.priced && (result.savings ?? 0) > 0 ? 'green' : 'yellow'} />
            </div>
          )}
          {result && !result.priced && <div style={{ marginTop: 8, color: 'var(--yellow)', fontSize: 12 }}>{result.message}</div>}

          {result && (
            <div className="row" style={{ gap: 8, marginTop: 12 }}>
              <input className="input sm" placeholder="scenario name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Scenario name" />
              <Btn size="sm" variant="ghost" onClick={() => save.mutate()} disabled={!form.name || save.isPending}>Save scenario</Btn>
            </div>
          )}
        </CardBody>
      </Card>

      <div style={{ marginTop: 14 }}>
        <Card>
          <CardHead title="Saved scenarios" />
          <CardBody flush>
            <DataTable columns={cols} rows={scenarios.data?.data ?? []} rowKey={(s) => s.id} empty="No saved scenarios." />
          </CardBody>
        </Card>
      </div>
    </>
  );
}

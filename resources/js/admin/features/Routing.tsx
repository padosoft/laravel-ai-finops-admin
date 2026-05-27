import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import { PageHead } from '../layout/AppShell';
import { Card, CardHead, CardBody, Btn, Field, Badge } from '../components/ui';
import { DataTable, type Column } from '../components/DataTable';
import { useToast } from '../components/Toast';

type Rule = { id: number; name: string; scope_type: string; scope_id: string | null; candidates: string[]; min_quality: number | null };
type Candidate = { model: string; cost_metric: number | null; quality: number | null; eligible: boolean };
type SimResult = { recommended: string | null; min_quality: number | null; candidates: Candidate[] };

export function Routing() {
  const toast = useToast();
  const [form, setForm] = useState({ candidates: '', min_quality: '' });
  const [result, setResult] = useState<SimResult | null>(null);

  const rules = useQuery({ queryKey: ['routing', 'rules'], queryFn: () => api.get<{ data: Rule[] }>('/routing/rules') });
  const scores = useQuery({ queryKey: ['routing', 'quality'], queryFn: () => api.get<{ enabled: boolean; scores: Record<string, number> }>('/routing/quality-scores') });

  const simulate = useMutation({
    mutationFn: () =>
      api.post<SimResult>('/routing/simulate', {
        candidates: form.candidates.split(',').map((s) => s.trim()).filter(Boolean),
        min_quality: form.min_quality ? Number(form.min_quality) : null,
      }),
    onSuccess: (r) => setResult(r),
    onError: () => toast('Simulation failed', { kind: 'error' }),
  });

  const ruleCols: Column<Rule>[] = [
    { key: 'name', header: 'Name' },
    { key: 'scope', header: 'Scope', render: (r) => <span className="mono" style={{ fontSize: 11 }}>{r.scope_type}{r.scope_id ? `:${r.scope_id}` : ''}</span> },
    { key: 'candidates', header: 'Candidates', render: (r) => <span className="mono" style={{ fontSize: 11 }}>{r.candidates.join(' → ')}</span> },
    { key: 'min_quality', header: 'Min quality', align: 'right', render: (r) => (r.min_quality != null ? r.min_quality : '—') },
  ];
  const candCols: Column<Candidate>[] = [
    { key: 'model', header: 'Model', mono: true, render: (c) => <span className="mono">{c.model}{result?.recommended === c.model ? ' ★' : ''}</span> },
    { key: 'cost_metric', header: '$/tok (in+out)', align: 'right', render: (c) => <span className="mono">{c.cost_metric ?? '—'}</span> },
    { key: 'quality', header: 'Quality', align: 'right', render: (c) => (c.quality != null ? c.quality : '—') },
    { key: 'eligible', header: '', render: (c) => <Badge tone={c.eligible ? 'green' : 'muted'}>{c.eligible ? 'eligible' : 'below bar'}</Badge> },
  ];

  return (
    <>
      <PageHead title="Cost-aware Routing" subtitle="Cheapest model that clears a quality bar" />

      <Card>
        <CardHead title="Quality-per-dollar simulator" sub={scores.data ? `eval-harness ${scores.data.enabled ? 'connected' : 'not wired'} · ${Object.keys(scores.data.scores).length} scores` : undefined} />
        <CardBody>
          <div className="row" style={{ gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Field label="Candidate models (comma-sep)"><input className="input" value={form.candidates} onChange={(e) => setForm({ ...form, candidates: e.target.value })} aria-label="Candidates" style={{ minWidth: 320 }} /></Field>
            <Field label="Min quality (0..1)"><input className="input" type="number" step="0.01" value={form.min_quality} onChange={(e) => setForm({ ...form, min_quality: e.target.value })} aria-label="Min quality" style={{ width: 120 }} /></Field>
            <Btn variant="primary" onClick={() => simulate.mutate()} disabled={!form.candidates || simulate.isPending}>Recommend</Btn>
          </div>

          {result && (
            <div style={{ marginTop: 14 }} data-testid="routing-result">
              <div style={{ marginBottom: 8 }}>Recommended: <strong className="mono">{result.recommended ?? '—'}</strong></div>
              <DataTable columns={candCols} rows={result.candidates} rowKey={(c) => c.model} empty="No candidates." />
            </div>
          )}
        </CardBody>
      </Card>

      <div style={{ marginTop: 14 }}>
        <Card>
          <CardHead title="Routing rules" />
          <CardBody flush>
            <DataTable columns={ruleCols} rows={rules.data?.data ?? []} rowKey={(r) => r.id} empty="No routing rules." />
          </CardBody>
        </Card>
      </div>
    </>
  );
}

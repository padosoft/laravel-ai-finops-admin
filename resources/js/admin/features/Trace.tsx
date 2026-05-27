import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import { fmtUsd, fmtCompact } from '../lib/format';
import { PageHead } from '../layout/AppShell';
import { Card, CardHead, CardBody, Kpi, Money, Btn, Bar } from '../components/ui';
import { DataTable, type Column } from '../components/DataTable';

type Span = {
  id: number;
  agent_step: string | null;
  provider: string;
  model: string;
  cost_total: string | number;
  tokens_input: number;
  tokens_output: number;
};
type TraceResp = {
  trace_id: string;
  spans: Span[];
  totals: { calls: number; cost_total: number; tokens_input: number; tokens_output: number; currency: string };
  quality: Record<string, number>;
};

export function Trace() {
  const [traceId, setTraceId] = useState('');
  const [active, setActive] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['trace', active],
    queryFn: () => api.get<TraceResp>(`/usage/${encodeURIComponent(active)}/trace`),
    enabled: active.length > 0,
  });

  const maxCost = data ? Math.max(...data.spans.map((s) => Number(s.cost_total)), 0.000001) : 1;

  const columns: Column<Span>[] = [
    { key: 'agent_step', header: 'Step', render: (s) => s.agent_step ?? '—' },
    { key: 'model', header: 'Model', mono: true },
    {
      key: 'flame',
      header: 'Cost share',
      render: (s) => <div style={{ width: 160 }}><Bar pct={(Number(s.cost_total) / maxCost) * 100} tone="success" /></div>,
    },
    { key: 'tokens', header: 'Tokens', align: 'right', render: (s) => <span className="mono">{fmtCompact(s.tokens_input + s.tokens_output)}</span> },
    { key: 'cost_total', header: 'Cost', align: 'right', render: (s) => <Money value={Number(s.cost_total)} decimals={6} /> },
  ];

  return (
    <>
      <PageHead title="Call / Trace" subtitle="Per-step cost attribution for an agent run" />

      <Card>
        <CardBody>
          <form
            className="row"
            style={{ gap: 8 }}
            onSubmit={(e) => {
              e.preventDefault();
              setActive(traceId.trim());
            }}
          >
            <input className="input sm" placeholder="trace id (invocation id)" value={traceId} onChange={(e) => setTraceId(e.target.value)} aria-label="Trace id" style={{ flex: 1 }} />
            <Btn size="sm" variant="primary" type="submit">
              Load trace
            </Btn>
          </form>
        </CardBody>
      </Card>

      {active && isLoading && <div className="card"><CardBody>Loading trace…</CardBody></div>}
      {active && isError && <div className="card"><CardBody>No spans found for this trace.</CardBody></div>}

      {data && (
        <>
          <div className="kpi-grid cols-4" style={{ marginTop: 14 }}>
            <Kpi icon="flame" label="Spans" value={String(data.totals.calls)} />
            <Kpi icon="dollar-sign" label="Total cost" value={fmtUsd(data.totals.cost_total, 6)} sub={data.totals.currency} />
            <Kpi icon="zap" label="Tokens in" value={fmtCompact(data.totals.tokens_input)} />
            <Kpi icon="zap" label="Tokens out" value={fmtCompact(data.totals.tokens_output)} />
          </div>

          <div style={{ marginTop: 14 }}>
            <Card>
              <CardHead title="Cost flame-graph · per step" sub={data.trace_id} />
              <CardBody flush>
                <DataTable columns={columns} rows={data.spans} rowKey={(s) => s.id} empty="No spans." />
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </>
  );
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import { fmtUsd } from '../lib/format';
import { PageHead } from '../layout/AppShell';
import { Card, CardHead, CardBody, Kpi, Badge, Money, Btn } from '../components/ui';
import { DataTable, type Column } from '../components/DataTable';
import { useToast } from '../components/Toast';

type Forecast = { period: string; spent: number; projected: number; days_elapsed: number; days_in_period: number; currency: string };
type Anomaly = { day: string; cost: number; expected: number; severity: number | null; acked: boolean };

export function Forecast() {
  const qc = useQueryClient();
  const toast = useToast();
  const forecast = useQuery({ queryKey: ['forecast'], queryFn: () => api.get<Forecast>('/forecast') });
  const anomalies = useQuery({ queryKey: ['anomalies'], queryFn: () => api.get<{ data: Anomaly[] }>('/anomalies') });

  const ack = useMutation({
    mutationFn: (day: string) => api.post('/anomalies/ack', { day, acked_by: 'admin' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['anomalies'] });
      toast('Anomaly acknowledged', { kind: 'success' });
    },
    onError: () => toast('Could not acknowledge', { kind: 'error' }),
  });

  const cols: Column<Anomaly>[] = [
    { key: 'day', header: 'Day', mono: true },
    { key: 'cost', header: 'Cost', align: 'right', render: (a) => <Money value={Number(a.cost)} /> },
    { key: 'expected', header: 'Expected', align: 'right', render: (a) => <span className="mono">{fmtUsd(Number(a.expected))}</span> },
    { key: 'severity', header: 'σ', align: 'right', render: (a) => <span className="mono">{a.severity ?? '—'}</span> },
    { key: 'state', header: 'State', render: (a) => <Badge tone={a.acked ? 'muted' : 'red'}>{a.acked ? 'ACK' : 'OPEN'}</Badge> },
    { key: 'actions', header: '', align: 'right', render: (a) => (!a.acked ? <Btn size="sm" variant="ghost" onClick={() => ack.mutate(a.day)}>Ack</Btn> : null) },
  ];

  const f = forecast.data;

  return (
    <>
      <PageHead title="Forecast & Anomalies" subtitle="Run-rate projection + spike detection" />

      <div className="kpi-grid cols-4">
        <Kpi icon="dollar-sign" label="Spent (period)" value={f ? fmtUsd(f.spent) : '—'} />
        <Kpi icon="trending-up" label="Projected" value={f ? fmtUsd(f.projected) : '—'} sub={f?.currency} tone={f && f.projected > f.spent * 1.5 ? 'red' : 'green'} />
        <Kpi icon="activity" label="Days elapsed" value={f ? String(f.days_elapsed) : '—'} />
        <Kpi icon="activity" label="Days in period" value={f ? String(f.days_in_period) : '—'} />
      </div>

      <Card>
        <CardHead title="Anomalies" sub="Daily spend spikes (mean + k·σ)" />
        <CardBody flush>
          {anomalies.isLoading ? <div style={{ padding: 14, color: 'var(--fg-2)' }}>Loading…</div> : <DataTable columns={cols} rows={anomalies.data?.data ?? []} rowKey={(a) => a.day} empty="No anomalies detected." />}
        </CardBody>
      </Card>
    </>
  );
}

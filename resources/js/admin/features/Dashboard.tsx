import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import { fmtUsd, fmtUsdCompact, fmtCompact } from '../lib/format';
import { Icon } from '../lib/icons';
import { PageHead } from '../layout/AppShell';
import { Card, CardHead, CardBody, Kpi, Bar, Badge, Money } from '../components/ui';
import { LineChart, DonutChart } from '../components/charts';

type Kpis = {
  currency: string;
  cost_today: number;
  cost_month_to_date: number;
  cost_total: number;
  calls_total: number;
  tokens_total: number;
  avg_cost_per_call: number;
  models_count: number;
};
type TrendRow = { day: string; cost: number; calls: number };
type ModelRow = { model: string; cost: number; calls: number };
type Budget = { name: string; percent: number; state: string };
type Anomaly = { day: string; cost: number; expected: number; acked: boolean };

const DONUT_COLORS = ['var(--accent)', 'var(--purple)', 'var(--green)', 'var(--cyan)', 'var(--yellow)', 'var(--fg-3)'];

export function Dashboard() {
  const kpis = useQuery({ queryKey: ['dashboard', 'kpis'], queryFn: () => api.get<Kpis>('/dashboard/kpis') });
  const trend = useQuery({ queryKey: ['dashboard', 'spend-trend'], queryFn: () => api.get<{ data: TrendRow[] }>('/dashboard/spend-trend') });
  const models = useQuery({ queryKey: ['dashboard', 'top-models'], queryFn: () => api.get<{ data: ModelRow[] }>('/dashboard/top-models') });
  const budgets = useQuery({ queryKey: ['dashboard', 'budgets'], queryFn: () => api.get<{ data: Budget[] }>('/budgets') });
  const anomalies = useQuery({ queryKey: ['dashboard', 'anomalies'], queryFn: () => api.get<{ data: Anomaly[] }>('/anomalies') });

  const k = kpis.data;

  return (
    <>
      <PageHead
        title="Dashboard"
        subtitle="Realtime cost & policy overview"
        actions={
          <button className="btn primary sm" onClick={() => kpis.refetch()}>
            <Icon name="refresh-cw" /> Refresh
          </button>
        }
      />

      <div className="kpi-grid cols-6" data-testid="dashboard-kpis">
        <Kpi icon="dollar-sign" label="Spend Today" value={k ? fmtUsd(k.cost_today) : '—'} />
        <Kpi icon="wallet" label="Month-to-date" value={k ? fmtUsdCompact(k.cost_month_to_date) : '—'} />
        <Kpi icon="dollar-sign" label="Total" value={k ? fmtUsdCompact(k.cost_total) : '—'} sub={k?.currency} />
        <Kpi icon="activity" label="Calls" value={k ? fmtCompact(k.calls_total) : '—'} />
        <Kpi icon="zap" label="Tokens" value={k ? fmtCompact(k.tokens_total) : '—'} sub={k ? `avg ${fmtUsd(k.avg_cost_per_call, 4)}/call` : undefined} />
        <Kpi icon="tag" label="Models" value={k ? String(k.models_count) : '—'} />
      </div>

      <div style={{ marginTop: 14 }}>
        <Card>
          <CardHead title="Spend Trend" sub="Daily cost" />
          <CardBody>
            {trend.data && trend.data.data.length > 0 ? (
              <LineChart
                series={[{ values: trend.data.data.map((r) => Number(r.cost)), color: 'var(--accent)', fill: true }]}
                width={1200}
                height={240}
                yFormatter={(v) => '$' + (v / 1000).toFixed(1) + 'K'}
                xLabels={trend.data.data.map((r) => r.day.slice(5))}
              />
            ) : (
              <div style={{ color: 'var(--fg-2)' }}>No spend recorded yet.</div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="split-23" style={{ marginTop: 14 }}>
        <Card>
          <CardHead title="Top models · spend breakdown" />
          <CardBody>
            {models.data && models.data.data.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 18, alignItems: 'center' }}>
                <DonutChart
                  values={models.data.data.map((m) => Number(m.cost))}
                  colors={DONUT_COLORS}
                  size={150}
                  thickness={24}
                  centerValue={fmtUsdCompact(models.data.data.reduce((s, m) => s + Number(m.cost), 0))}
                  centerLabel="total"
                />
                <div className="col" style={{ gap: 6 }}>
                  {models.data.data.slice(0, 6).map((m, i) => (
                    <div className="row between" key={m.model} style={{ gap: 8 }}>
                      <div className="row" style={{ gap: 7, minWidth: 0 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.model}</span>
                      </div>
                      <div className="row" style={{ gap: 10, flexShrink: 0 }}>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{fmtCompact(m.calls)} calls</span>
                        <Money value={Number(m.cost)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--fg-2)' }}>No usage yet.</div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHead title="Budget burn" />
          <CardBody>
            <div className="col" style={{ gap: 12 }}>
              {budgets.data && budgets.data.data.length > 0 ? (
                budgets.data.data.slice(0, 6).map((b) => {
                  const tone = b.percent >= 100 ? 'danger' : b.percent >= 80 ? 'warn' : 'success';
                  return (
                    <div key={b.name}>
                      <div className="row between" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{b.name}</span>
                        <Badge tone={tone === 'danger' ? 'red' : tone === 'warn' ? 'yellow' : 'green'}>{b.percent.toFixed(0)}%</Badge>
                      </div>
                      <Bar pct={b.percent} tone={tone} />
                    </div>
                  );
                })
              ) : (
                <div style={{ color: 'var(--fg-2)' }}>No budgets configured.</div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <div style={{ marginTop: 14 }}>
        <Card>
          <CardHead title="Anomalies" sub="Daily spend spikes" />
          <CardBody flush>
            {anomalies.data && anomalies.data.data.length > 0 ? (
              anomalies.data.data.map((a) => (
                <div key={a.day} style={{ padding: '11px 14px', borderBottom: '1px solid var(--border-2)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                  <div className="row" style={{ gap: 8 }}>
                    <Badge tone={a.acked ? 'muted' : 'red'}>{a.acked ? 'ACK' : 'OPEN'}</Badge>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--fg-2)' }}>{a.day}</span>
                  </div>
                  <Money value={Number(a.cost)} />
                </div>
              ))
            ) : (
              <div style={{ padding: '14px', color: 'var(--fg-2)' }}>No anomalies detected.</div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import { fmtCompact } from '../lib/format';
import { PageHead } from '../layout/AppShell';
import { Card, CardHead, CardBody, Kpi } from '../components/ui';
import { LineChart } from '../components/charts';

type Summary = { tokens: number; energy_kwh: number; co2_grams: number; co2_kg: number };
type TrendRow = { day: string; tokens: number; energy_kwh: number; co2_grams: number };

export function Footprint() {
  const summary = useQuery({ queryKey: ['footprint', 'summary'], queryFn: () => api.get<Summary>('/footprint/summary') });
  const trend = useQuery({ queryKey: ['footprint', 'trend'], queryFn: () => api.get<{ data: TrendRow[] }>('/footprint/trend') });

  const s = summary.data;

  return (
    <>
      <PageHead title="CO₂ / ESG Footprint" subtitle="Estimated energy & emissions from AI usage" />

      <div className="kpi-grid cols-4">
        <Kpi icon="zap" label="Tokens" value={s ? fmtCompact(s.tokens) : '—'} />
        <Kpi icon="zap" label="Energy" value={s ? `${s.energy_kwh} kWh` : '—'} />
        <Kpi icon="leaf" label="CO₂" value={s ? `${s.co2_grams} g` : '—'} tone="green" />
        <Kpi icon="leaf" label="CO₂ (kg)" value={s ? `${s.co2_kg} kg` : '—'} tone="green" />
      </div>

      <Card>
        <CardHead title="Emissions trend" sub="Daily gCO₂e" />
        <CardBody>
          {trend.data && trend.data.data.length > 0 ? (
            <LineChart
              series={[{ values: trend.data.data.map((r) => Number(r.co2_grams)), color: 'var(--green)', fill: true }]}
              width={1200}
              height={220}
              yFormatter={(v) => `${v.toFixed(0)} g`}
              xLabels={trend.data.data.map((r) => r.day.slice(5))}
            />
          ) : (
            <div style={{ color: 'var(--fg-2)' }}>No usage recorded yet.</div>
          )}
        </CardBody>
      </Card>
    </>
  );
}

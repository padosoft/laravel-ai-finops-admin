import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import { fmtUsd, fmtUsdCompact, fmtCompact } from '../lib/format';
import { Icon } from '../lib/icons';
import { PageHead } from '../layout/AppShell';

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

function Kpi({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div className="kpi">
      <div className="kpi-label">
        <Icon name={icon} size={12} /> {label}
      </div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-delta flat">{sub}</div>}
    </div>
  );
}

export function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => api.get<Kpis>('/dashboard/kpis'),
  });

  return (
    <>
      <PageHead
        title="Dashboard"
        subtitle="Realtime cost & policy overview"
        actions={
          <button className="btn primary sm">
            <Icon name="download" /> Export
          </button>
        }
      />

      {isLoading && <div className="card"><div className="card-body">Loading…</div></div>}
      {isError && <div className="card"><div className="card-body">Failed to load KPIs.</div></div>}

      {data && (
        <div className="kpi-grid cols-6" data-testid="dashboard-kpis">
          <Kpi icon="dollar-sign" label="Spend Today" value={fmtUsd(data.cost_today)} />
          <Kpi icon="wallet" label="Month-to-date" value={fmtUsdCompact(data.cost_month_to_date)} />
          <Kpi icon="dollar-sign" label="Total" value={fmtUsdCompact(data.cost_total)} sub={data.currency} />
          <Kpi icon="activity" label="Calls" value={fmtCompact(data.calls_total)} />
          <Kpi icon="zap" label="Tokens" value={fmtCompact(data.tokens_total)} sub={`avg ${fmtUsd(data.avg_cost_per_call, 4)}/call`} />
          <Kpi icon="tag" label="Models" value={String(data.models_count)} />
        </div>
      )}
    </>
  );
}

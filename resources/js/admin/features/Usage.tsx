import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import { fmtUsd, fmtCompact } from '../lib/format';
import { PageHead } from '../layout/AppShell';
import { Card, CardBody, StatusBadge, Money, Drawer, Btn } from '../components/ui';
import { DataTable, type Column } from '../components/DataTable';

type UsageRow = {
  id: number;
  created_at: string | null;
  provider: string;
  model: string;
  status: string;
  tokens_input: number;
  tokens_output: number;
  cost_total: string | number;
  trace_id: string;
};
type Paginated = { data: UsageRow[]; current_page: number; last_page: number; total: number };

export function Usage() {
  const [filters, setFilters] = useState({ provider: '', model: '', status: '' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<UsageRow | null>(null);

  const qs = new URLSearchParams({ page: String(page), per_page: '25' });
  Object.entries(filters).forEach(([k, v]) => v && qs.set(k, v));

  const { data, isLoading } = useQuery({
    queryKey: ['usage', filters, page],
    queryFn: () => api.get<Paginated>(`/usage?${qs.toString()}`),
    placeholderData: keepPreviousData,
  });

  const columns: Column<UsageRow>[] = [
    { key: 'created_at', header: 'Time', render: (r) => <span className="mono">{r.created_at?.replace('T', ' ').slice(0, 19) ?? '—'}</span> },
    { key: 'provider', header: 'Provider' },
    { key: 'model', header: 'Model', mono: true },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'tokens', header: 'Tokens', align: 'right', render: (r) => <span className="mono">{fmtCompact(r.tokens_input + r.tokens_output)}</span> },
    { key: 'cost_total', header: 'Cost', align: 'right', render: (r) => <Money value={Number(r.cost_total)} decimals={6} /> },
  ];

  return (
    <>
      <PageHead title="Usage Explorer" subtitle="Every metered AI call" />

      <Card>
        <CardBody>
          <div className="row" style={{ gap: 8, marginBottom: 12 }} data-testid="usage-filters">
            {(['provider', 'model', 'status'] as const).map((f) => (
              <input
                key={f}
                className="input sm"
                placeholder={f}
                value={filters[f]}
                onChange={(e) => {
                  setPage(1);
                  setFilters((prev) => ({ ...prev, [f]: e.target.value }));
                }}
                aria-label={`Filter by ${f}`}
              />
            ))}
          </div>

          {isLoading && !data ? (
            <div style={{ color: 'var(--fg-2)' }}>Loading…</div>
          ) : (
            <DataTable columns={columns} rows={data?.data ?? []} rowKey={(r) => r.id} onRowClick={setSelected} empty="No calls match these filters." />
          )}

          {data && data.last_page > 1 && (
            <div className="row between" style={{ marginTop: 12 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>
                Page {data.current_page} / {data.last_page} · {fmtCompact(data.total)} calls
              </span>
              <div className="row" style={{ gap: 6 }}>
                <Btn size="sm" variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  Prev
                </Btn>
                <Btn size="sm" variant="ghost" onClick={() => setPage((p) => p + 1)} disabled={page >= data.last_page}>
                  Next
                </Btn>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={`Call #${selected?.id ?? ''}`} sub={selected ? `${selected.provider} · ${selected.model}` : undefined}>
        {selected && (
          <div className="col" style={{ gap: 10 }}>
            <Row label="Trace" value={<span className="mono">{selected.trace_id}</span>} />
            <Row label="Status" value={<StatusBadge status={selected.status} />} />
            <Row label="Tokens in / out" value={<span className="mono">{fmtCompact(selected.tokens_input)} / {fmtCompact(selected.tokens_output)}</span>} />
            <Row label="Cost" value={fmtUsd(Number(selected.cost_total), 6)} />
          </div>
        )}
      </Drawer>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="row between">
      <span style={{ color: 'var(--fg-2)', fontSize: 12 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

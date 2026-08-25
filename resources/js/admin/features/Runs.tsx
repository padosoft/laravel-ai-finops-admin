import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import { fmtUsd, fmtCompact, fmtDuration } from '../lib/format';
import { PageHead } from '../layout/AppShell';
import { Card, CardHead, CardBody, Kpi, Money, Badge, Btn, Bar, Drawer, LoadingState, ErrorState, EmptyState } from '../components/ui';
import { DataTable, type Column } from '../components/DataTable';

type RunRow = {
  invocation_id: string;
  agent: string | null;
  provider: string | null;
  model: string | null;
  parent_invocation_id: string | null;
  tenant_id: string | null;
  delegation_grant_id: string | null;
  steps: number | string;
  tools: number | string;
  failures: number | string;
  cost_total: number | string;
  duration_ms: number | string;
  ended_at: string | null;
};

type RunEvent = {
  id: number;
  kind: 'step' | 'tool';
  status: 'completed' | 'failed';
  step_number: number | null;
  is_final_step: boolean | null;
  tool_name: string | null;
  tool_invocation_id: string | null;
  provider: string | null;
  model: string | null;
  finish_reason: string | null;
  tokens_input: number;
  tokens_output: number;
  cost_total: number | string;
  duration_ms: number | null;
  error_class: string | null;
  error_message: string | null;
};

type Child = {
  invocation_id: string;
  agent: string | null;
  called_from_tool_invocation_id: string | null;
  cost_total: number | string;
  duration_ms: number | string;
  failures: number | string;
};

type RunDetail = {
  invocation_id: string;
  parent: { invocation_id: string; called_from_tool_invocation_id: string | null } | null;
  steps: RunEvent[];
  tools: RunEvent[];
  children: Child[];
  ledger: Array<{ id: number; status: string; cost_total: number | string; currency: string }>;
  totals: {
    steps: number;
    tools: number;
    failures: number;
    tokens_input: number;
    tokens_output: number;
    cost_total: number;
    duration_ms: number;
    currency: string;
  };
};

const num = (value: number | string | null | undefined): number => Number(value ?? 0);

/** "App\\Agents\\SupportAgent" -> "SupportAgent". */
const shortAgent = (agent: string | null): string | null => agent?.split('\\').pop() ?? null;

function OutcomeBadge({ status }: { status: 'completed' | 'failed' }) {
  return <Badge tone={status === 'failed' ? 'red' : 'green'}>{status}</Badge>;
}

/**
 * One run, opened from the list. Steps and tools are shown separately on
 * purpose: laravel/ai reports a tool invocation against the run, not against the
 * step that asked for it, so nesting a tool under a step would be a guess drawn
 * as a fact.
 */
function RunDrawer({ invocationId, onClose, onOpenRun }: { invocationId: string; onClose: () => void; onOpenRun: (id: string) => void }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['run', invocationId],
    queryFn: () => api.get<RunDetail>(`/runs/${encodeURIComponent(invocationId)}`),
  });

  const maxStepCost = data ? Math.max(...data.steps.map((s) => num(s.cost_total)), 0.000001) : 1;
  const maxToolMs = data ? Math.max(...data.tools.map((t) => num(t.duration_ms)), 1) : 1;

  const stepColumns: Column<RunEvent>[] = [
    { key: 'step_number', header: '#', render: (s) => <span className="mono">{s.step_number ?? '—'}</span> },
    { key: 'status', header: 'Outcome', render: (s) => <OutcomeBadge status={s.status} /> },
    { key: 'model', header: 'Model', mono: true, render: (s) => s.model ?? '—' },
    { key: 'finish_reason', header: 'Finish', render: (s) => s.finish_reason ?? (s.error_class ? <span title={s.error_message ?? undefined}>{s.error_class}</span> : '—') },
    { key: 'tokens', header: 'Tokens', align: 'right', render: (s) => <span className="mono">{fmtCompact(s.tokens_input + s.tokens_output)}</span> },
    { key: 'ms', header: 'Time', align: 'right', render: (s) => <span className="mono">{fmtDuration(s.duration_ms)}</span> },
    {
      key: 'share',
      header: 'Cost share',
      render: (s) => <div style={{ width: 140 }}><Bar pct={(num(s.cost_total) / maxStepCost) * 100} tone="success" /></div>,
    },
    { key: 'cost_total', header: 'Cost', align: 'right', render: (s) => <Money value={num(s.cost_total)} decimals={6} /> },
  ];

  const toolColumns: Column<RunEvent>[] = [
    { key: 'tool_name', header: 'Tool', mono: true, render: (t) => t.tool_name ?? '—' },
    { key: 'status', header: 'Outcome', render: (t) => <OutcomeBadge status={t.status} /> },
    {
      key: 'share',
      header: 'Time share',
      render: (t) => <div style={{ width: 140 }}><Bar pct={(num(t.duration_ms) / maxToolMs) * 100} tone={t.status === 'failed' ? 'danger' : 'warn'} /></div>,
    },
    { key: 'ms', header: 'Time', align: 'right', render: (t) => <span className="mono">{fmtDuration(t.duration_ms)}</span> },
    // A tool that threw after nine seconds is a different problem from one that
    // threw at once, so the error is shown next to the time it burned first.
    { key: 'error', header: 'Error', render: (t) => (t.error_class ? <span title={t.error_message ?? undefined}>{t.error_class}</span> : '—') },
  ];

  return (
    <Drawer open onClose={onClose} title="Agent run" sub={invocationId}>
      {isLoading && <LoadingState label="Loading run…" />}
      {isError && <ErrorState error={error} />}

      {data && (
        <>
          <div className="kpi-grid cols-4">
            <Kpi icon="git-branch" label="Steps" value={String(data.totals.steps)} />
            <Kpi icon="wrench" label="Tools" value={String(data.totals.tools)} />
            <Kpi icon="alert-triangle" label="Failures" value={String(data.totals.failures)} tone={data.totals.failures > 0 ? 'red' : undefined} />
            <Kpi icon="dollar-sign" label="Cost" value={fmtUsd(data.totals.cost_total, 6)} sub={data.totals.currency} />
          </div>

          {(data.parent || data.children.length > 0) && (
            <div style={{ marginTop: 14 }}>
              <Card>
                <CardHead title="Invocation chain" sub="Which run called this one, and which runs it called" />
                <CardBody>
                  {data.parent ? (
                    <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 10 }}>
                      <Badge tone="muted">called by</Badge>
                      <Btn size="sm" onClick={() => onOpenRun(data.parent!.invocation_id)}>{data.parent.invocation_id}</Btn>
                      {data.parent.called_from_tool_invocation_id && (
                        <span className="mono muted">via tool call {data.parent.called_from_tool_invocation_id}</span>
                      )}
                    </div>
                  ) : (
                    <div className="muted" style={{ marginBottom: 10 }}>This is a root run — nothing delegated to it.</div>
                  )}

                  {data.children.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {data.children.map((child) => (
                        <li key={child.invocation_id} style={{ marginBottom: 6 }}>
                          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                            <Btn size="sm" onClick={() => onOpenRun(child.invocation_id)}>{shortAgent(child.agent) ?? child.invocation_id}</Btn>
                            {child.called_from_tool_invocation_id && (
                              <span className="mono muted">from tool call {child.called_from_tool_invocation_id}</span>
                            )}
                            <Money value={num(child.cost_total)} decimals={6} />
                            {num(child.failures) > 0 && <Badge tone="red">{num(child.failures)} failed</Badge>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="muted">This run delegated to no other agent.</div>
                  )}
                </CardBody>
              </Card>
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <Card>
              <CardHead title="Steps" sub="Where the cost went, in order" />
              <CardBody flush>
                <DataTable columns={stepColumns} rows={data.steps} rowKey={(s) => s.id} empty="No steps recorded." />
              </CardBody>
            </Card>
          </div>

          <div style={{ marginTop: 14 }}>
            <Card>
              <CardHead title="Tools" sub="What the model called, and how long it waited" />
              <CardBody flush>
                <DataTable columns={toolColumns} rows={data.tools} rowKey={(t) => t.id} empty="This run called no tools." />
              </CardBody>
            </Card>
          </div>

          <div style={{ marginTop: 14 }}>
            <Card>
              <CardHead title="Ledger" sub="The priced rows billed against this run" />
              <CardBody flush>
                <DataTable
                  columns={[
                    { key: 'id', header: 'Row', mono: true, render: (r) => String(r.id) },
                    { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'failed' ? 'red' : 'muted'}>{r.status}</Badge> },
                    { key: 'cost_total', header: 'Cost', align: 'right', render: (r) => <Money value={num(r.cost_total)} decimals={6} /> },
                  ]}
                  rows={data.ledger}
                  rowKey={(r) => r.id}
                  empty="Nothing was billed against this run."
                />
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </Drawer>
  );
}

export function Runs() {
  const [failedOnly, setFailedOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['runs', failedOnly],
    queryFn: () => api.get<{ data: RunRow[] }>(`/runs${failedOnly ? '?failed_only=1' : ''}`),
  });

  const rows = data?.data ?? [];

  const columns: Column<RunRow>[] = [
    { key: 'agent', header: 'Agent', render: (r) => shortAgent(r.agent) ?? '—' },
    { key: 'invocation_id', header: 'Invocation', mono: true },
    {
      key: 'chain',
      header: 'Chain',
      // A run with a parent was delegated to by another agent's tool call.
      render: (r) => (r.parent_invocation_id ? <Badge tone="muted">delegated</Badge> : <Badge tone="green">root</Badge>),
    },
    { key: 'model', header: 'Model', mono: true, render: (r) => r.model ?? '—' },
    { key: 'steps', header: 'Steps', align: 'right', render: (r) => <span className="mono">{num(r.steps)}</span> },
    { key: 'tools', header: 'Tools', align: 'right', render: (r) => <span className="mono">{num(r.tools)}</span> },
    {
      key: 'failures',
      header: 'Failures',
      align: 'right',
      render: (r) => (num(r.failures) > 0 ? <Badge tone="red">{num(r.failures)}</Badge> : <span className="muted">0</span>),
    },
    { key: 'duration_ms', header: 'Time', align: 'right', render: (r) => <span className="mono">{fmtDuration(num(r.duration_ms))}</span> },
    { key: 'cost_total', header: 'Cost', align: 'right', render: (r) => <Money value={num(r.cost_total)} decimals={6} /> },
  ];

  return (
    <>
      <PageHead title="Agent Runs" subtitle="Per-step cost, tool timing, failures and the who-called-whom chain" />

      <Card>
        <CardBody>
          <div className="row" style={{ gap: 8 }}>
            <Btn size="sm" variant={failedOnly ? 'primary' : undefined} onClick={() => setFailedOnly((v) => !v)}>
              {failedOnly ? 'Showing runs with failures' : 'Show only runs with failures'}
            </Btn>
          </div>
        </CardBody>
      </Card>

      <div style={{ marginTop: 14 }}>
        <Card>
          <CardHead title="Recent runs" sub="Newest first — click a row to open the run" />
          <CardBody flush>
            {isLoading && <LoadingState label="Loading runs…" />}
            {isError && <ErrorState error={error} />}
            {!isLoading && !isError && rows.length === 0 && (
              <EmptyState
                title="No runs recorded yet"
                hint="Run events need laravel/ai ^0.11 and ai-finops.run_events.enabled."
              />
            )}
            {rows.length > 0 && (
              <DataTable columns={columns} rows={rows} rowKey={(r) => r.invocation_id} onRowClick={(r) => setOpen(r.invocation_id)} empty="No runs." />
            )}
          </CardBody>
        </Card>
      </div>

      {open && <RunDrawer invocationId={open} onClose={() => setOpen(null)} onOpenRun={(id) => setOpen(id)} />}
    </>
  );
}

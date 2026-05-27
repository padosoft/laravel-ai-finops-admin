import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import { PageHead } from '../layout/AppShell';
import { Card, CardBody, StatusBadge, Money, Btn } from '../components/ui';
import { DataTable, type Column } from '../components/DataTable';
import { useToast } from '../components/Toast';

type Approval = {
  id: number;
  provider: string;
  model: string;
  tenant_id: string | null;
  estimated_cost: number;
  currency: string;
  status: string;
  reason: string | null;
};
type Paginated = { data: Approval[]; total: number };

const STATUSES = ['pending', 'approved', 'rejected'];

export function Approvals() {
  const qc = useQueryClient();
  const toast = useToast();
  const [status, setStatus] = useState('pending');

  const { data, isLoading } = useQuery({ queryKey: ['approvals', status], queryFn: () => api.get<Paginated>(`/approvals?status=${status}`) });

  const decide = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'approve' | 'reject' }) => api.post(`/approvals/${id}/${action}`, { decided_by: 'admin' }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
      toast(`Approval ${v.action}d`, { kind: 'success' });
    },
    onError: () => toast('Action failed', { kind: 'error' }),
  });

  const columns: Column<Approval>[] = [
    { key: 'id', header: '#', mono: true },
    { key: 'provider', header: 'Provider' },
    { key: 'model', header: 'Model', mono: true },
    { key: 'tenant_id', header: 'Tenant', render: (a) => a.tenant_id ?? '—' },
    { key: 'estimated_cost', header: 'Est. cost', align: 'right', render: (a) => <Money value={Number(a.estimated_cost)} decimals={4} /> },
    { key: 'reason', header: 'Reason', render: (a) => <span style={{ color: 'var(--fg-2)', fontSize: 11 }}>{a.reason ?? '—'}</span> },
    { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (a) =>
        a.status === 'pending' ? (
          <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
            <Btn size="sm" variant="primary" onClick={() => decide.mutate({ id: a.id, action: 'approve' })}>Approve</Btn>
            <Btn size="sm" variant="ghost" onClick={() => decide.mutate({ id: a.id, action: 'reject' })}>Reject</Btn>
          </div>
        ) : null,
    },
  ];

  return (
    <>
      <PageHead title="Approvals" subtitle="Spend approval workflow" />
      <Card>
        <CardBody>
          <div className="row" style={{ gap: 8, marginBottom: 12 }}>
            {STATUSES.map((s) => (
              <button key={s} className={`btn sm ${status === s ? 'primary' : 'ghost'}`} onClick={() => setStatus(s)}>{s}</button>
            ))}
          </div>
          {isLoading ? <div style={{ color: 'var(--fg-2)' }}>Loading…</div> : <DataTable columns={columns} rows={data?.data ?? []} rowKey={(a) => a.id} empty={`No ${status} approvals.`} />}
        </CardBody>
      </Card>
    </>
  );
}

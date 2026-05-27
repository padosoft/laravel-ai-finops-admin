import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/apiClient';
import { PageHead } from '../layout/AppShell';
import { Card, CardHead, CardBody, Btn, Drawer, Field, Money } from '../components/ui';
import { DataTable, type Column } from '../components/DataTable';
import { useToast } from '../components/Toast';
import { Icon } from '../lib/icons';

type CostCenter = { id: number; code: string; name: string; owner: string | null; department: string | null };
type ReportRow = { cost_center: string; name: string | null; cost: number; calls: number };
type Report = { currency: string; total: number; data: ReportRow[] };

const emptyForm = { code: '', name: '', owner: '', department: '' };

export function Chargeback() {
  const qc = useQueryClient();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const centers = useQuery({ queryKey: ['cost-centers'], queryFn: () => api.get<{ data: CostCenter[] }>('/cost-centers') });
  const report = useQuery({ queryKey: ['chargeback', 'report'], queryFn: () => api.get<Report>('/chargeback/report') });

  const create = useMutation({
    mutationFn: () => api.post('/cost-centers', { code: form.code, name: form.name, owner: form.owner || null, department: form.department || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cost-centers'] });
      setCreating(false);
      setForm(emptyForm);
      toast('Cost center created', { kind: 'success' });
    },
    onError: (e) => toast('Could not create', { kind: 'error', message: e instanceof ApiError ? e.message : undefined }),
  });

  const reportCols: Column<ReportRow>[] = [
    { key: 'cost_center', header: 'Cost center', render: (r) => <span>{r.name ?? r.cost_center}</span> },
    { key: 'calls', header: 'Calls', align: 'right', mono: true },
    { key: 'cost', header: 'Cost', align: 'right', render: (r) => <Money value={Number(r.cost)} /> },
  ];
  const centerCols: Column<CostCenter>[] = [
    { key: 'code', header: 'Code', mono: true },
    { key: 'name', header: 'Name' },
    { key: 'owner', header: 'Owner', render: (c) => c.owner ?? '—' },
    { key: 'department', header: 'Department', render: (c) => c.department ?? '—' },
  ];

  return (
    <>
      <PageHead title="Chargeback / Showback" subtitle="Allocate AI spend to cost centers" actions={<Btn variant="primary" size="sm" onClick={() => setCreating(true)}><Icon name="plus" /> New cost center</Btn>} />

      <Card>
        <CardHead title="Allocation report" sub={report.data ? `Total ${report.data.total} ${report.data.currency}` : undefined} />
        <CardBody flush>
          {report.isLoading ? <div style={{ padding: 14, color: 'var(--fg-2)' }}>Loading…</div> : <DataTable columns={reportCols} rows={report.data?.data ?? []} rowKey={(r) => r.cost_center} empty="No spend to allocate." />}
        </CardBody>
      </Card>

      <div style={{ marginTop: 14 }}>
        <Card>
          <CardHead title="Cost centers" />
          <CardBody flush>
            <DataTable columns={centerCols} rows={centers.data?.data ?? []} rowKey={(c) => c.id} empty="No cost centers." />
          </CardBody>
        </Card>
      </div>

      <Drawer
        open={creating}
        onClose={() => setCreating(false)}
        title="New cost center"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setCreating(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={() => create.mutate()} disabled={!form.code || !form.name || create.isPending}>Create</Btn>
          </>
        }
      >
        <div className="col" style={{ gap: 10 }}>
          <Field label="Code"><input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} aria-label="Code" /></Field>
          <Field label="Name"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Name" /></Field>
          <Field label="Owner (optional)"><input className="input" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} aria-label="Owner" /></Field>
          <Field label="Department (optional)"><input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} aria-label="Department" /></Field>
        </div>
      </Drawer>
    </>
  );
}

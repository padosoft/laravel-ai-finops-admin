import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import { PageHead } from '../layout/AppShell';
import { Card, CardHead, CardBody, Badge, Btn, Field } from '../components/ui';
import { DataTable, type Column } from '../components/DataTable';
import { useToast } from '../components/Toast';

type SettingsResp = {
  enabled: boolean;
  metering: boolean;
  enforcement: boolean;
  kill_switch: boolean;
  currency: { base: string; display: string };
  retention_days: number;
  block_status: number;
};
type KillSwitch = { id: number; scope_type: string; scope_id: string | null; active: boolean; reason: string | null };

const KS_SCOPES = ['global', 'provider', 'tenant', 'feature'];

export function Settings() {
  const qc = useQueryClient();
  const toast = useToast();
  const [ksForm, setKsForm] = useState({ scope_type: 'provider', scope_id: '', active: true, reason: '' });

  const settings = useQuery({ queryKey: ['settings'], queryFn: () => api.get<SettingsResp>('/settings') });
  const kill = useQuery({ queryKey: ['settings', 'kill-switch'], queryFn: () => api.get<{ global_config: boolean; data: KillSwitch[] }>('/settings/kill-switch') });

  const setKs = useMutation({
    mutationFn: () => api.post('/settings/kill-switch', { scope_type: ksForm.scope_type, scope_id: ksForm.scope_id || null, active: ksForm.active, reason: ksForm.reason || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'kill-switch'] });
      setKsForm({ scope_type: 'provider', scope_id: '', active: true, reason: '' });
      toast('Kill switch updated', { kind: 'success' });
    },
    onError: () => toast('Update failed', { kind: 'error' }),
  });

  const s = settings.data;

  const ksCols: Column<KillSwitch>[] = [
    { key: 'scope_type', header: 'Scope' },
    { key: 'scope_id', header: 'Target', render: (k) => k.scope_id || '—' },
    { key: 'active', header: 'Active', render: (k) => <Badge tone={k.active ? 'red' : 'muted'}>{k.active ? 'ACTIVE' : 'off'}</Badge> },
    { key: 'reason', header: 'Reason', render: (k) => k.reason ?? '—' },
  ];

  function flag(on: boolean) {
    return <Badge tone={on ? 'green' : 'muted'}>{on ? 'on' : 'off'}</Badge>;
  }

  return (
    <>
      <PageHead title="Settings" subtitle="Runtime configuration snapshot" />

      <Card>
        <CardHead title="Runtime" />
        <CardBody>
          {s ? (
            <div className="col" style={{ gap: 8 }}>
              <div className="row between"><span>Enabled</span>{flag(s.enabled)}</div>
              <div className="row between"><span>Metering</span>{flag(s.metering)}</div>
              <div className="row between"><span>Enforcement</span>{flag(s.enforcement)}</div>
              <div className="row between"><span>Global kill switch (config)</span>{flag(s.kill_switch)}</div>
              <div className="row between"><span>Currency</span><span className="mono">{s.currency.base} → {s.currency.display}</span></div>
              <div className="row between"><span>Retention</span><span className="mono">{s.retention_days} days</span></div>
              <div className="row between"><span>Block status</span><span className="mono">{s.block_status}</span></div>
            </div>
          ) : (
            <div style={{ color: 'var(--fg-2)' }}>Loading…</div>
          )}
        </CardBody>
      </Card>

      <div style={{ marginTop: 14 }}>
        <Card>
          <CardHead title="Kill switches" sub="Emergency stop (scoped)" />
          <CardBody>
            <div className="row" style={{ gap: 8, marginBottom: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <Field label="Scope">
                <select className="select" value={ksForm.scope_type} onChange={(e) => setKsForm({ ...ksForm, scope_type: e.target.value })} aria-label="Kill switch scope">
                  {KS_SCOPES.map((sc) => <option key={sc} value={sc}>{sc}</option>)}
                </select>
              </Field>
              {ksForm.scope_type !== 'global' && <Field label="Target"><input className="input" value={ksForm.scope_id} onChange={(e) => setKsForm({ ...ksForm, scope_id: e.target.value })} aria-label="Kill switch target" /></Field>}
              <label className="row" style={{ gap: 6 }}><input type="checkbox" checked={ksForm.active} onChange={(e) => setKsForm({ ...ksForm, active: e.target.checked })} /> active</label>
              <Btn variant="primary" onClick={() => setKs.mutate()} disabled={setKs.isPending}>Apply</Btn>
            </div>
            <DataTable columns={ksCols} rows={kill.data?.data ?? []} rowKey={(k) => k.id} empty="No stored kill switches." />
          </CardBody>
        </Card>
      </div>
    </>
  );
}

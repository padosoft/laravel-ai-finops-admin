import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import { PageHead } from '../layout/AppShell';
import { Card, CardHead, CardBody, Btn, Badge } from '../components/ui';
import { DataTable, type Column } from '../components/DataTable';
import { useToast } from '../components/Toast';
import { Icon } from '../lib/icons';

type Subscription = { id: number; model: string; provider: string | null; enabled: boolean };
type Change = { model: string; provider: string | null; old_input: number; new_input: number; input_change_pct: number | null; captured_at: string | null };

export function PriceWatch() {
  const qc = useQueryClient();
  const toast = useToast();
  const [model, setModel] = useState('');

  const subs = useQuery({ queryKey: ['price-watch', 'subscriptions'], queryFn: () => api.get<{ data: Subscription[] }>('/price-watch/subscriptions') });
  const changes = useQuery({ queryKey: ['price-watch', 'changes'], queryFn: () => api.get<{ data: Change[] }>('/price-watch/changes') });

  const subscribe = useMutation({
    mutationFn: () => api.post('/price-watch/subscriptions', { model }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['price-watch', 'subscriptions'] });
      setModel('');
      toast('Watching model', { kind: 'success' });
    },
  });
  const unsubscribe = useMutation({
    mutationFn: (id: number) => api.del(`/price-watch/subscriptions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['price-watch', 'subscriptions'] }),
  });
  const capture = useMutation({
    mutationFn: () => api.post('/price-watch/capture'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['price-watch', 'changes'] });
      toast('Snapshot captured', { kind: 'success' });
    },
  });

  const changeCols: Column<Change>[] = [
    { key: 'model', header: 'Model', mono: true },
    { key: 'provider', header: 'Provider', render: (c) => c.provider ?? 'any' },
    { key: 'old_input', header: 'Old $/tok', align: 'right', render: (c) => <span className="mono">{c.old_input}</span> },
    { key: 'new_input', header: 'New $/tok', align: 'right', render: (c) => <span className="mono">{c.new_input}</span> },
    { key: 'pct', header: 'Δ%', align: 'right', render: (c) => (c.input_change_pct != null ? <Badge tone={c.input_change_pct <= 0 ? 'green' : 'red'}>{c.input_change_pct.toFixed(1)}%</Badge> : '—') },
  ];
  const subCols: Column<Subscription>[] = [
    { key: 'model', header: 'Model', mono: true },
    { key: 'provider', header: 'Provider', render: (s) => s.provider ?? 'any' },
    { key: 'actions', header: '', align: 'right', render: (s) => <button className="iconbtn" aria-label="Unsubscribe" onClick={() => unsubscribe.mutate(s.id)}><Icon name="x" /></button> },
  ];

  return (
    <>
      <PageHead title="Price Watcher" subtitle="Detect provider list-price changes" actions={<Btn variant="primary" size="sm" onClick={() => capture.mutate()} disabled={capture.isPending}><Icon name="refresh-cw" /> Capture now</Btn>} />

      <Card>
        <CardHead title="Recent changes" />
        <CardBody flush>
          {changes.isLoading ? <div style={{ padding: 14, color: 'var(--fg-2)' }}>Loading…</div> : <DataTable columns={changeCols} rows={changes.data?.data ?? []} rowKey={(c) => `${c.model}:${c.provider ?? 'any'}`} empty="No price changes detected yet." />}
        </CardBody>
      </Card>

      <div style={{ marginTop: 14 }}>
        <Card>
          <CardHead title="Watched models" actions={
            <form className="row" style={{ gap: 6 }} onSubmit={(e) => { e.preventDefault(); subscribe.mutate(); }}>
              <input className="input sm" placeholder="model" value={model} onChange={(e) => setModel(e.target.value)} aria-label="Model to watch" />
              <Btn size="sm" variant="ghost" type="submit" disabled={!model || subscribe.isPending}>Watch</Btn>
            </form>
          } />
          <CardBody flush>
            <DataTable columns={subCols} rows={subs.data?.data ?? []} rowKey={(s) => s.id} empty="No watched models." />
          </CardBody>
        </Card>
      </div>
    </>
  );
}

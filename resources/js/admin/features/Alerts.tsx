import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/apiClient';
import { PageHead } from '../layout/AppShell';
import { Card, CardHead, CardBody, Btn, Drawer, Field, Badge } from '../components/ui';
import { DataTable, type Column } from '../components/DataTable';
import { useToast } from '../components/Toast';
import { Icon } from '../lib/icons';

type Channel = { id: number; type: string; name: string; enabled: boolean; has_config: boolean };
type Rule = { id: number; name: string; budget_id: number; threshold_pct: number; channel_id: number | null; enabled: boolean };
type LogRow = { id: number; budget_id: number; percent: number; message: string; created_at: string | null };
type BudgetRow = { budget_id: number; name: string };

const CHANNEL_TYPES = ['mail', 'slack', 'teams', 'webhook', 'sms'];

export function Alerts() {
  const qc = useQueryClient();
  const toast = useToast();
  const [channelForm, setChannelForm] = useState({ type: 'mail', name: '', url: '' });
  const [ruleForm, setRuleForm] = useState({ name: '', budget_id: '', threshold_pct: '80', channel_id: '' });
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [creatingRule, setCreatingRule] = useState(false);

  const channels = useQuery({ queryKey: ['alerts', 'channels'], queryFn: () => api.get<{ data: Channel[] }>('/alerts/channels') });
  const rules = useQuery({ queryKey: ['alerts', 'rules'], queryFn: () => api.get<{ data: Rule[] }>('/alerts/rules') });
  const log = useQuery({ queryKey: ['alerts', 'log'], queryFn: () => api.get<{ data: LogRow[] }>('/alerts/log') });
  const budgets = useQuery({ queryKey: ['budgets'], queryFn: () => api.get<{ data: BudgetRow[] }>('/budgets') });

  const createChannel = useMutation({
    mutationFn: () => api.post('/alerts/channels', { type: channelForm.type, name: channelForm.name, config: channelForm.url ? { url: channelForm.url } : null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts', 'channels'] });
      setCreatingChannel(false);
      setChannelForm({ type: 'mail', name: '', url: '' });
      toast('Channel created', { kind: 'success' });
    },
    onError: (e) => toast('Could not create channel', { kind: 'error', message: e instanceof ApiError ? e.message : undefined }),
  });

  const testChannel = useMutation({
    mutationFn: (id: number) => api.post(`/alerts/channels/${id}/test`),
    onSuccess: () => toast('Test event fired', { kind: 'success' }),
  });

  const createRule = useMutation({
    mutationFn: () => api.post('/alerts/rules', { name: ruleForm.name, budget_id: Number(ruleForm.budget_id), threshold_pct: Number(ruleForm.threshold_pct), channel_id: ruleForm.channel_id ? Number(ruleForm.channel_id) : null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts', 'rules'] });
      setCreatingRule(false);
      setRuleForm({ name: '', budget_id: '', threshold_pct: '80', channel_id: '' });
      toast('Rule created', { kind: 'success' });
    },
    onError: (e) => toast('Could not create rule', { kind: 'error', message: e instanceof ApiError ? e.message : undefined }),
  });

  const channelCols: Column<Channel>[] = [
    { key: 'type', header: 'Type', render: (c) => <Badge tone="muted">{c.type}</Badge> },
    { key: 'name', header: 'Name' },
    { key: 'enabled', header: 'Enabled', render: (c) => <Badge tone={c.enabled ? 'green' : 'muted'}>{c.enabled ? 'on' : 'off'}</Badge> },
    { key: 'actions', header: '', align: 'right', render: (c) => <Btn size="sm" variant="ghost" onClick={() => testChannel.mutate(c.id)}>Test</Btn> },
  ];
  const ruleCols: Column<Rule>[] = [
    { key: 'name', header: 'Name' },
    { key: 'budget_id', header: 'Budget #', mono: true },
    { key: 'threshold_pct', header: 'Threshold', align: 'right', render: (r) => `${r.threshold_pct}%` },
    { key: 'channel_id', header: 'Channel', render: (r) => (r.channel_id ? `#${r.channel_id}` : 'log only') },
  ];
  const logCols: Column<LogRow>[] = [
    { key: 'created_at', header: 'Time', render: (l) => <span className="mono" style={{ fontSize: 11 }}>{l.created_at?.replace('T', ' ').slice(0, 19) ?? '—'}</span> },
    { key: 'message', header: 'Message' },
    { key: 'percent', header: '%', align: 'right', render: (l) => `${Number(l.percent).toFixed(0)}%` },
  ];

  return (
    <>
      <PageHead title="Alerts" subtitle="Budget threshold notifications" />

      <Card>
        <CardHead title="Channels" actions={<Btn size="sm" variant="ghost" onClick={() => setCreatingChannel(true)}><Icon name="plus" /> Channel</Btn>} />
        <CardBody flush>
          <DataTable columns={channelCols} rows={channels.data?.data ?? []} rowKey={(c) => c.id} empty="No channels." />
        </CardBody>
      </Card>

      <div style={{ marginTop: 14 }}>
        <Card>
          <CardHead title="Rules" actions={<Btn size="sm" variant="ghost" onClick={() => setCreatingRule(true)}><Icon name="plus" /> Rule</Btn>} />
          <CardBody flush>
            <DataTable columns={ruleCols} rows={rules.data?.data ?? []} rowKey={(r) => r.id} empty="No rules." />
          </CardBody>
        </Card>
      </div>

      <div style={{ marginTop: 14 }}>
        <Card>
          <CardHead title="Alert log" />
          <CardBody flush>
            <DataTable columns={logCols} rows={log.data?.data ?? []} rowKey={(l) => l.id} empty="No alerts fired yet." />
          </CardBody>
        </Card>
      </div>

      <Drawer
        open={creatingChannel}
        onClose={() => setCreatingChannel(false)}
        title="New channel"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setCreatingChannel(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={() => createChannel.mutate()} disabled={!channelForm.name || createChannel.isPending}>Create</Btn>
          </>
        }
      >
        <div className="col" style={{ gap: 10 }}>
          <Field label="Type">
            <select className="select" value={channelForm.type} onChange={(e) => setChannelForm({ ...channelForm, type: e.target.value })} aria-label="Channel type">
              {CHANNEL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Name"><input className="input" value={channelForm.name} onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })} aria-label="Channel name" /></Field>
          <Field label="Webhook/recipient URL (optional)"><input className="input" value={channelForm.url} onChange={(e) => setChannelForm({ ...channelForm, url: e.target.value })} aria-label="Channel url" /></Field>
        </div>
      </Drawer>

      <Drawer
        open={creatingRule}
        onClose={() => setCreatingRule(false)}
        title="New alert rule"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setCreatingRule(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={() => createRule.mutate()} disabled={!ruleForm.name || !ruleForm.budget_id || createRule.isPending}>Create</Btn>
          </>
        }
      >
        <div className="col" style={{ gap: 10 }}>
          <Field label="Name"><input className="input" value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} aria-label="Rule name" /></Field>
          <Field label="Budget">
            <select className="select" value={ruleForm.budget_id} onChange={(e) => setRuleForm({ ...ruleForm, budget_id: e.target.value })} aria-label="Budget">
              <option value="">Select…</option>
              {(budgets.data?.data ?? []).map((b) => <option key={b.budget_id} value={b.budget_id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Threshold %"><input className="input" type="number" value={ruleForm.threshold_pct} onChange={(e) => setRuleForm({ ...ruleForm, threshold_pct: e.target.value })} aria-label="Threshold percent" /></Field>
          <Field label="Channel (optional)">
            <select className="select" value={ruleForm.channel_id} onChange={(e) => setRuleForm({ ...ruleForm, channel_id: e.target.value })} aria-label="Channel">
              <option value="">log only</option>
              {(channels.data?.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>
      </Drawer>
    </>
  );
}

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import { fmtUsd } from '../lib/format';
import { PageHead } from '../layout/AppShell';
import { Card, CardHead, CardBody, Badge, Btn, Field } from '../components/ui';
import { useToast } from '../components/Toast';

type Health = { package: string; enabled: boolean; metering: boolean; enforcement: boolean };
type Estimate = {
  cost: { total: number; input: number; output: number; currency: string };
  price_source: string | null;
  decision: { action: string; reason: string; budget_id: number | null; suggested_model: string | null };
};

export function Diagnostics() {
  const toast = useToast();
  const [form, setForm] = useState({ provider: 'openai', model: '', tokens_input: '1000', tokens_output: '500' });
  const [result, setResult] = useState<Estimate | null>(null);

  const health = useQuery({ queryKey: ['health'], queryFn: () => api.get<Health>('/health') });

  const estimate = useMutation({
    mutationFn: () =>
      api.post<Estimate>('/diagnostics/estimate', {
        provider: form.provider,
        model: form.model,
        tokens_input: Number(form.tokens_input),
        tokens_output: Number(form.tokens_output),
      }),
    onSuccess: (r) => setResult(r),
    onError: () => toast('Estimate failed', { kind: 'error' }),
  });

  return (
    <>
      <PageHead title="Diagnostics" subtitle="Health & cost estimator" />

      <Card>
        <CardHead title="Health" />
        <CardBody>
          {health.data ? (
            <div className="row" style={{ gap: 16 }}>
              <Badge tone={health.data.enabled ? 'green' : 'red'}>enabled: {String(health.data.enabled)}</Badge>
              <Badge tone={health.data.metering ? 'green' : 'muted'}>metering: {String(health.data.metering)}</Badge>
              <Badge tone={health.data.enforcement ? 'green' : 'muted'}>enforcement: {String(health.data.enforcement)}</Badge>
              <span className="mono" style={{ color: 'var(--fg-3)', fontSize: 11 }}>{health.data.package}</span>
            </div>
          ) : (
            <div style={{ color: 'var(--fg-2)' }}>Loading…</div>
          )}
        </CardBody>
      </Card>

      <div style={{ marginTop: 14 }}>
        <Card>
          <CardHead title="Cost estimate & policy decision" sub="No provider charge — pre-flight only" />
          <CardBody>
            <div className="row" style={{ gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <Field label="Provider"><input className="input" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} aria-label="Provider" /></Field>
              <Field label="Model"><input className="input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} aria-label="Model" /></Field>
              <Field label="Tokens in"><input className="input" type="number" value={form.tokens_input} onChange={(e) => setForm({ ...form, tokens_input: e.target.value })} aria-label="Tokens in" style={{ width: 110 }} /></Field>
              <Field label="Tokens out"><input className="input" type="number" value={form.tokens_output} onChange={(e) => setForm({ ...form, tokens_output: e.target.value })} aria-label="Tokens out" style={{ width: 110 }} /></Field>
              <Btn variant="primary" onClick={() => estimate.mutate()} disabled={!form.model || estimate.isPending}>Estimate</Btn>
            </div>

            {result && (
              <div style={{ marginTop: 14 }} data-testid="estimate-result">
                <div className="row" style={{ gap: 16 }}>
                  <div>Cost: <strong className="mono">{fmtUsd(result.cost.total, 6)} {result.cost.currency}</strong></div>
                  <div>Source: <span className="mono">{result.price_source ?? 'unknown'}</span></div>
                  <div>Decision: <Badge tone={result.decision.action === 'allow' ? 'green' : result.decision.action === 'block' ? 'red' : 'yellow'}>{result.decision.action}</Badge></div>
                </div>
                {result.decision.reason && <div style={{ marginTop: 6, fontSize: 12, color: 'var(--fg-2)' }}>{result.decision.reason}</div>}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

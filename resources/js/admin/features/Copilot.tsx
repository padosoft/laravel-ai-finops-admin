import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import { PageHead } from '../layout/AppShell';
import { Card, CardHead, CardBody, Btn, Badge } from '../components/ui';
import { useToast } from '../components/Toast';
import { Icon } from '../lib/icons';

type Answer = { answer: string | null; configured: boolean; data?: { hint?: string } };
type HistoryRow = { id: number; question: string; answer: string | null; configured: boolean; created_at: string | null };

export function Copilot() {
  const qc = useQueryClient();
  const toast = useToast();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<Answer | null>(null);

  const history = useQuery({ queryKey: ['copilot', 'history'], queryFn: () => api.get<{ data: HistoryRow[] }>('/copilot/history') });

  const ask = useMutation({
    mutationFn: () => api.post<Answer>('/copilot/query', { question }),
    onSuccess: (r) => {
      setAnswer(r);
      qc.invalidateQueries({ queryKey: ['copilot', 'history'] });
    },
    onError: () => toast('Query failed', { kind: 'error' }),
  });

  return (
    <>
      <PageHead title="FinOps Copilot" subtitle="Ask about your AI spend in natural language" />

      <Card>
        <CardBody>
          <form
            className="row"
            style={{ gap: 8 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (question.trim()) ask.mutate();
            }}
          >
            <input className="input" style={{ flex: 1 }} placeholder="e.g. how much did I spend on embeddings this month?" value={question} onChange={(e) => setQuestion(e.target.value)} aria-label="Question" />
            <Btn variant="primary" type="submit" disabled={!question.trim() || ask.isPending}>
              <Icon name="sparkles" /> Ask
            </Btn>
          </form>

          {answer && (
            <div style={{ marginTop: 14 }} data-testid="copilot-answer">
              {answer.configured ? (
                <p style={{ fontSize: 13 }}>{answer.answer}</p>
              ) : (
                <div className="row" style={{ gap: 8, color: 'var(--fg-2)' }}>
                  <Badge tone="yellow">not configured</Badge>
                  <span style={{ fontSize: 12 }}>{answer.data?.hint ?? 'Bind a CopilotProvider (laravel-ai-chat / AskMyDocs) to enable answers.'}</span>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      <div style={{ marginTop: 14 }}>
        <Card>
          <CardHead title="History" />
          <CardBody flush>
            {history.data && history.data.data.length > 0 ? (
              history.data.data.map((h) => (
                <div key={h.id} style={{ padding: '11px 14px', borderBottom: '1px solid var(--border-2)' }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{h.question}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-2)', marginTop: 2 }}>{h.answer ?? '(not configured)'}</div>
                </div>
              ))
            ) : (
              <div style={{ padding: 14, color: 'var(--fg-2)' }}>No questions yet.</div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

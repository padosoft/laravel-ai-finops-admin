import type { ReactNode } from 'react';
import { Icon } from '../lib/icons';
import { fmtUsd } from '../lib/format';

export type Tone = 'green' | 'red' | 'yellow' | 'blue' | 'muted';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function CardHead({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="card-head">
      <div>
        <h3 className="card-title">{title}</h3>
        {sub && <div className="card-sub">{sub}</div>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

export function CardBody({ children, flush = false }: { children: ReactNode; flush?: boolean }) {
  return <div className={`card-body${flush ? ' flush' : ''}`}>{children}</div>;
}

export function Badge({ tone = 'muted', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={`badge ${tone} ${className}`.trim()}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone: Tone =
    status === 'ok' || status === 'approved' || status === 'recorded' || status === 'allow'
      ? 'green'
      : status === 'exceeded' || status === 'blocked' || status === 'rejected' || status === 'failed'
        ? 'red'
        : status === 'warning' || status === 'pending'
          ? 'yellow'
          : 'muted';
  return <Badge tone={tone}>{status}</Badge>;
}

export function Bar({ pct, tone = 'success' }: { pct: number; tone?: 'success' | 'warn' | 'danger' }) {
  return (
    <div className={`bar ${tone}`}>
      <span style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export function Money({ value, decimals = 2 }: { value: number; decimals?: number }) {
  return <span className="mono tnum">{fmtUsd(value, decimals)}</span>;
}

export function Btn({
  children,
  variant,
  size,
  onClick,
  type = 'button',
  disabled,
}: {
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  size?: 'sm';
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const cls = ['btn', variant, size].filter(Boolean).join(' ');
  return (
    <button className={cls} onClick={onClick} type={type} disabled={disabled}>
      {children}
    </button>
  );
}

export function Kpi({ icon, label, value, sub, tone }: { icon: string; label: string; value: ReactNode; sub?: string; tone?: string }) {
  return (
    <div className="kpi">
      <div className="kpi-label">
        <Icon name={icon} size={12} /> {label}
      </div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-delta flat" style={tone ? { color: `var(--${tone})` } : undefined}>{sub}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <Card>
      <CardBody>
        <div style={{ color: 'var(--fg-2)' }}>{label}</div>
      </CardBody>
    </Card>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <Card>
      <CardBody>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
          {hint && <div style={{ color: 'var(--fg-2)', fontSize: 'var(--text-sm)' }}>{hint}</div>}
        </div>
      </CardBody>
    </Card>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  const msg = error instanceof Error ? error.message : 'Something went wrong';
  return (
    <Card>
      <CardBody>
        <div style={{ color: 'var(--red)' }}>{msg}</div>
      </CardBody>
    </Card>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  sub,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer" role="dialog" aria-label={title}>
        <div className="drawer-head">
          <div>
            <h3 className="drawer-title">{title}</h3>
            {sub && <div className="drawer-sub">{sub}</div>}
          </div>
          <button className="iconbtn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </div>
    </>
  );
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <>
      <div className="overlay" onClick={onCancel} />
      <div className="drawer" role="alertdialog" aria-label={title} style={{ width: 'min(420px, 92vw)' }}>
        <div className="drawer-head">
          <h3 className="drawer-title">{title}</h3>
        </div>
        <div className="drawer-body">{message}</div>
        <div className="drawer-foot">
          <Btn variant="ghost" onClick={onCancel}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={onConfirm}>
            {confirmLabel}
          </Btn>
        </div>
      </div>
    </>
  );
}

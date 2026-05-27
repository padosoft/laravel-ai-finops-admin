import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ToastKind = 'success' | 'error' | '';
type Toast = { id: number; title: string; message?: string; kind: ToastKind };
type PushToast = (title: string, opts?: { message?: string; kind?: ToastKind; duration?: number }) => void;

const ToastContext = createContext<PushToast>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback<PushToast>((title, opts = {}) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message: opts.message, kind: opts.kind ?? '' }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), opts.duration ?? 3000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-stack" data-testid="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`.trim()}>
            <b>{t.title}</b>
            {t.message && <small>{t.message}</small>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = (): PushToast => useContext(ToastContext);

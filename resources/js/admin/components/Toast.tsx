import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

type ToastKind = 'success' | 'error' | 'warn' | '';
type Toast = { id: number; title: string; message?: string; kind: ToastKind };
type PushToast = (title: string, opts?: { message?: string; kind?: ToastKind; duration?: number }) => void;

const ToastContext = createContext<PushToast>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const push = useCallback<PushToast>((title, opts = {}) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message: opts.message, kind: opts.kind ?? '' }]);
    const handle = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timers.current.delete(handle);
    }, opts.duration ?? 3000);
    timers.current.add(handle);
  }, []);

  useEffect(() => {
    const set = timers.current;
    return () => set.forEach(clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-stack" data-testid="toast-stack" aria-live="polite" role="status">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`.trim()} role={t.kind === 'error' ? 'alert' : undefined}>
            <b>{t.title}</b>
            {t.message && <small>{t.message}</small>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = (): PushToast => useContext(ToastContext);

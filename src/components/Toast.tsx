import { createContext, useContext, useState, ReactNode } from "react";
import { createPortal } from "react-dom";

type ToastIn = { message: string; actionLabel?: string; onAction?: () => void; timeoutMs?: number };
type Toast = ToastIn & { id: number };

const ToastCtx = createContext<{ show: (t: ToastIn) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = ({ message, actionLabel, onAction, timeoutMs = 6000 }: ToastIn) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, actionLabel, onAction, timeoutMs }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), timeoutMs);
  };
  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 space-y-2 z-50">
          {toasts.map(t => (
            <div key={t.id} className="rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-sm text-white shadow-lg flex items-center gap-3">
              <span>{t.message}</span>
              {t.actionLabel && (
                <button
                  onClick={() => { t.onAction?.(); setToasts(prev => prev.filter(x => x.id !== t.id)); }}
                  className="px-2 py-1 rounded bg-white text-black text-xs"
                >
                  {t.actionLabel}
                </button>
              )}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.show;
}

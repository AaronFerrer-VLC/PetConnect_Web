// src/components/Drawer.tsx
import { ReactNode, useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  width?: number; // px
  title?: string;
  children: ReactNode;
};

export default function Drawer({ open, onClose, side = "left", width = 340, title, children }: Props) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        style={{ width }}
        className={`absolute top-0 bottom-0 ${side === "left" ? "left-0" : "right-0"}
          bg-white dark:bg-slate-900 shadow-2xl border-slate-200 dark:border-slate-800 border
          transition-transform ${open ? 'translate-x-0' : side === "left" ? '-translate-x-full' : 'translate-x-full'}
          flex flex-col`}
      >
        <div className="h-12 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="font-medium">{title}</div>
          <button className="text-sm underline" onClick={onClose}>Cerrar</button>
        </div>
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}

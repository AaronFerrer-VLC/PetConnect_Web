import { createPortal } from "react-dom";
import { ReactNode, useEffect } from "react";

export default function Modal({
  open,
  onClose,
  children,
  width = "max-w-3xl",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center p-4 md:p-8">
        <div className={`w-full ${width} bg-white text-slate-900 rounded-2xl shadow-2xl relative`}>
          <button
            onClick={onClose}
            className="absolute right-3 top-3 w-8 h-8 rounded-full hover:bg-black/5"
            aria-label="Cerrar"
            title="Cerrar"
          >
            ✕
          </button>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

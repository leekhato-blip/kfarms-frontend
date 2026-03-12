import React from "react";
import { X } from "lucide-react";

export default function Drawer({ open, title, onClose, children }) {
  React.useEffect(() => {
    if (!open) return undefined;

    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-[color:var(--atlas-overlay)] backdrop-blur-[1px]" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface)] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-[color:var(--atlas-border)] pb-3">
          <h3 className="text-lg font-semibold text-[var(--atlas-text-strong)]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-[var(--atlas-text)] transition hover:bg-[color:var(--atlas-surface-soft)]"
            aria-label="Close drawer"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}

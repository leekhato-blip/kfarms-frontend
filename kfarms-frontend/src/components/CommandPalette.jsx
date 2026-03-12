import React from "react";
import { Command, CornerDownLeft } from "lucide-react";

export default function CommandPalette({ open, onClose, actions = [] }) {
  const inputRef = React.useRef(null);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    window.setTimeout(() => inputRef.current?.focus(), 20);
  }, [open]);

  React.useEffect(() => {
    if (!open) return undefined;

    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.toLowerCase();
  const filtered = actions.filter((action) =>
    action.label.toLowerCase().includes(q) || (action.hint || "").toLowerCase().includes(q),
  );

  return (
    <div
      className="fixed inset-0 z-[85] flex items-start justify-center bg-[color:var(--atlas-overlay)] px-4 pt-24"
      onClick={onClose}
    >
      <div
        className="atlas-glass-card w-full max-w-2xl rounded-xl border border-[color:var(--atlas-border-strong)] p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 rounded-lg border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3">
          <Command size={16} className="text-[var(--atlas-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search commands..."
            className="h-11 w-full bg-transparent text-sm text-[var(--atlas-text-strong)] outline-none placeholder:text-[var(--atlas-muted-soft)]"
          />
        </div>

        <div className="mt-3 max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-[var(--atlas-muted)]">No command matches your query.</div>
          ) : (
            <div className="space-y-1">
              {filtered.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => {
                    action.onSelect?.();
                    onClose();
                  }}
                  className="atlas-glow-rail flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-[var(--atlas-text)] transition hover:bg-[color:var(--atlas-surface-soft)]"
                >
                  <span>{action.label}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--atlas-muted)]">
                    {action.hint || "Run"}
                    <CornerDownLeft size={13} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

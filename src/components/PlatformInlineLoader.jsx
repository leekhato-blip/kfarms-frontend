import React from "react";

export default function PlatformInlineLoader({
  label = "Loading platform data...",
  className = "",
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-[1.4rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/70 px-4 py-6 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-full border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface)]/80 px-4 py-2.5 shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
        <span className="relative inline-flex h-8 w-8 items-center justify-center">
          <span className="absolute inset-0 rounded-full border-2 border-sky-400/20" />
          <span className="absolute inset-[3px] rounded-full border-2 border-transparent border-t-sky-500 border-r-emerald-400 animate-spin" />
          <span className="h-2.5 w-2.5 rounded-full bg-[linear-gradient(135deg,#2563eb,#10b981)]" />
        </span>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
            ROOTS
          </div>
          <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">{label}</div>
        </div>
      </div>
    </div>
  );
}

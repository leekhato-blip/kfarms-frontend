import React from "react";
import { Info, X } from "lucide-react";

export default function FilteredResultsHint({
  summaryLabel = "records",
  tableLabel = "table",
  hasFilters = false,
  onClear,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 shadow-soft dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-50 sm:flex-row sm:items-start sm:justify-between ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="leading-relaxed">
          The top boxes above show all {summaryLabel} on the farm. The {tableLabel} below{" "}
          {hasFilters
            ? "only shows what matches what you typed or selected."
            : "shows the matching active items."}
        </p>
      </div>

      {hasFilters && typeof onClear === "function" ? (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300/70 bg-white/70 px-3 py-2 text-sm font-semibold text-amber-900 transition hover:bg-white dark:border-amber-300/20 dark:bg-white/10 dark:text-amber-50 dark:hover:bg-white/15"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Show everything
        </button>
      ) : null}
    </div>
  );
}

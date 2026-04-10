import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { X, Download } from "lucide-react";
import { useTenant } from "../tenant/TenantContext";
import { isPlanAtLeast, normalizePlanId } from "../constants/plans";
import { normalizeExportCategory, normalizeExportType } from "../services/reportService";
import { buildBillingPlanFocusPath } from "../utils/billingNavigation";
import PlanUpgradePrompt from "./PlanUpgradePrompt";

const DEFAULT_CATEGORIES = [
  { label: "Sales", value: "sales" },
  { label: "Supplies", value: "supplies" },
  { label: "Feeds", value: "feeds" },
  { label: "Egg Production", value: "eggs" },
  { label: "Poultry", value: "livestock" },
  { label: "Inventory", value: "inventory" },
  { label: "Fish Ponds", value: "fish" },
  { label: "Fish Hatches", value: "hatches" },
];

const TYPE_OPTIONS = [
  { label: "CSV", value: "csv" },
  { label: "XLSX", value: "xlsx" },
  { label: "PDF", value: "pdf" },
];

export default function ExportModal({
  open,
  onClose,
  onSubmit,
  exporting = false,
  categories = DEFAULT_CATEGORIES,
  defaultCategory,
  defaultType = "csv",
  defaultStart = "",
  defaultEnd = "",
}) {
  const { activeTenant } = useTenant();
  const currentPlan = normalizePlanId(activeTenant?.plan, "FREE");
  const canUseAdvancedExport = isPlanAtLeast(currentPlan, "PRO");
  const [type, setType] = useState(normalizeExportType(defaultType));
  const [category, setCategory] = useState(
    normalizeExportCategory(defaultCategory || categories[0]?.value),
  );
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);

  useEffect(() => {
    if (!open) return;
    if (canUseAdvancedExport) {
      setType(normalizeExportType(defaultType));
      setCategory(normalizeExportCategory(defaultCategory || categories[0]?.value));
      setStart(defaultStart || "");
      setEnd(defaultEnd || "");
      return;
    }

    setType("csv");
    setCategory(normalizeExportCategory(defaultCategory || categories[0]?.value));
    setStart("");
    setEnd("");
  }, [
    open,
    canUseAdvancedExport,
    defaultType,
    defaultCategory,
    defaultStart,
    defaultEnd,
    categories,
  ]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!canUseAdvancedExport) {
      return;
    }

    onSubmit?.({ type, category, start: start || null, end: end || null });
  }

  const upgradePath = buildBillingPlanFocusPath("PRO");

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-end justify-center px-4 py-6 sm:items-center">
      <div
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-[32rem] rounded-2xl animate-fadeIn"
        aria-modal="true"
        role="dialog"
      >
        <div className="rounded-2xl border border-white/15 bg-white/90 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/85 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Export report
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {canUseAdvancedExport
                  ? "Pick the section, file type, and date range to download."
                  : "Upgrade to Pro for full export controls."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close export modal"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/70 bg-white/90 text-slate-600 shadow-[0_10px_22px_rgba(15,23,42,0.12)] transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:shadow-none dark:hover:bg-white/15"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {!canUseAdvancedExport && (
              <PlanUpgradePrompt
                compact
                requiredPlan="PRO"
                feature="advanced export controls"
                title="Unlock advanced export"
                description="Pro unlocks CSV, XLSX, PDF downloads plus date filters."
              />
            )}

            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  File type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  disabled={!canUseAdvancedExport}
                  className="w-full rounded-md border border-slate-200/70 bg-white/90 px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-accent-primary/60 focus:ring-2 focus:ring-accent-primary/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={!canUseAdvancedExport && opt.value !== "csv"}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  Section
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={!canUseAdvancedExport}
                  className="w-full rounded-md border border-slate-200/70 bg-white/90 px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-accent-primary/60 focus:ring-2 focus:ring-accent-primary/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
                >
                  {categories.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  Start date
                </label>
                <input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  disabled={!canUseAdvancedExport}
                  className="w-full rounded-md border border-slate-200/70 bg-white/90 px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-accent-primary/60 focus:ring-2 focus:ring-accent-primary/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  End date
                </label>
                <input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  disabled={!canUseAdvancedExport}
                  className="w-full rounded-md border border-slate-200/70 bg-white/90 px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-accent-primary/60 focus:ring-2 focus:ring-accent-primary/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-md border border-slate-200/70 px-4 py-2 text-slate-600 transition hover:bg-slate-50 sm:w-auto sm:min-w-[8.5rem] dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            {canUseAdvancedExport ? (
              <button
                type="submit"
                disabled={exporting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent-primary px-4 py-2 text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[8.5rem]"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Downloading..." : "Download"}
              </button>
            ) : (
              <Link
                to={upgradePath}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent-primary px-4 py-2 text-white shadow-sm transition hover:opacity-90 sm:w-auto sm:min-w-[8.5rem]"
              >
                <Download className="h-4 w-4" />
                Upgrade to Export
              </Link>
            )}
          </div>
        </div>
      </form>
    </div>,
    document.body,
  );
}

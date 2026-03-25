import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Download } from "lucide-react";
import { useTenant } from "../tenant/TenantContext";
import { isPlanAtLeast, normalizePlanId } from "../constants/plans";
import { normalizeExportCategory, normalizeExportType } from "../services/reportService";
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

  function handleSubmit(e) {
    e.preventDefault();
    if (!canUseAdvancedExport) {
      return;
    }

    onSubmit?.({ type, category, start: start || null, end: end || null });
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-[96vw] sm:max-w-lg rounded-2xl p-1 animate-fadeIn"
        aria-modal="true"
        role="dialog"
      >
        <div className="rounded-2xl bg-darkCard/60 shadow-neo p-px">
          <div className="rounded-2xl bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-white/20 p-4 sm:p-6 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-lightText dark:text-darkText">
                  Download report
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {canUseAdvancedExport
                    ? "Choose the file type, date range, and section you want to download."
                    : "Exports are available on Pro and Enterprise plans. Upgrade to unlock CSV, XLSX, PDF downloads, and date filters."}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close export modal"
                className="p-2 rounded-md hover:bg-white/10"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!canUseAdvancedExport && (
              <PlanUpgradePrompt
                compact
                requiredPlan="PRO"
                feature="advanced export controls"
                title="Unlock Advanced Export"
                description="Upgrade to Pro to unlock CSV, XLSX, PDF downloads, date choices, and section selection for cleaner farm reports."
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  File type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  disabled={!canUseAdvancedExport}
                  className="w-full px-3 py-2 rounded-md bg-white/70 dark:bg-black/50 border border-white/20"
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
                  className="w-full px-3 py-2 rounded-md bg-white/70 dark:bg-black/50 border border-white/20"
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
                  className="w-full px-3 py-2 rounded-md bg-white/70 dark:bg-black/50 border border-white/20"
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
                  className="w-full px-3 py-2 rounded-md bg-white/70 dark:bg-black/50 border border-white/20"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-md border border-white/10 bg-transparent px-4 py-2 hover:bg-white/5 sm:w-auto sm:min-w-[8.5rem]"
              >
                Cancel
              </button>
              {canUseAdvancedExport ? (
                <button
                  type="submit"
                  disabled={exporting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent-primary px-4 py-2 text-white hover:opacity-90 disabled:opacity-50 sm:w-auto sm:min-w-[8.5rem]"
                >
                  <Download className="w-4 h-4" />
                  {exporting ? "Downloading..." : "Download"}
                </button>
              ) : (
                <Link
                  to="/billing?plan=PRO"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent-primary px-4 py-2 text-white hover:opacity-90 sm:w-auto sm:min-w-[8.5rem]"
                >
                  <Download className="w-4 h-4" />
                  Upgrade to Export
                </Link>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

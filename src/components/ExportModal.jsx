import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  X,
  Download,
  CalendarRange,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { useTenant } from "../tenant/TenantContext";
import { isPlanAtLeast, normalizePlanId } from "../constants/plans";
import {
  getExportCategoryMeta,
  getExportTypeMeta,
  normalizeExportCategory,
  normalizeExportType,
} from "../services/reportService";
import { buildBillingPlanFocusPath } from "../utils/billingNavigation";

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

const CONTROL_CLASS =
  "w-full rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent-primary/40 focus:ring-2 focus:ring-accent-primary/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100";
const LABEL_CLASS =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400";
const SEGMENT_CLASS =
  "inline-flex min-h-11 items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold transition";
const META_CARD_CLASS =
  "rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-white/10 dark:bg-white/[0.04]";
const PRIMARY_BUTTON_CLASS =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
const SECONDARY_BUTTON_CLASS =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200/90 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:bg-white/[0.1]";

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

  const selectedCategoryMeta = getExportCategoryMeta(category);
  const selectedTypeMeta = getExportTypeMeta(type);
  const previewFields = Array.isArray(selectedCategoryMeta.fields) ? selectedCategoryMeta.fields : [];
  const visiblePreviewFields = previewFields.slice(0, 3);
  const hiddenFieldCount = Math.max(previewFields.length - visiblePreviewFields.length, 0);
  const hasInvalidDateRange = Boolean(start && end && end < start);
  const resolvedDateRange = start && end
    ? `${start} to ${end}`
    : start
      ? `From ${start}`
      : end
        ? `Up to ${end}`
        : "All available dates";

  function handleSubmit(e) {
    e.preventDefault();
    if (!canUseAdvancedExport || hasInvalidDateRange) {
      return;
    }

    onSubmit?.({ type, category, start: start || null, end: end || null });
  }

  const upgradePath = buildBillingPlanFocusPath("PRO");

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto px-0 py-0 sm:px-4 sm:py-8">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-md"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative mx-auto flex min-h-full w-full max-w-4xl items-end justify-center rounded-2xl p-0 animate-fadeIn sm:items-center sm:p-1"
        aria-modal="true"
        role="dialog"
        aria-labelledby="export-modal-title"
      >
        <div className="w-full max-w-xl rounded-t-[1.6rem] border border-white/20 bg-white/88 p-4 text-slate-900 shadow-neo backdrop-blur-xl dark:bg-[#050b16]/92 dark:text-slate-100 sm:rounded-2xl sm:p-5">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2
                  id="export-modal-title"
                  className="text-lg font-semibold text-slate-900 dark:text-slate-50"
                >
                  Export data
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Pick a section and download it.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close export modal"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white/85 text-slate-600 transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!canUseAdvancedExport ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
                Free plan exports CSV only. Upgrade to unlock XLSX, PDF, and date filters.
              </div>
            ) : null}

            <div className="space-y-4">
              <div>
                <label className={LABEL_CLASS}>Section</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={CONTROL_CLASS}
                >
                  {categories.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LABEL_CLASS}>Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPE_OPTIONS.map((opt) => {
                    const active = type === opt.value;
                    const disabled = !canUseAdvancedExport && opt.value !== "csv";
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => setType(opt.value)}
                        className={`${SEGMENT_CLASS} ${
                          active
                            ? "border-accent-primary bg-accent-primary text-white"
                            : "border-slate-200/90 bg-slate-50/90 text-slate-800 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200"
                        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={LABEL_CLASS}>Start date</label>
                  <input
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    disabled={!canUseAdvancedExport}
                    className={CONTROL_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>End date</label>
                  <input
                    type="date"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    disabled={!canUseAdvancedExport}
                    className={CONTROL_CLASS}
                  />
                </div>
              </div>

              {hasInvalidDateRange ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-200">
                  End date cannot be earlier than the start date.
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className={META_CARD_CLASS}>
                  <div className="flex items-start gap-2">
                    {type === "pdf" ? (
                      <FileText className="mt-0.5 h-4 w-4 text-accent-primary" />
                    ) : (
                      <FileSpreadsheet className="mt-0.5 h-4 w-4 text-accent-primary" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">
                        {selectedTypeMeta.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {selectedCategoryMeta.label}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
                        {selectedTypeMeta.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={META_CARD_CLASS}>
                  <div className="flex items-start gap-2">
                    <CalendarRange className="mt-0.5 h-4 w-4 text-accent-primary" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">
                        Date range
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {start || end ? "Filtered" : "All dates"}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
                        {resolvedDateRange}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {previewFields.length > 0 ? (
                <div className={META_CARD_CLASS}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">
                    Included fields
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {visiblePreviewFields.map((field) => (
                      <span
                        key={field}
                        className="inline-flex rounded-full border border-slate-200/80 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200"
                      >
                        {field}
                      </span>
                    ))}
                    {hiddenFieldCount > 0 ? (
                      <span className="inline-flex rounded-full border border-dashed border-slate-300/80 bg-slate-100/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
                        +{hiddenFieldCount} more
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200/80 pt-4 dark:border-white/10 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className={SECONDARY_BUTTON_CLASS}
              >
                Cancel
              </button>
              {canUseAdvancedExport ? (
                <button
                  type="submit"
                  disabled={exporting || hasInvalidDateRange}
                  className={PRIMARY_BUTTON_CLASS}
                >
                  <Download className="h-4 w-4" />
                  {exporting ? "Downloading..." : `Download ${selectedTypeMeta.label}`}
                </button>
              ) : (
                <Link
                  to={upgradePath}
                  className={`${PRIMARY_BUTTON_CLASS} no-underline`}
                >
                  <Download className="h-4 w-4" />
                  Upgrade to Export
                </Link>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  );
}

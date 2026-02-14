import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

const DEFAULT_CATEGORIES = [
  { label: "Sales", value: "sales" },
  { label: "Supplies", value: "supplies" },
  { label: "Feeds", value: "feeds" },
  { label: "Livestock", value: "livestock" },
  { label: "Fish Ponds", value: "fish-pond" },
  { label: "Hatches", value: "hatches" },
];

const TYPE_OPTIONS = [
  { label: "CSV", value: "csv" },
  { label: "XLSX", value: "xlsx" },
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
  const [type, setType] = useState(defaultType);
  const [category, setCategory] = useState(defaultCategory || categories[0]?.value);
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);

  useEffect(() => {
    if (!open) return;
    setType(defaultType);
    setCategory(defaultCategory || categories[0]?.value);
    setStart(defaultStart || "");
    setEnd(defaultEnd || "");
  }, [open, defaultType, defaultCategory, defaultStart, defaultEnd, categories]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
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
                  Export Data
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose type, date range, and category.
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-white/70 dark:bg-black/50 border border-white/20"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
                  className="w-full px-3 py-2 rounded-md bg-white/70 dark:bg-black/50 border border-white/20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md bg-transparent border border-white/10 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={exporting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent-primary text-white hover:opacity-90 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {exporting ? "Exporting..." : "Export"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

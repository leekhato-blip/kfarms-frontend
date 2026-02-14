import { useEffect } from "react";
import { X, Edit, Trash2 } from "lucide-react";

export default function ItemDetailsModal({
  open,
  title = "Details",
  subtitle,
  status,
  fields = [],
  onClose,
  onEdit,
  onDelete,
  editLabel = "Edit",
  deleteLabel = "Delete",
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const safeFields = Array.isArray(fields) ? fields : [];

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-[96vw] sm:max-w-xl rounded-2xl p-1 animate-fadeIn"
        role="dialog"
        aria-modal="true"
      >
        <div className="rounded-2xl bg-darkCard/60 shadow-neo p-px">
          <div className="rounded-2xl bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-white/20 p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-lightText dark:text-darkText">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {subtitle}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {status?.label && (
                  <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-lightText dark:text-darkText">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: status.color || "#22c55e" }}
                    />
                    {status.label}
                  </div>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close details"
                  className="p-2 rounded-md hover:bg-white/10"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
              {safeFields.map((field, index) => {
                const rawValue = field?.value;
                const displayValue =
                  rawValue === null || rawValue === undefined || rawValue === ""
                    ? "—"
                    : rawValue;
                return (
                  <div
                    key={`${field?.label ?? "field"}-${index}`}
                    className={`rounded-lg bg-white/60 dark:bg-black/40 border border-white/10 px-2.5 py-2 sm:px-3 ${
                      field?.span === 2 || field?.full
                        ? "col-span-2"
                        : "col-span-1"
                    }`}
                  >
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {field?.label ?? "Detail"}
                    </div>
                    <div className="mt-1 text-[13px] sm:text-sm font-semibold text-slate-700 dark:text-slate-100 break-words">
                      {displayValue}
                    </div>
                  </div>
                );
              })}
            </div>

            {(onEdit || onDelete) && (
              <div className="flex flex-row flex-wrap gap-2 sm:justify-end">
                {onEdit && (
                  <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 rounded-md bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 transition"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm font-semibold">{editLabel}</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 rounded-md bg-red-500/10 text-status-danger hover:bg-red-500/20 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      {deleteLabel}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

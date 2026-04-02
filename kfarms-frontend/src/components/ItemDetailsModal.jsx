import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Edit, Trash2, X } from "lucide-react";

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
    if (!open) return undefined;

    const handleKey = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const safeFields = Array.isArray(fields) ? fields : [];
  const getDisplayValue = (rawValue) =>
    rawValue === null || rawValue === undefined || rawValue === "" ? "—" : rawValue;
  const shouldUseWideCard = (field, displayValue) => {
    if (field?.span === 2 || field?.full) return true;
    const valueText = String(displayValue ?? "");
    const labelText = String(field?.label ?? "");
    return valueText.length > 28 || valueText.includes("\n") || labelText.length > 18;
  };

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-end justify-center px-0 py-0 sm:items-center sm:px-4 sm:py-5">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-md"
        onClick={onClose}
      />

      <div
        className="relative w-full animate-fadeIn sm:max-w-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="rounded-t-[1.75rem] bg-darkCard/60 p-px shadow-neo sm:rounded-[1.75rem]">
          <div className="flex max-h-[88vh] flex-col overflow-hidden rounded-t-[1.75rem] border border-white/20 bg-white/88 backdrop-blur-xl dark:bg-black/78 sm:max-h-[92vh] sm:rounded-[1.75rem]">
            <div className="px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pb-0 sm:pt-6">
              <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-slate-300/80 dark:bg-white/15 sm:hidden" />

              <div className="relative overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-[linear-gradient(120deg,rgba(255,255,255,0.9),rgba(238,242,255,0.82),rgba(236,253,245,0.8))] px-4 py-3.5 dark:border-white/10 dark:bg-[linear-gradient(120deg,rgba(15,23,42,0.96),rgba(20,33,61,0.92),rgba(7,58,55,0.82))] sm:px-5 sm:py-4">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_42%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_42%)]" />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-50 sm:text-xl">
                        {title}
                      </h3>
                      {status?.label ? (
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/65 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-[0_10px_18px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:shadow-none sm:px-3 sm:text-xs">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: status.color || "#22c55e" }}
                          />
                          {status.label}
                        </div>
                      ) : null}
                    </div>

                    {subtitle ? (
                      <p className="mt-1.5 text-[13px] leading-5 text-slate-600 dark:text-slate-300 sm:text-sm sm:leading-6">
                        {subtitle}
                      </p>
                    ) : null}

                    <p className="mt-2.5 text-[10px] font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 sm:mt-3 sm:text-xs sm:tracking-[0.18em]">
                      Item information
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close details"
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-600 shadow-[0_10px_22px_rgba(15,23,42,0.08)] transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:shadow-none dark:hover:bg-white/15 sm:h-10 sm:w-10"
                    title="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 sm:px-6 sm:pb-6">
              {safeFields.length ? (
                <>
                  <div className="grid grid-cols-2 gap-2.5 sm:hidden">
                    {safeFields.map((field, index) => {
                      const displayValue = getDisplayValue(field?.value);
                      const isWideCard = shouldUseWideCard(field, displayValue);

                      return (
                        <div
                          key={`${field?.label ?? "field"}-${index}`}
                          className={`rounded-[1.1rem] border border-slate-200/80 bg-white/78 px-3.5 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none ${
                            isWideCard ? "col-span-2" : "col-span-1"
                          }`}
                        >
                          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                            {field?.label ?? "Detail"}
                          </div>
                          <div className="mt-1.5 break-words text-[14px] font-semibold leading-5 text-slate-800 dark:text-slate-100">
                            {displayValue}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="hidden grid-cols-1 gap-3 sm:grid sm:grid-cols-2">
                    {safeFields.map((field, index) => {
                      const displayValue = getDisplayValue(field?.value);

                      return (
                        <div
                          key={`${field?.label ?? "field"}-${index}`}
                          className={`rounded-[1.15rem] border border-slate-200/80 bg-white/78 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none ${
                            field?.span === 2 || field?.full
                              ? "sm:col-span-2"
                              : "sm:col-span-1"
                          }`}
                        >
                          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            {field?.label ?? "Detail"}
                          </div>
                          <div className="mt-2 break-words text-sm font-semibold leading-6 text-slate-800 dark:text-slate-100">
                            {displayValue}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="rounded-[1.15rem] border border-dashed border-slate-200 bg-white/60 px-4 py-5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
                  No item information is available for this record yet.
                </div>
              )}
            </div>

            {(onEdit || onDelete) ? (
              <div className="border-t border-slate-200/70 bg-white/92 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl dark:border-white/10 dark:bg-black/84 sm:bg-transparent sm:px-6 sm:pb-6 sm:pt-4 dark:sm:bg-transparent">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  {onEdit ? (
                    <button
                      type="button"
                      onClick={onEdit}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-accent-primary/20 bg-accent-primary/10 px-4 py-3 text-sm font-semibold text-accent-primary transition hover:bg-accent-primary/15 sm:w-auto sm:py-2.5"
                    >
                      <Edit className="h-4 w-4" />
                      <span>{editLabel}</span>
                    </button>
                  ) : null}

                  {onDelete ? (
                    <button
                      type="button"
                      onClick={onDelete}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-500/15 dark:text-rose-200 sm:w-auto sm:py-2.5"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>{deleteLabel}</span>
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

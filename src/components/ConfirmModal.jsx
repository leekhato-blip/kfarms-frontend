import React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, RotateCcw, X } from "lucide-react";

export default function ConfirmModal({
  open,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
}) {
  React.useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onCancel?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [loading, onCancel, open]);

  if (!open) return null;

  const intentText = `${title} ${confirmText} ${message}`.toLowerCase();
  const isRestoreAction =
    intentText.includes("restore") || intentText.includes("recover");
  const isDangerAction =
    !isRestoreAction &&
    (intentText.includes("delete") ||
      intentText.includes("remove") ||
      intentText.includes("permanent"));

  const accentClasses = isRestoreAction
    ? {
        iconWrap: "bg-emerald-500/10 text-emerald-500",
        badge: "bg-emerald-500/10 text-emerald-500",
        messageBox:
          "border-emerald-500/10 bg-emerald-500/10 text-slate-600 dark:text-slate-300",
        confirmButton:
          "border border-emerald-500/20 bg-emerald-600 text-white hover:bg-emerald-500",
      }
    : isDangerAction
      ? {
          iconWrap: "bg-red-500/10 text-red-500",
          badge: "bg-red-500/10 text-red-400",
          messageBox:
            "border-red-500/10 bg-red-500/10 text-slate-600 dark:text-slate-300",
          confirmButton:
            "border border-red-500/20 bg-status-danger text-white hover:opacity-90",
        }
      : {
          iconWrap: "bg-accent-primary/10 text-accent-primary",
          badge: "bg-white/10 text-slate-400",
          messageBox:
            "border-white/10 bg-white/60 text-slate-600 dark:border-white/10 dark:bg-black/40 dark:text-slate-300",
          confirmButton:
            "border border-accent-primary/20 bg-accent-primary text-white hover:bg-accent-primary/90",
        };

  const Icon = isRestoreAction ? RotateCcw : AlertTriangle;

  const modal = (
    <div
      className="fixed inset-0 z-[13000] flex items-center justify-center px-4"
      onClick={loading ? undefined : onCancel}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />

      <div
        className="relative w-full max-w-md rounded-2xl p-1 animate-fadeIn"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
      >
        <div className="rounded-2xl bg-darkCard/60 shadow-neo p-px">
          <div className="rounded-2xl bg-white/70 dark:bg-black/60 backdrop-blur-xl border border-white/20 p-6 space-y-5">
            <div className="flex justify-between items-center">
              <div className="flex items-start gap-3">
                <div
                  className={`rounded-md p-2 flex items-center justify-center ${accentClasses.iconWrap}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    id="confirm-modal-title"
<<<<<<< HEAD
                    className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100"
=======
                    className="text-lg font-semibold flex items-center gap-2"
>>>>>>> 0babf4d (Update frontend application)
                  >
                    {title}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${accentClasses.badge}`}
                    >
                      {isRestoreAction
                        ? "Restore"
                        : isDangerAction
                          ? "Delete"
                          : "Confirm"}
                    </span>
                  </h3>
<<<<<<< HEAD
                  <p className="text-xs text-slate-500 dark:text-slate-300">
=======
                  <p className="text-xs text-slate-500">
>>>>>>> 0babf4d (Update frontend application)
                    {isRestoreAction
                      ? "Recover this record back into the active list"
                      : isDangerAction
                        ? "Review this action before you continue"
                        : "Please review this action before continuing"}
                  </p>
                </div>
              </div>

              <button
<<<<<<< HEAD
                type="button"
                onClick={onCancel}
                disabled={loading}
                aria-label="Close modal"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white/85 text-slate-600 shadow-[0_10px_22px_rgba(15,23,42,0.08)] transition hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:shadow-none dark:hover:bg-white/15"
=======
                onClick={onCancel}
                disabled={loading}
                aria-label="Close modal"
                className="p-2 rounded-md hover:bg-white/10 disabled:opacity-60"
>>>>>>> 0babf4d (Update frontend application)
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              id="confirm-modal-description"
              className={`rounded-xl border p-4 text-sm leading-relaxed ${accentClasses.messageBox}`}
            >
              {message}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
<<<<<<< HEAD
                type="button"
=======
>>>>>>> 0babf4d (Update frontend application)
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2.5 rounded-lg bg-white/80 dark:bg-black/60 border border-white/20 text-slate-700 dark:text-slate-200 transition hover:bg-white/90 dark:hover:bg-black/70 disabled:opacity-60"
              >
                {cancelText}
              </button>

              <button
<<<<<<< HEAD
                type="button"
=======
>>>>>>> 0babf4d (Update frontend application)
                disabled={loading}
                onClick={onConfirm}
                className={`px-4 py-2.5 rounded-lg font-semibold transition disabled:opacity-60 ${accentClasses.confirmButton}`}
              >
                {loading ? "Processing..." : confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(modal, document.body);
  }
  return modal;
}

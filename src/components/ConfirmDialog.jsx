import React from "react";
<<<<<<< HEAD
import { createPortal } from "react-dom";
=======
>>>>>>> 0babf4d (Update frontend application)
import Button from "./Button";

export default function ConfirmDialog({
  open,
  title = "Confirm action",
  message = "Please confirm this action.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}) {
  React.useEffect(() => {
    if (!open) return undefined;

    const onKey = (event) => {
      if (event.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
<<<<<<< HEAD
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="atlas-theme fixed inset-0 z-[140] overflow-y-auto">
      <div
        className="atlas-modal-backdrop absolute inset-0"
        onClick={loading ? undefined : onCancel}
      />
      <div className="relative flex min-h-full items-center justify-center px-4 py-6 md:px-6 md:py-8">
        <div
          className="atlas-modal-card w-full max-w-md rounded-[1.5rem] p-5 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="platform-confirm-title"
          aria-describedby="platform-confirm-message"
        >
          <h3 id="platform-confirm-title" className="text-lg font-semibold text-[var(--atlas-text-strong)]">
            {title}
          </h3>
          <p id="platform-confirm-message" className="mt-2 text-sm leading-6 text-[var(--atlas-muted)]">
            {message}
          </p>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto sm:min-w-[9rem]">
              {cancelLabel}
            </Button>
            <Button onClick={onConfirm} disabled={loading} className="w-full sm:w-auto sm:min-w-[9rem]">
              {loading ? "Processing..." : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
=======

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[color:var(--atlas-overlay)] px-4">
      <div className="atlas-glass-card w-full max-w-md rounded-xl border border-[color:var(--atlas-border-strong)] p-5">
        <h3 className="text-lg font-semibold text-[var(--atlas-text-strong)]">{title}</h3>
        <p className="mt-2 text-sm text-[var(--atlas-muted)]">{message}</p>

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
>>>>>>> 0babf4d (Update frontend application)
  );
}

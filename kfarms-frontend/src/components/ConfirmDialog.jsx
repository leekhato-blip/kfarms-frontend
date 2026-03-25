import React from "react";
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

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[color:var(--atlas-overlay)] px-4">
      <div className="atlas-glass-card w-full max-w-md rounded-xl border border-[color:var(--atlas-border-strong)] p-5">
        <h3 className="text-lg font-semibold text-[var(--atlas-text-strong)]">{title}</h3>
        <p className="mt-2 text-sm text-[var(--atlas-muted)]">{message}</p>

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
  );
}

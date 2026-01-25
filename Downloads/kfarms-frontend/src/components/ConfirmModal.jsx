import React from "react";
import { X, AlertTriangle } from "lucide-react";

export default function ConfirmModal({
  open,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl bg-white/70 dark:bg-darkCard/70 border border-white/10 shadow-neo dark:shadow-dark p-6 animate-scaleIn">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-status-danger">
            <AlertTriangle size={20} />
            <h3 className="font-semibold">{title}</h3>
          </div>
          <button onClick={onCancel}>
            <X className="w-5 h-5 opacity-60 hover:opacity-100" />
          </button>
        </div>

        {/* Message */}
        <p className="text-sm text-textSecondary mb-6">{message}</p>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md bg-transparent border border-white/10 hover:bg-white/5"
          >
            {cancelText}
          </button>

          <button
            disabled={loading}
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-status-danger text-white hover:opacity-90 disabled:opacity-50"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

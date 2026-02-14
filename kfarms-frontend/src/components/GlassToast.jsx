import React from "react";

/**
 * GlassToast
 * - message: string
 * - type: 'success' | 'error' | 'info'
 * - duration: ms
 */
export default function GlassToast({
  message,
  type = "info",
  duration = 3000,
  onClose,
}) {
  React.useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => {
      onClose && onClose();
    }, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;

  const color =
    type === "success"
      ? "text-green-400"
      : type === "error"
        ? "text-red-400"
        : "text-textPrimary";

  return (
    <div className="toast-top">
      <div className="px-4 py-2 glass rounded-md shadow-neo dark:shadow-dark flex items-center gap-3">
        <div className={color}>
          {type === "success" ? "✔" : type === "error" ? "✖" : "ℹ"}
        </div>
        <div className="text-sm text-textPrimary">{message}</div>
      </div>
    </div>
  );
}

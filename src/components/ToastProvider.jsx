/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { createPortal } from "react-dom";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";

const ToastContext = React.createContext(null);

function iconFor(type) {
  if (type === "success") return CircleCheck;
  if (type === "error") return CircleAlert;
  return Info;
}

function styleFor(type) {
  if (type === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-100";
  }
  if (type === "error") {
    return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/30 dark:bg-violet-500/20 dark:text-violet-100";
  }
  return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/20 dark:text-blue-100";
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const dismiss = React.useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const notify = React.useCallback((message, type = "info", duration = 3600) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const value = React.useMemo(
    () => ({ notify, dismiss }),
    [notify, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== "undefined"
        ? createPortal(
            <div className="pointer-events-none fixed left-1/2 top-4 z-[110000] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-3 sm:left-auto sm:right-4 sm:translate-x-0 sm:px-0">
              {toasts.map((toast) => {
                const Icon = iconFor(toast.type);
                return (
                  <div
                    key={toast.id}
                    className={`pointer-events-auto rounded-lg border px-3 py-2 shadow-2xl backdrop-blur ${styleFor(toast.type)}`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon size={16} className="mt-0.5" />
                      <p className="flex-1 text-sm">{toast.message}</p>
                      <button
                        type="button"
                        onClick={() => dismiss(toast.id)}
                        className="rounded p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}

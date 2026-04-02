import React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

const TOAST_TONES = {
  success: {
    Icon: CheckCircle2,
    surface:
      "border-emerald-200/80 bg-[linear-gradient(180deg,rgba(240,253,244,0.96),rgba(236,253,245,0.9))] dark:border-emerald-400/20 dark:bg-[linear-gradient(180deg,rgba(6,39,24,0.96),rgba(6,58,43,0.92))]",
    glow:
      "bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(52,211,153,0.12),transparent_42%)]",
    badge:
      "border-emerald-200/75 bg-emerald-500/12 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/14 dark:text-emerald-200",
    text: "text-slate-800 dark:text-emerald-50",
    action:
      "border-emerald-200/80 bg-white/82 text-emerald-700 hover:bg-white dark:border-emerald-400/20 dark:bg-emerald-400/12 dark:text-emerald-100 dark:hover:bg-emerald-400/18",
  },
  error: {
    Icon: TriangleAlert,
    surface:
      "border-rose-200/80 bg-[linear-gradient(180deg,rgba(255,241,242,0.97),rgba(255,245,245,0.92))] dark:border-rose-400/20 dark:bg-[linear-gradient(180deg,rgba(69,10,22,0.96),rgba(76,5,25,0.92))]",
    glow:
      "bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(251,113,133,0.12),transparent_42%)]",
    badge:
      "border-rose-200/75 bg-rose-500/12 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/14 dark:text-rose-200",
    text: "text-slate-800 dark:text-rose-50",
    action:
      "border-rose-200/80 bg-white/82 text-rose-700 hover:bg-white dark:border-rose-400/20 dark:bg-rose-400/12 dark:text-rose-100 dark:hover:bg-rose-400/18",
  },
  info: {
    Icon: Info,
    surface:
      "border-sky-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.97),rgba(241,245,249,0.9))] dark:border-sky-400/20 dark:bg-[linear-gradient(180deg,rgba(8,17,32,0.97),rgba(12,25,45,0.93))]",
    glow:
      "bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_42%)]",
    badge:
      "border-sky-200/75 bg-sky-500/12 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/14 dark:text-sky-200",
    text: "text-slate-800 dark:text-slate-100",
    action:
      "border-sky-200/80 bg-white/82 text-sky-700 hover:bg-white dark:border-sky-400/20 dark:bg-sky-400/12 dark:text-sky-100 dark:hover:bg-sky-400/18",
  },
};

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
  actionLabel = "",
  onAction,
}) {
  const [mounted, setMounted] = React.useState(false);
  const [isDark, setIsDark] = React.useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );

  React.useEffect(() => {
    setMounted(true);

    if (typeof document === "undefined") return undefined;

    const syncTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  React.useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => {
      onClose && onClose();
    }, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message || !mounted || typeof document === "undefined") return null;

  const tone = TOAST_TONES[type] || TOAST_TONES.info;
  const Icon = tone.Icon;
  const showAction = Boolean(actionLabel) && typeof onAction === "function";

  return createPortal(
    <div className={isDark ? "dark" : ""} data-theme={isDark ? "dark" : "light"}>
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[140] flex justify-center px-4 sm:top-5">
        <div
          role="status"
          aria-live="polite"
          className={`pointer-events-auto relative flex w-full max-w-md items-start gap-3 overflow-hidden rounded-[1.35rem] border px-4 py-3 shadow-[0_24px_48px_rgba(15,23,42,0.16)] backdrop-blur-2xl dark:shadow-[0_24px_52px_rgba(2,6,23,0.36)] ${tone.surface}`}
        >
          <div className={`pointer-events-none absolute inset-0 opacity-90 ${tone.glow}`} />
          <span
            className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border ${tone.badge}`}
          >
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div className="relative min-w-0 flex-1 pt-0.5">
            <p className={`text-sm font-medium leading-5 ${tone.text}`}>{message}</p>
            {showAction ? (
              <button
                type="button"
                onClick={() => {
                  onAction();
                  onClose?.();
                }}
                className={`mt-2 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition ${tone.action}`}
              >
                {actionLabel}
              </button>
            ) : null}
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-900/5 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-100"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

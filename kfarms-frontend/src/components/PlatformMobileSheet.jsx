import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function PlatformMobileSheet({
  open,
  title = "Inspect",
  subtitle = "",
  onClose,
  children,
}) {
  const titleId = React.useId();
  const subtitleId = React.useId();

  React.useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="atlas-theme fixed inset-0 z-[9995] xl:hidden" role="presentation">
      <div className="atlas-modal-backdrop absolute inset-0 z-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(520px 280px at 18% 0%, rgba(59,130,246,0.16), transparent 68%), radial-gradient(420px 240px at 100% 10%, rgba(16,185,129,0.12), transparent 68%)",
        }}
        aria-hidden="true"
      />
      <button
        type="button"
        className="absolute inset-0 z-0"
        aria-label="Close inspection"
        onClick={onClose}
      />

      <div className="pointer-events-none relative z-10 flex min-h-full items-end justify-center pt-10 sm:items-center sm:px-4 sm:py-6 md:px-6 md:py-8">
        <div
          className="atlas-modal-card pointer-events-auto isolate relative flex max-h-[min(92dvh,52rem)] w-full max-w-[44rem] flex-col overflow-hidden rounded-t-[1.85rem] border-0 shadow-[0_-22px_60px_rgba(2,6,23,0.32)] sm:max-h-[min(88dvh,54rem)] sm:rounded-[1.9rem] sm:shadow-[0_28px_76px_rgba(2,6,23,0.3)]"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={subtitle ? subtitleId : undefined}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.09), transparent 18%), radial-gradient(340px 180px at 12% 0%, rgba(56,189,248,0.16), transparent 72%), radial-gradient(260px 180px at 100% 4%, rgba(34,197,94,0.14), transparent 74%)",
            }}
            aria-hidden="true"
          />

          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="relative shrink-0 border-b border-[color:var(--atlas-border-strong)]">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, color-mix(in srgb, var(--atlas-surface-strong) 94%, rgba(255,255,255,0.06) 6%) 0%, color-mix(in srgb, var(--atlas-surface) 90%, transparent 10%) 100%)",
                }}
                aria-hidden="true"
              />
              <div className="relative px-4 pb-4 pt-[max(0.85rem,env(safe-area-inset-top))] sm:px-5 sm:pb-5 sm:pt-4">
                <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-[color:var(--atlas-border-strong)] sm:hidden" />
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] shadow-[0_8px_20px_rgba(16,185,129,0.12)]"
                        style={{
                          borderColor:
                            "color-mix(in srgb, #34d399 30%, var(--atlas-border-strong) 70%)",
                          background:
                            "color-mix(in srgb, #10b981 18%, var(--atlas-surface-strong) 82%)",
                          color:
                            "color-mix(in srgb, #6ee7b7 68%, var(--atlas-text-strong) 32%)",
                        }}
                      >
                        Inspect
                      </span>
                      <span className="text-[11px] font-medium text-[var(--atlas-muted)]">
                        Responsive workspace view
                      </span>
                    </div>
                    <h2
                      id={titleId}
                      className="mt-3 truncate font-header text-[1.35rem] font-semibold leading-tight text-[var(--atlas-text-strong)] sm:text-[1.55rem]"
                    >
                      {title}
                    </h2>
                    {subtitle ? (
                      <p
                        id={subtitleId}
                        className="mt-2 max-w-2xl break-words text-sm leading-6 text-[var(--atlas-muted)] sm:text-[0.95rem]"
                      >
                        {subtitle}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)]/92 text-[var(--atlas-text-strong)] shadow-[0_12px_24px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 hover:bg-[color:var(--atlas-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--atlas-surface)] dark:shadow-[0_16px_32px_rgba(0,0,0,0.24)]"
                    aria-label="Close inspection"
                  >
                    <X className="h-[18px] w-[18px]" />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-8"
                style={{
                  background:
                    "linear-gradient(180deg, color-mix(in srgb, var(--atlas-surface) 42%, transparent) 0%, transparent 100%)",
                }}
              />
              <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 sm:px-5 sm:pb-5 sm:pt-5">
                <div className="mx-auto w-full max-w-3xl">
                  {children}
                </div>
              </div>
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-12"
                style={{
                  background:
                    "linear-gradient(0deg, color-mix(in srgb, var(--atlas-surface-strong) 85%, transparent) 0%, color-mix(in srgb, var(--atlas-surface-strong) 25%, transparent) 52%, transparent 100%)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

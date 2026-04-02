/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

export const GUIDED_FORM_LABEL_CLASS =
  "mb-1 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-200";
export const GUIDED_FORM_ICON_CLASS = "h-4 w-4 text-slate-500 dark:text-slate-400";
export const GUIDED_FORM_FIELD_CLASS =
  "w-full rounded-lg border border-white/20 bg-white/80 px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-500/10 dark:border-white/10 dark:bg-black/60 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-sky-400/50 dark:focus:ring-sky-500/20 dark:[color-scheme:dark]";
export const GUIDED_FORM_READONLY_FIELD_CLASS =
  "w-full rounded-lg border border-slate-200/70 bg-slate-100/90 px-3 py-3 text-sm text-slate-700 outline-none dark:border-white/10 dark:bg-slate-950/65 dark:text-slate-200 dark:[color-scheme:dark]";
export const GUIDED_FORM_SECONDARY_BUTTON_CLASS =
  "rounded-lg border border-slate-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15";
export const GUIDED_FORM_PRIMARY_BUTTON_CLASS =
  "rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-accent-primary/55 disabled:text-white/75 disabled:shadow-none";
export const GUIDED_FORM_PRIMARY_SUBMIT_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-accent-primary px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-accent-primary/55 disabled:text-white/75 disabled:shadow-none";

export function handleGuidedFormAdvanceClick(event, onAdvance) {
  event.preventDefault();
  event.stopPropagation();

  if (typeof onAdvance !== "function") return;

  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => {
      onAdvance();
    });
    return;
  }

  onAdvance();
}

export function GuidedFormSection({
  title,
  description = "",
  children,
  className = "",
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/20 bg-white/55 p-4 shadow-soft dark:border-white/10 dark:bg-white/[0.04] sm:p-5",
        className,
      )}
    >
      {(title || description) && (
        <div className="mb-4">
          {title ? (
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {title}
            </h3>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {description}
            </p>
          ) : null}
        </div>
      )}
      {children}
    </section>
  );
}

export default function GuidedFormModal({
  open,
  onClose,
  onSubmit,
  saving = false,
  icon: Icon,
  title,
  description,
  editing = false,
  steps = [],
  currentStep = 0,
  maxWidth = "max-w-xl",
  errorMessage = "",
  footer = null,
  children,
}) {
  if (!open) return null;
  if (typeof document === "undefined") return null;

  const safeCurrentStep = Math.min(Math.max(currentStep, 0), Math.max(steps.length - 1, 0));

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto px-4 py-6 sm:py-8">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-md"
        onClick={saving ? undefined : onClose}
      />

      <form
        onSubmit={onSubmit}
        className={cn(
          "relative mx-auto flex min-h-full w-full items-center justify-center rounded-2xl p-1 animate-fadeIn",
          maxWidth,
        )}
        aria-modal="true"
        role="dialog"
      >
        <div className="rounded-2xl bg-darkCard/60 shadow-neo p-px">
          <div className="max-h-[92vh] overflow-y-auto rounded-2xl border border-white/20 bg-white/80 p-5 text-slate-900 backdrop-blur-xl dark:bg-black/70 dark:text-slate-100 sm:p-6">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary">
                    {Icon ? <Icon className="h-5 w-5" aria-hidden="true" /> : null}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                        {title}
                      </h2>
                      <span className="rounded-full border border-white/20 bg-white/50 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {editing ? "Editing" : "New"}
                      </span>
                    </div>
                    <p className="mt-1 hidden text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:block">
                      {description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  aria-label="Close form"
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-white/10 disabled:opacity-60"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {steps.length ? (
                <div className="rounded-2xl border border-sky-200/60 bg-sky-50/80 p-3 dark:border-sky-500/20 dark:bg-sky-500/10">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {steps.map((step, index) => {
                      const active = index === safeCurrentStep;
                      const complete = index < safeCurrentStep;
                      return (
                        <div
                          key={`${step.title}-${index}`}
                          className={cn(
                            "rounded-xl border px-3 py-3 transition",
                            active
                              ? "border-sky-300 bg-white text-slate-900 shadow-soft dark:border-sky-400/40 dark:bg-white/10 dark:text-slate-50"
                              : "border-transparent bg-white/60 text-slate-600 dark:bg-white/[0.03] dark:text-slate-300",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={cn(
                                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                                complete
                                  ? "bg-emerald-500 text-white"
                                  : active
                                    ? "bg-sky-600 text-white"
                                    : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100",
                              )}
                            >
                              {complete ? <Check className="h-4 w-4" /> : index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold">{step.title}</p>
                              {step.description ? (
                                <p className="mt-0.5 hidden text-xs leading-relaxed opacity-80 sm:block">
                                  {step.description}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {errorMessage ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-200">
                  {errorMessage}
                </div>
              ) : null}

              <div className="space-y-4">{children}</div>

              {footer}
            </div>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  );
}

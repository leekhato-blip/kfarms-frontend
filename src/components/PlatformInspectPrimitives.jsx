import React from "react";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export function PlatformInspectSection({
  eyebrow,
  title,
  description,
  action = null,
  children,
  className = "",
  contentClassName = "",
}) {
  return (
    <section
      className={joinClasses(
        "rounded-[1.28rem] border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)]/78 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] sm:p-5 dark:shadow-[0_18px_44px_rgba(0,0,0,0.2)]",
        className,
      )}
    >
      {(eyebrow || title || description || action) ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {eyebrow ? (
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                {eyebrow}
              </div>
            ) : null}
            {title ? (
              <h3 className="mt-1 text-base font-semibold text-[var(--atlas-text-strong)] sm:text-[1.05rem]">
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm leading-6 text-[var(--atlas-muted)]">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="w-full sm:w-auto sm:shrink-0">{action}</div> : null}
        </div>
      ) : null}

      {children ? (
        <div className={joinClasses(title || description || action || eyebrow ? "mt-4" : "", contentClassName)}>
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function PlatformInspectStatCard({
  label,
  value,
  hint = "",
  badge = null,
  className = "",
  valueClassName = "",
}) {
  return (
    <div
      className={joinClasses(
        "rounded-[1.05rem] border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface)]/72 p-3.5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] dark:shadow-[0_14px_30px_rgba(0,0,0,0.16)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
            {label}
          </div>
          <div
            className={joinClasses(
              "mt-2 break-words text-base font-semibold leading-6 text-[var(--atlas-text-strong)]",
              valueClassName,
            )}
          >
            {value}
          </div>
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>
      {hint ? (
        <div className="mt-2 text-xs leading-5 text-[var(--atlas-muted)]">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

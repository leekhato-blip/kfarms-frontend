import React from "react";

/**
 * AuthCard is a centered card with header slot.
 */
export default function AuthCard({
  title,
  subtitle,
  trustText,
  accentColor = "",
  className = "",
  children,
}) {
  const resolvedClassName = [
    "mx-auto w-full rounded-lg border border-slate-200/80 bg-white/85 p-4 shadow-neo backdrop-blur-xl dark:border-white/10 dark:bg-darkCard/75 dark:shadow-dark sm:p-7 md:p-8",
    className || "max-w-md",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={resolvedClassName}>
      {title && (
        <h2
          className="mb-1.5 font-header tracking-tight text-h2 text-accent-primary"
          style={accentColor ? { color: accentColor } : undefined}
        >
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="mb-2 font-body text-sm text-slate-600 dark:text-darkText sm:text-base">
          {subtitle}
        </p>
      )}
      {trustText && (
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 sm:mb-5 sm:text-xs">
          {trustText}
        </p>
      )}
      <div>{children}</div>
    </div>
  );
}

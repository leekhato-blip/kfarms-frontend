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
<<<<<<< HEAD
    "mx-auto w-full rounded-lg border border-slate-200/80 bg-white/85 p-4 shadow-neo backdrop-blur-xl dark:border-white/10 dark:bg-darkCard/75 dark:shadow-dark sm:p-7 md:p-8",
=======
    "mx-auto w-full rounded-lg border border-slate-200/80 bg-white/85 p-5 shadow-neo backdrop-blur-xl dark:border-white/10 dark:bg-darkCard/75 dark:shadow-dark sm:p-8",
>>>>>>> 0babf4d (Update frontend application)
    className || "max-w-md",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={resolvedClassName}>
      {title && (
        <h2
<<<<<<< HEAD
          className="mb-1.5 font-header tracking-tight text-h2 text-accent-primary"
=======
          className="mb-2 font-header tracking-tight text-h2 text-accent-primary"
>>>>>>> 0babf4d (Update frontend application)
          style={accentColor ? { color: accentColor } : undefined}
        >
          {title}
        </h2>
      )}
      {subtitle && (
<<<<<<< HEAD
        <p className="mb-2 font-body text-sm text-slate-600 dark:text-darkText sm:text-base">
=======
        <p className="mb-2 font-body text-base text-slate-600 dark:text-darkText">
>>>>>>> 0babf4d (Update frontend application)
          {subtitle}
        </p>
      )}
      {trustText && (
<<<<<<< HEAD
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 sm:mb-5 sm:text-xs">
=======
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 sm:mb-6">
>>>>>>> 0babf4d (Update frontend application)
          {trustText}
        </p>
      )}
      <div>{children}</div>
    </div>
  );
}

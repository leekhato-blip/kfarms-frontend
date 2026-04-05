import React from "react";
import { ChevronDown } from "lucide-react";

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

export default function MobileAccordionCard({
  title,
  description = "",
  icon = null,
  defaultOpen = false,
  className = "",
  bodyClassName = "",
  children,
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/10 shadow-neo dark:bg-darkCard/70 dark:shadow-dark",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start justify-between gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-start gap-3">
          {icon ? (
            <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-accent-primary dark:text-blue-200">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </div>
            {description ? (
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
          {open ? "Hide" : "Show"}
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
          />
        </span>
      </button>

      {open ? (
        <div className={cn("border-t border-white/10 p-4 pt-4", bodyClassName)}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

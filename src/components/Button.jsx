import React from "react";

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

const VARIANTS = {
  primary:
<<<<<<< HEAD
    "border border-white/10 bg-[linear-gradient(135deg,#4c1d95_0%,#6d28d9_34%,#4f46e5_68%,#2563eb_100%)] text-white shadow-[0_16px_34px_rgba(79,70,229,0.26),0_8px_20px_rgba(37,99,235,0.16)] hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_22px_42px_rgba(79,70,229,0.3),0_12px_26px_rgba(37,99,235,0.18)]",
  ghost:
    "bg-transparent text-[var(--atlas-text)] shadow-[0_10px_22px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 hover:bg-[color:var(--atlas-surface-soft)]/80 hover:text-[var(--atlas-text-strong)] hover:shadow-[0_16px_30px_rgba(15,23,42,0.09)] dark:shadow-[0_12px_24px_rgba(0,0,0,0.18)] dark:hover:shadow-[0_18px_32px_rgba(0,0,0,0.26)]",
  outline:
    "border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)]/85 text-[var(--atlas-text-strong)] shadow-[0_12px_24px_rgba(15,23,42,0.07),0_4px_12px_rgba(59,130,246,0.06)] hover:-translate-y-0.5 hover:bg-[color:var(--atlas-surface-hover)] hover:shadow-[0_18px_34px_rgba(15,23,42,0.11),0_8px_18px_rgba(59,130,246,0.08)] dark:shadow-[0_14px_28px_rgba(0,0,0,0.22)] dark:hover:shadow-[0_18px_34px_rgba(0,0,0,0.3)]",
  danger:
    "bg-rose-600/90 text-white shadow-[0_14px_28px_rgba(225,29,72,0.24)] hover:-translate-y-0.5 hover:bg-rose-500 hover:shadow-[0_18px_34px_rgba(225,29,72,0.28)]",
};

const SIZES = {
  sm: "min-h-10 px-4 text-[0.8125rem]",
  md: "min-h-11 px-[1.125rem] text-sm",
  lg: "min-h-12 px-6 text-sm",
=======
    "bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500 text-white shadow-[0_8px_24px_rgba(59,130,246,0.28)] hover:brightness-110",
  ghost: "bg-transparent text-[var(--atlas-text)] hover:bg-[color:var(--atlas-surface-soft)]",
  outline:
    "border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)] text-[var(--atlas-text-strong)] hover:bg-[color:var(--atlas-surface-hover)]",
  danger: "bg-rose-600/90 text-white hover:bg-rose-500",
};

const SIZES = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
>>>>>>> 0babf4d (Update frontend application)
};

const Button = React.forwardRef(function Button(
  { variant = "primary", size = "md", className = "", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
<<<<<<< HEAD
        "inline-flex shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-[1rem] text-center font-semibold leading-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50",
=======
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
>>>>>>> 0babf4d (Update frontend application)
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        className,
      )}
      {...props}
    />
  );
});

export default Button;

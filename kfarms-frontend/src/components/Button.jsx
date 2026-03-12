import React from "react";

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

const VARIANTS = {
  primary:
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
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        className,
      )}
      {...props}
    />
  );
});

export default Button;

import React from "react";

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

export default function Card({
  children,
  className = "",
  interactive = false,
  glowRail = true,
  as = "section",
  ...props
}) {
  const Component = as;
  return (
    <Component
      className={cn(
        "atlas-glass-card rounded-[1.4rem] p-4 text-[var(--atlas-text)]",
        glowRail && "atlas-glow-rail",
        interactive && "atlas-lift",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

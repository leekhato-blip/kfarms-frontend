import React from "react";
import Card from "./Card";
import { replaceCurrencyCodeWithSymbol } from "../utils/formatters";

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

function metricToneColors(tone) {
  if (tone === "green") {
    return {
      primary: "#22c55e",
      secondary: "#86efac",
      faint: "rgba(34, 197, 94, 0.14)",
    };
  }
  if (tone === "blue") {
    return {
      primary: "#2563eb",
      secondary: "#93c5fd",
      faint: "rgba(37, 99, 235, 0.16)",
    };
  }
  if (tone === "amber") {
    return {
      primary: "#d97706",
      secondary: "#fcd34d",
      faint: "rgba(217, 119, 6, 0.16)",
    };
  }
  return {
    primary: "#7c3aed",
    secondary: "#c4b5fd",
    faint: "rgba(124, 58, 237, 0.16)",
  };
}

function MetricSparkline({ tone }) {
  const colors = metricToneColors(tone);

  return (
    <svg
      viewBox="0 0 124 56"
      className="h-9 w-20 shrink-0 sm:h-10 sm:w-24"
      aria-hidden="true"
    >
      <path
        d="M4 35 C14 18, 24 18, 32 34 S50 52, 58 34 76 16, 86 29 100 48, 120 24"
        fill="none"
        stroke={colors.primary}
        strokeWidth="3.2"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 6px 12px ${colors.faint})` }}
      />
      <path
        d="M4 39 C16 30, 25 31, 34 40 S50 48, 59 37 76 28, 86 35 101 45, 120 34"
        fill="none"
        stroke={colors.secondary}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export default function PlatformMetricCard({
  icon,
  label,
  value,
  hint,
  tone = "purple",
  className = "",
}) {
  const IconComponent = icon;
  const displayValue = replaceCurrencyCodeWithSymbol(value);
  const displayHint = replaceCurrencyCodeWithSymbol(hint);

  return (
    <Card
      className={cn("atlas-platform-metric-card h-full px-4 py-3.5 sm:px-4 sm:py-3.5", className)}
      glowRail={false}
      data-tone={tone}
    >
      <div className="atlas-platform-metric-shell">
        {IconComponent ? (
          <div className="pointer-events-none absolute right-0 top-0">
            <span className="atlas-platform-metric-icon" data-tone={tone}>
              <IconComponent size={16} />
            </span>
          </div>
        ) : null}

        <div className={cn("mt-0", IconComponent && "pr-14")}>
          <div className="atlas-platform-metric-value">{displayValue}</div>
          <div className="atlas-platform-metric-label" title={label}>
            {label}
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          {displayHint ? (
            <div
              className="atlas-platform-metric-hint"
              title={displayHint}
            >
              {displayHint}
            </div>
          ) : (
            <span />
          )}
          <MetricSparkline tone={tone} />
        </div>
      </div>
    </Card>
  );
}

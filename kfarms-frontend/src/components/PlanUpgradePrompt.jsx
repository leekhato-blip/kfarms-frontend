import React from "react";
import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { getPlanById, normalizePlanId } from "../constants/plans";

export default function PlanUpgradePrompt({
  title = "Upgrade required",
  description = "",
  feature = "this feature",
  requiredPlan = "PRO",
  compact = false,
  className = "",
}) {
  const normalizedPlan = normalizePlanId(requiredPlan, "PRO");
  const plan = getPlanById(normalizedPlan, "PRO");
  const highlights = Array.isArray(plan?.highlights) ? plan.highlights.slice(0, 3) : [];
  const upgradePath =
    normalizedPlan === "ENTERPRISE"
      ? plan.ctaPath || "/product-profile#contact"
      : `/billing?plan=${normalizedPlan}`;
  const upgradeLabel =
    normalizedPlan === "ENTERPRISE"
      ? plan.ctaLabel || "Talk to Sales"
      : `Upgrade to ${plan.name}`;

  return (
    <div
      className={`relative isolate overflow-hidden rounded-xl border border-sky-200/70 bg-slate-50/85 p-4 text-lightText shadow-neo backdrop-blur-xl dark:border-sky-500/20 dark:bg-[#061024]/90 dark:text-darkText dark:shadow-[0_22px_40px_rgba(2,8,24,0.45)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(108deg,rgba(37,99,235,0.17)_0%,rgba(14,116,144,0.14)_48%,rgba(16,185,129,0.12)_100%),radial-gradient(circle_at_12%_22%,rgba(56,189,248,0.13),transparent_43%),radial-gradient(circle_at_90%_22%,rgba(16,185,129,0.14),transparent_38%)] dark:bg-[linear-gradient(108deg,rgba(6,19,43,0.96)_0%,rgba(7,32,63,0.9)_48%,rgba(6,58,55,0.84)_100%),radial-gradient(circle_at_12%_22%,rgba(56,189,248,0.16),transparent_43%),radial-gradient(circle_at_90%_22%,rgba(16,185,129,0.18),transparent_38%)]" />

      <div className="relative z-10 flex items-start gap-3">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-primary/15 text-accent-primary dark:bg-accent-primary/25 dark:text-blue-200">
          <Lock className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold font-header text-slate-900 dark:text-darkText">{title}</div>
          <div className="mt-1 text-xs text-slate-700/90 dark:text-slate-300">
            {description || (
              <>
                You are currently on the <span className="font-semibold">Free</span> plan.{" "}
                <span className="font-semibold">{feature}</span> is available on{" "}
                <span className="font-semibold">{plan.name}</span>.
              </>
            )}
          </div>
        </div>
      </div>

      {highlights.length > 0 && (
        <div className={`relative z-10 mt-3 ${compact ? "space-y-1.5" : "space-y-2"}`}>
          {highlights.map((item) => (
            <div key={item} className="flex items-start gap-2 text-xs text-slate-800/95 dark:text-slate-200">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-primary dark:text-blue-300" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10 mt-4 flex flex-wrap gap-2">
        <Link
          to={upgradePath}
          className="inline-flex items-center justify-center rounded-md border border-accent-primary/40 bg-accent-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
        >
          {upgradeLabel}
        </Link>
        <Link
          to="/billing"
          className="inline-flex items-center justify-center rounded-md border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-darkText dark:hover:bg-white/20"
        >
          Compare plans
        </Link>
      </div>
    </div>
  );
}

import React from "react";
import { normalizePlanId } from "../constants/plans";
import {
  getWorkspaceRoleLabel,
  normalizeWorkspaceRole,
} from "../utils/workspaceRoles";

function normalize(value) {
  return String(value ?? "").trim().toUpperCase();
}

const BASE = "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide";

const PLAN = {
  FREE: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/60 dark:bg-blue-500/10 dark:text-blue-200",
  PRO: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/60 dark:bg-violet-500/20 dark:text-violet-200 dark:shadow-[0_0_12px_rgba(139,92,246,0.45)]",
  ENTERPRISE:
    "atlas-shimmer border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/60 dark:bg-emerald-500/20 dark:text-emerald-200 dark:shadow-[0_0_14px_rgba(16,185,129,0.45)]",
};

const STATUS = {
  ACTIVE:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/90 dark:bg-emerald-300/85 dark:text-emerald-950 dark:shadow-[0_0_0_1px_rgba(16,185,129,0.22),0_0_14px_rgba(16,185,129,0.16)]",
  SUSPENDED:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/90 dark:bg-amber-300/84 dark:text-amber-950 dark:shadow-[0_0_0_1px_rgba(251,191,36,0.2),0_0_12px_rgba(251,191,36,0.14)]",
};

const ROLE = {
  OWNER:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200",
  ADMIN:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/50 dark:bg-violet-500/20 dark:text-violet-200",
  MANAGER:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-200",
  STAFF:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/40 dark:bg-blue-500/10 dark:text-blue-200",
  USER:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/40 dark:bg-blue-500/10 dark:text-blue-200",
  PLATFORM_ADMIN:
    "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-400/50 dark:bg-fuchsia-500/20 dark:text-fuchsia-200",
};

const ACTIVE = {
  ENABLED:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/90 dark:bg-emerald-300/85 dark:text-emerald-950 dark:shadow-[0_0_0_1px_rgba(16,185,129,0.22)]",
  DISABLED:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-300/90 dark:bg-rose-300/82 dark:text-rose-950 dark:shadow-[0_0_0_1px_rgba(244,63,94,0.2)]",
};

export default function Badge({ kind = "plan", value }) {
  const normalized = normalize(value);
  const normalizedPlan = kind === "plan" ? normalizePlanId(value, "") : "";
  const normalizedRole =
    kind === "role" ? normalizeWorkspaceRole(value, normalized || "STAFF") : "";

  let classes = "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/20 dark:bg-white/10 dark:text-slate-200";
  if (kind === "plan") classes = PLAN[normalizedPlan] || classes;
  if (kind === "status") classes = STATUS[normalized] || classes;
  if (kind === "role") classes = ROLE[normalizedRole] || classes;
  if (kind === "active") classes = ACTIVE[normalized] || classes;

  const label =
    kind === "plan"
      ? normalizedPlan || normalized
      : kind === "role"
        ? getWorkspaceRoleLabel(value)
        : normalized;
  return <span className={`${BASE} ${classes}`}>{label || "-"}</span>;
}

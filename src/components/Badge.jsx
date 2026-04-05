import React from "react";
import { normalizePlanId } from "../constants/plans";
import {
<<<<<<< HEAD
  getPlatformRoleLabel,
  normalizePlatformRole,
} from "../utils/platformRoles";
import {
=======
>>>>>>> 0babf4d (Update frontend application)
  getWorkspaceRoleLabel,
  normalizeWorkspaceRole,
} from "../utils/workspaceRoles";

function normalize(value) {
  return String(value ?? "").trim().toUpperCase();
}

<<<<<<< HEAD
const PLAN_LABELS = {
  FREE: "Free",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

const BASE =
  "relative isolate inline-flex min-h-[1.85rem] items-center justify-center whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-semibold leading-none tracking-[0.02em] transition-shadow duration-200";

const PLAN = {
  FREE:
    "border-slate-300/90 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.08)] dark:border-slate-500/35 dark:bg-[linear-gradient(180deg,rgba(51,65,85,0.42),rgba(15,23,42,0.26))] dark:text-slate-100 dark:shadow-[0_0_0_1px_rgba(148,163,184,0.16),0_0_14px_rgba(15,23,42,0.18)]",
  PRO:
    "border-sky-300/90 bg-[linear-gradient(180deg,#eff6ff_0%,#dbeafe_100%)] text-sky-800 shadow-[0_10px_22px_rgba(37,99,235,0.12)] dark:border-sky-400/35 dark:bg-[linear-gradient(180deg,rgba(37,99,235,0.38),rgba(8,145,178,0.22))] dark:text-sky-50 dark:shadow-[0_0_0_1px_rgba(59,130,246,0.22),0_0_16px_rgba(14,165,233,0.16)]",
  ENTERPRISE:
    "atlas-shimmer border-amber-300/85 bg-[linear-gradient(180deg,#fff8e6_0%,#fde68a_100%)] text-amber-950 shadow-[0_10px_24px_rgba(245,158,11,0.14)] dark:border-amber-400/40 dark:bg-[linear-gradient(180deg,rgba(180,83,9,0.5),rgba(120,53,15,0.36))] dark:text-amber-50 dark:shadow-[0_0_0_1px_rgba(245,158,11,0.24),0_0_18px_rgba(180,83,9,0.18)]",
=======
const BASE = "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide";

const PLAN = {
  FREE: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/60 dark:bg-blue-500/10 dark:text-blue-200",
  PRO: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/60 dark:bg-violet-500/20 dark:text-violet-200 dark:shadow-[0_0_12px_rgba(139,92,246,0.45)]",
  ENTERPRISE:
    "atlas-shimmer border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/60 dark:bg-emerald-500/20 dark:text-emerald-200 dark:shadow-[0_0_14px_rgba(16,185,129,0.45)]",
>>>>>>> 0babf4d (Update frontend application)
};

const STATUS = {
  ACTIVE:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/90 dark:bg-emerald-300/85 dark:text-emerald-950 dark:shadow-[0_0_0_1px_rgba(16,185,129,0.22),0_0_14px_rgba(16,185,129,0.16)]",
  SUSPENDED:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/90 dark:bg-amber-300/84 dark:text-amber-950 dark:shadow-[0_0_0_1px_rgba(251,191,36,0.2),0_0_12px_rgba(251,191,36,0.14)]",
<<<<<<< HEAD
  OPEN:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/45 dark:bg-sky-500/14 dark:text-sky-100 dark:shadow-[0_0_0_1px_rgba(56,189,248,0.2),0_0_14px_rgba(14,165,233,0.1)]",
  PENDING:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/45 dark:bg-amber-500/14 dark:text-amber-100 dark:shadow-[0_0_0_1px_rgba(251,191,36,0.2),0_0_14px_rgba(245,158,11,0.1)]",
  RESOLVED:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/45 dark:bg-emerald-500/14 dark:text-emerald-100 dark:shadow-[0_0_0_1px_rgba(16,185,129,0.2),0_0_14px_rgba(16,185,129,0.1)]",
=======
>>>>>>> 0babf4d (Update frontend application)
};

const ROLE = {
  OWNER:
<<<<<<< HEAD
    "border-amber-300/80 bg-amber-100 text-amber-950 shadow-[0_8px_18px_rgba(245,158,11,0.12)] dark:border-amber-400/45 dark:bg-amber-500/20 dark:text-amber-50 dark:shadow-[0_0_0_1px_rgba(245,158,11,0.22),0_0_14px_rgba(245,158,11,0.1)]",
  ADMIN:
    "border-fuchsia-300/80 bg-fuchsia-100 text-fuchsia-900 shadow-[0_8px_18px_rgba(217,70,239,0.12)] dark:border-fuchsia-400/45 dark:bg-fuchsia-500/16 dark:text-fuchsia-100 dark:shadow-[0_0_0_1px_rgba(217,70,239,0.22),0_0_14px_rgba(217,70,239,0.1)]",
  MANAGER:
    "border-emerald-300/80 bg-emerald-100 text-emerald-900 shadow-[0_8px_18px_rgba(16,185,129,0.12)] dark:border-emerald-400/45 dark:bg-emerald-500/16 dark:text-emerald-100 dark:shadow-[0_0_0_1px_rgba(16,185,129,0.22),0_0_14px_rgba(16,185,129,0.1)]",
  STAFF:
    "border-sky-300/80 bg-sky-100 text-sky-900 shadow-[0_8px_18px_rgba(14,165,233,0.12)] dark:border-sky-400/45 dark:bg-sky-500/16 dark:text-sky-100 dark:shadow-[0_0_0_1px_rgba(14,165,233,0.22),0_0_14px_rgba(14,165,233,0.1)]",
  PLATFORM_OWNER:
    "border-violet-300/90 bg-violet-100 text-violet-950 shadow-[0_10px_24px_rgba(139,92,246,0.14)] dark:border-violet-500/45 dark:bg-[linear-gradient(180deg,rgba(91,33,182,0.54),rgba(59,7,100,0.36))] dark:text-violet-50 dark:shadow-[0_0_0_1px_rgba(139,92,246,0.3),0_0_18px_rgba(109,40,217,0.18)]",
  PLATFORM_USER:
    "border-slate-300/80 bg-slate-100 text-slate-900 shadow-[0_8px_18px_rgba(51,65,85,0.12)] dark:border-slate-500/38 dark:bg-[linear-gradient(180deg,rgba(71,85,105,0.5),rgba(30,41,59,0.38))] dark:text-slate-50 dark:shadow-[0_0_0_1px_rgba(148,163,184,0.22),0_0_16px_rgba(15,23,42,0.24)]",
  PLATFORM_STAFF:
    "border-cyan-300/80 bg-cyan-100 text-cyan-950 shadow-[0_8px_18px_rgba(14,165,233,0.12)] dark:border-cyan-500/42 dark:bg-[linear-gradient(180deg,rgba(8,145,178,0.48),rgba(14,116,144,0.34))] dark:text-cyan-50 dark:shadow-[0_0_0_1px_rgba(6,182,212,0.28),0_0_16px_rgba(8,145,178,0.16)]",
  PLATFORM_ADMIN:
    "border-blue-300/90 bg-blue-100 text-blue-950 shadow-[0_10px_24px_rgba(59,130,246,0.14)] dark:border-blue-500/45 dark:bg-[linear-gradient(180deg,rgba(37,99,235,0.5),rgba(30,64,175,0.36))] dark:text-blue-50 dark:shadow-[0_0_0_1px_rgba(59,130,246,0.3),0_0_18px_rgba(37,99,235,0.18)]",
  USER:
    "border-slate-300 bg-slate-100 text-slate-800 shadow-[0_8px_18px_rgba(15,23,42,0.08)] dark:border-slate-300/40 dark:bg-[linear-gradient(180deg,rgba(71,85,105,0.34),rgba(30,41,59,0.2))] dark:text-slate-50 dark:shadow-[0_0_0_1px_rgba(148,163,184,0.18),0_0_14px_rgba(15,23,42,0.18)]",
};

const PLATFORM_ROLE = {
  PLATFORM_OWNER: "atlas-platform-role-badge atlas-platform-role-badge--owner",
  PLATFORM_ADMIN: "atlas-platform-role-badge atlas-platform-role-badge--admin",
  PLATFORM_STAFF: "atlas-platform-role-badge atlas-platform-role-badge--staff",
  PLATFORM_USER: "atlas-platform-role-badge atlas-platform-role-badge--user",
};

const STATUS_BADGE = {
  ACTIVE: "atlas-status-badge--active",
  SUSPENDED: "atlas-status-badge--suspended",
  OPEN: "atlas-status-badge--open",
  PENDING: "atlas-status-badge--pending",
  RESOLVED: "atlas-status-badge--resolved",
=======
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
>>>>>>> 0babf4d (Update frontend application)
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
<<<<<<< HEAD
  const normalizedPlatformRole =
    kind === "platform-role"
      ? normalizePlatformRole(value, normalized || "PLATFORM_USER")
      : "";

  let classes = "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/20 dark:bg-white/10 dark:text-slate-200";
  if (kind === "plan") classes = PLAN[normalizedPlan] || classes;
  if (kind === "status") classes = STATUS_BADGE[normalized] || STATUS[normalized] || classes;
  if (kind === "role") classes = ROLE[normalizedRole] || classes;
  if (kind === "platform-role") classes = PLATFORM_ROLE[normalizedPlatformRole] || ROLE[normalizedPlatformRole] || classes;
=======

  let classes = "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/20 dark:bg-white/10 dark:text-slate-200";
  if (kind === "plan") classes = PLAN[normalizedPlan] || classes;
  if (kind === "status") classes = STATUS[normalized] || classes;
  if (kind === "role") classes = ROLE[normalizedRole] || classes;
>>>>>>> 0babf4d (Update frontend application)
  if (kind === "active") classes = ACTIVE[normalized] || classes;

  const label =
    kind === "plan"
<<<<<<< HEAD
      ? PLAN_LABELS[normalizedPlan] || normalizedPlan || normalized
      : kind === "platform-role"
        ? getPlatformRoleLabel(value)
      : kind === "role"
        ? getWorkspaceRoleLabel(value)
        : normalized;
  return (
    <span className={`${BASE} ${classes}`}>
      <span className="relative z-[1]">{label || "-"}</span>
    </span>
  );
=======
      ? normalizedPlan || normalized
      : kind === "role"
        ? getWorkspaceRoleLabel(value)
        : normalized;
  return <span className={`${BASE} ${classes}`}>{label || "-"}</span>;
>>>>>>> 0babf4d (Update frontend application)
}

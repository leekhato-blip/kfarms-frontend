import React from "react";
import {
  Copy,
  History,
  MailPlus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRoundCog,
  Users,
  X,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Table from "../components/Table";
import Badge from "../components/Badge";
import Button from "../components/Button";
import ConfirmModal from "../components/ConfirmModal";
import FarmerGuideCard from "../components/FarmerGuideCard";
import FilteredResultsHint from "../components/FilteredResultsHint";
import GlassToast from "../components/GlassToast";
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../tenant/TenantContext";
import { normalizePlanId } from "../constants/plans";
import { formatDateTime, formatNumber } from "../utils/formatters";
import {
  canAssignWorkspaceRole,
  canManageWorkspaceMember,
  getManageableWorkspaceRoleOptions,
  getWorkspaceRoleLabel,
  getWorkspaceRoleRank,
  normalizeWorkspaceRole,
} from "../utils/workspaceRoles";
import {
  ENTERPRISE_PERMISSION_OPTIONS,
  WORKSPACE_PERMISSIONS,
  hasAnyWorkspacePermission,
  normalizeWorkspacePermissions,
  resolveWorkspacePermissions,
} from "../utils/workspacePermissions";
import {
  createInvitation,
  listAuditLogs,
  listPendingInvitations,
  listTeamMembers,
  removeMember,
  revokeInvitation,
  updateMemberActive,
  updateMemberPermissions,
  updateMemberRole,
} from "../services/teamService";

const TABLE_PAGE_SIZE = 5;
const AUDIT_PAGE_SIZE = 10;
const inputClassName =
  "h-10 w-full rounded-md border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] px-3 text-sm text-[var(--atlas-text-strong)] outline-none placeholder:text-[var(--atlas-muted-soft)] focus:border-blue-400/50";
const selectClassName = `${inputClassName} [color-scheme:light] dark:[color-scheme:dark]`;
const compactSelectClassName =
  "h-9 rounded-md border border-slate-200/80 bg-white/80 px-3 text-sm text-slate-700 [color-scheme:light] dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-100 dark:[color-scheme:dark]";
const headerPanelClass =
  "rounded-2xl border border-sky-200/70 bg-slate-50/85 shadow-neo dark:border-sky-500/20 dark:bg-[#061024]/90 dark:shadow-[0_22px_40px_rgba(2,8,24,0.45)]";
const glassPanelClass =
  "rounded-xl border border-white/10 bg-white/10 shadow-neo dark:bg-darkCard/70 dark:shadow-dark";
const insetPanelClass =
  "rounded-lg border border-white/10 bg-white/5 dark:bg-darkCard/60";
const tableWrapperClass =
  "relative isolate !rounded-[26px] !border-slate-200/80 !bg-white/72 shadow-[0_26px_60px_rgba(15,23,42,0.12)] ring-1 ring-white/60 backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-sky-300/60 before:to-transparent before:content-[''] dark:!border-sky-500/18 dark:!bg-slate-950/62 dark:ring-white/5 dark:shadow-[0_28px_70px_rgba(2,8,23,0.55)] dark:before:via-sky-400/35";
const tableHeadClass = "bg-transparent";
const tableBodyClass =
  "divide-y-0 text-slate-700 dark:text-slate-200";
const tableRowClass = "group";
const premiumDesktopTableClass =
  "border-separate [border-spacing:0_6px] [&_thead_th]:border-y [&_thead_th]:border-slate-700/70 [&_thead_th]:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.9))] [&_thead_th]:px-5 [&_thead_th]:py-3 [&_thead_th]:font-header [&_thead_th]:text-[10px] [&_thead_th]:font-semibold [&_thead_th]:uppercase [&_thead_th]:tracking-[0.2em] [&_thead_th]:text-slate-300 [&_thead_th]:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] [&_thead_th]:first:rounded-l-[18px] [&_thead_th]:last:rounded-r-[18px] [&_tbody_td]:border-y [&_tbody_td]:border-slate-200/75 dark:[&_tbody_td]:border-slate-800/80 [&_tbody_td]:bg-white/82 dark:[&_tbody_td]:bg-slate-950/55 [&_tbody_td]:shadow-[inset_0_1px_0_rgba(255,255,255,0.38)] dark:[&_tbody_td]:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] [&_tbody_td]:backdrop-blur-xl [&_tbody_tr>td:first-child]:border-l [&_tbody_tr>td:last-child]:border-r [&_tbody_tr>td:first-child]:rounded-l-[22px] [&_tbody_tr>td:last-child]:rounded-r-[22px] [&_tbody_tr:hover>td]:border-sky-300/50 dark:[&_tbody_tr:hover>td]:border-sky-500/30 [&_tbody_tr:hover>td]:bg-sky-50/85 dark:[&_tbody_tr:hover>td]:bg-slate-900/80";
const premiumTableScrollClass = "px-3 pt-1.5 pb-3";
const premiumCellClass = "align-top px-5 py-2.5";
const premiumMetaTextClass = "text-sm text-slate-600 dark:text-slate-300";
const premiumHelperTextClass = "text-xs text-slate-500 dark:text-slate-400";
const premiumPermissionSummaryClass =
  "flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-300";
const premiumPermissionChipClass =
  "inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 px-2 py-0.5 text-[10px] font-medium text-slate-600 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-200";
const accessActionButtonClass =
  "h-8 rounded-full border-slate-300/80 bg-white/90 px-3 text-[11px] text-slate-700 shadow-sm hover:bg-white dark:border-sky-400/30 dark:bg-slate-900/90 dark:text-sky-100 dark:hover:bg-slate-900";
const premiumAvatarClass =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-200/70 bg-sky-50 text-sm font-semibold text-sky-700 shadow-sm dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-100";
const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white/45 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 disabled:opacity-60 dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20";
const mobileCardClass =
  "rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-soft dark:border-slate-800/80 dark:bg-slate-900/70";
const roleGuide = [
  {
    value: "OWNER",
    eyebrow: "Protected",
    accentClass:
      "border-amber-300/35 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/12 dark:text-amber-100",
    description: "Full farm control. Protected here and cannot be edited from this page.",
    capabilities: ["Full farm control", "Protected from edits here"],
  },
  {
    value: "ADMIN",
    eyebrow: "Control",
    accentClass:
      "border-violet-300/35 bg-violet-500/10 text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/12 dark:text-violet-100",
    description: "Can invite teammates, update roles, disable access, and remove members.",
    capabilities: ["Invite teammates", "Manage team access"],
  },
  {
    value: "MANAGER",
    eyebrow: "Review",
    accentClass:
      "border-emerald-300/35 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/12 dark:text-emerald-100",
    description: "Can review users and invitations without changing access.",
    capabilities: ["Review members", "Review invitations"],
  },
  {
    value: "STAFF",
    eyebrow: "Execute",
    accentClass:
      "border-sky-300/35 bg-sky-500/10 text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/12 dark:text-sky-100",
    description: "Handles daily farm records and operations without admin controls.",
    capabilities: ["Daily farm records", "No admin controls"],
  },
];

const roleGuideByValue = Object.freeze(
  roleGuide.reduce((accumulator, role) => {
    accumulator[role.value] = role;
    return accumulator;
  }, {}),
);

const AUDIT_ACTION_OPTIONS = [
  { value: "", label: "All activity" },
  { value: "INVITATION_CREATED", label: "Invitation created" },
  { value: "INVITATION_REVOKED", label: "Invitation revoked" },
  { value: "INVITATION_ACCEPTED", label: "Invitation accepted" },
  { value: "MEMBER_ROLE_CHANGED", label: "Role changed" },
  { value: "MEMBER_ACTIVATED", label: "Member activated" },
  { value: "MEMBER_DEACTIVATED", label: "Member deactivated" },
  { value: "MEMBER_REMOVED", label: "Member removed" },
];

const WORKSPACE_ROLE_FILTER_OPTIONS = [
  { value: "", label: "All roles" },
  ...["OWNER", "ADMIN", "MANAGER", "STAFF"].map((role) => ({
    value: role,
    label: getWorkspaceRoleLabel(role),
  })),
];

const MEMBER_STATUS_FILTER_OPTIONS = [
  { value: "", label: "Any status" },
  { value: "enabled", label: "Enabled" },
  { value: "disabled", label: "Disabled" },
];

const INVITATION_STATE_FILTER_OPTIONS = [
  { value: "", label: "Any invite state" },
  { value: "active", label: "Active invites" },
  { value: "soon", label: "Expiring soon" },
  { value: "today", label: "Expires today" },
  { value: "expired", label: "Expired" },
];

const AUDIT_ACTION_META = Object.freeze({
  INVITATION_CREATED: {
    label: "Invitation created",
    classes:
      "border-sky-300/40 bg-sky-500/10 text-sky-600 dark:text-sky-100",
  },
  INVITATION_REVOKED: {
    label: "Invitation revoked",
    classes:
      "border-rose-300/40 bg-rose-500/10 text-rose-600 dark:text-rose-100",
  },
  INVITATION_ACCEPTED: {
    label: "Invitation accepted",
    classes:
      "border-emerald-300/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-100",
  },
  MEMBER_ROLE_CHANGED: {
    label: "Role changed",
    classes:
      "border-violet-300/40 bg-violet-500/10 text-violet-600 dark:text-violet-100",
  },
  MEMBER_ACTIVATED: {
    label: "Member activated",
    classes:
      "border-emerald-300/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-100",
  },
  MEMBER_DEACTIVATED: {
    label: "Member deactivated",
    classes:
      "border-amber-300/40 bg-amber-500/10 text-amber-700 dark:text-amber-100",
  },
  MEMBER_REMOVED: {
    label: "Member removed",
    classes:
      "border-rose-300/40 bg-rose-500/10 text-rose-600 dark:text-rose-100",
  },
});

function getMemberName(member) {
  return member?.username || member?.email || "Unnamed user";
}

function getInitials(value, fallback = "KF") {
  const initials = String(value ?? "")
    .trim()
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join("");
  return initials || fallback;
}

function toSentenceCase(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function normalizeRoleLabelText(value) {
  return String(value ?? "")
    .trim()
    .replace(/[_\s-]+/g, " ")
    .toLowerCase();
}

function formatRoleLabel(value) {
  const label = String(value ?? "").trim();
  if (!label) return "";
  return label === label.toUpperCase() ? toSentenceCase(label) : label;
}

function getRoleDisplayMeta(role, customRoleName, roleLabel) {
  const standardLabel = getWorkspaceRoleLabel(role);
  const customLabel = String(customRoleName ?? "").trim();
  if (customLabel) {
    return {
      label: customLabel,
      isCustom: true,
    };
  }

  const backendLabel = String(roleLabel ?? "").trim();
  if (!backendLabel) {
    return {
      label: standardLabel,
      isCustom: false,
    };
  }

  if (normalizeRoleLabelText(backendLabel) === normalizeRoleLabelText(standardLabel)) {
    return {
      label: standardLabel,
      isCustom: false,
    };
  }

  return {
    label: formatRoleLabel(backendLabel),
    isCustom: true,
  };
}

function getAuditActionMeta(action) {
  const normalized = String(action ?? "").trim().toUpperCase();
  return (
    AUDIT_ACTION_META[normalized] || {
      label: toSentenceCase(normalized) || "Activity",
      classes:
        "border-slate-300/40 bg-slate-500/10 text-slate-600 dark:text-slate-200",
    }
  );
}

function getAuditTargetPrimary(entry) {
  if (entry?.targetName) return entry.targetName;
  if (entry?.targetEmail) return entry.targetEmail;
  const subject = toSentenceCase(entry?.subjectType);
  if (subject && entry?.subjectId) return `${subject} #${entry.subjectId}`;
  return subject || "Workspace record";
}

function getAuditTargetSecondary(entry) {
  if (entry?.targetName && entry?.targetEmail) return entry.targetEmail;
  if (entry?.subjectType && entry?.subjectId) {
    return `${toSentenceCase(entry.subjectType)} #${entry.subjectId}`;
  }
  if (entry?.subjectType) return toSentenceCase(entry.subjectType);
  return "";
}

function getAuditChangeSummary(entry) {
  const previousValue = String(entry?.previousValue ?? "").trim();
  const nextValue = String(entry?.nextValue ?? "").trim();

  if (previousValue && nextValue) {
    return `From ${previousValue} to ${nextValue}`;
  }

  if (nextValue) {
    return `Updated to ${nextValue}`;
  }

  if (previousValue) {
    return `Previously ${previousValue}`;
  }

  return "";
}

function getSearchText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function compareTextValue(left, right) {
  return String(left ?? "").localeCompare(String(right ?? ""), undefined, {
    sensitivity: "base",
    numeric: true,
  });
}

function compareWorkspaceRolePriority(leftRole, rightRole) {
  return getWorkspaceRoleRank(rightRole) - getWorkspaceRoleRank(leftRole);
}

function compareWorkspaceMembersByAuthority(left, right) {
  const roleComparison = compareWorkspaceRolePriority(left?.role, right?.role);
  if (roleComparison !== 0) return roleComparison;

  const activeComparison = Number(Boolean(right?.active)) - Number(Boolean(left?.active));
  if (activeComparison !== 0) return activeComparison;

  const nameComparison = compareTextValue(getMemberName(left), getMemberName(right));
  if (nameComparison !== 0) return nameComparison;

  return compareTextValue(left?.email, right?.email);
}

function compareWorkspaceInvitationsByAuthority(left, right) {
  const roleComparison = compareWorkspaceRolePriority(left?.role, right?.role);
  if (roleComparison !== 0) return roleComparison;

  const createdEpochDifference =
    new Date(right?.createdAt || 0).getTime() - new Date(left?.createdAt || 0).getTime();
  if (createdEpochDifference !== 0) return createdEpochDifference;

  return compareTextValue(left?.email, right?.email);
}

function memberMatchesSearch(member, search) {
  const query = getSearchText(search);
  if (!query) return true;

  return [
    member.username,
    member.email,
    member.role,
    getWorkspaceRoleLabel(member.role),
    member.createdBy,
    member.updatedBy,
    member.active ? "enabled" : "disabled",
  ]
    .map((value) => getSearchText(value))
    .some((value) => value.includes(query));
}

function invitationMatchesSearch(invitation, search) {
  const query = getSearchText(search);
  if (!query) return true;

  return [
    invitation.email,
    invitation.role,
    getWorkspaceRoleLabel(invitation.role),
    invitation.createdBy,
  ]
    .map((value) => getSearchText(value))
    .some((value) => value.includes(query));
}

function invitationMatchesStateFilter(invitation, filterValue) {
  const filter = getSearchText(filterValue);
  if (!filter) return true;

  const stateKey = getInvitationState(invitation).key;
  if (filter === "active") {
    return stateKey === "pending" || stateKey === "healthy";
  }

  return stateKey === filter;
}

const visibleEnterprisePermissionValues = new Set(
  ENTERPRISE_PERMISSION_OPTIONS.map((option) => option.value),
);

function sanitizeEnterprisePermissions(permissions) {
  return normalizeWorkspacePermissions(permissions).filter((permission) =>
    visibleEnterprisePermissionValues.has(permission),
  );
}

function getEnterprisePermissionLabels(permissions) {
  return sanitizeEnterprisePermissions(permissions).map((permission) => {
    const option = ENTERPRISE_PERMISSION_OPTIONS.find((entry) => entry.value === permission);
    return {
      value: permission,
      label: option?.label || permission,
      description: option?.description || "Access to this enterprise capability.",
    };
  });
}

function getInvitationState(invitation) {
  const parsed = invitation?.expiresAt ? new Date(invitation.expiresAt) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return {
      key: "pending",
      label: "Pending",
      helper: "Invite stays active until it is accepted or revoked.",
      classes: "border-sky-300/40 bg-sky-500/10 text-sky-600 dark:text-sky-100",
    };
  }

  const remainingMs = parsed.getTime() - Date.now();
  const remainingHours = Math.ceil(remainingMs / 3600000);

  if (remainingHours < 0) {
    return {
      key: "expired",
      label: "Expired",
      helper: "This invite window has ended.",
      classes: "border-rose-300/40 bg-rose-500/10 text-rose-600 dark:text-rose-100",
    };
  }

  if (remainingHours <= 24) {
    return {
      key: "today",
      label: "Expires today",
      helper: "Ask the teammate to join soon or revoke and re-invite.",
      classes: "border-amber-300/40 bg-amber-500/10 text-amber-700 dark:text-amber-100",
    };
  }

  if (remainingHours <= 72) {
    return {
      key: "soon",
      label: "Expiring soon",
      helper: "Less than 3 days left on this invite.",
      classes: "border-amber-300/40 bg-amber-500/10 text-amber-700 dark:text-amber-100",
    };
  }

  return {
    key: "healthy",
    label: "Pending",
    helper: "Invite is active and ready to use.",
    classes: "border-emerald-300/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-100",
  };
}

function getRoleGuideMeta(role) {
  return roleGuideByValue[normalizeWorkspaceRole(role)] || roleGuideByValue.STAFF;
}

function MetricCard({ icon, label, value, detail, iconTone }) {
  return (
    <article className={`${glassPanelClass} relative overflow-hidden p-4`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/60 to-transparent dark:via-sky-400/35" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {value}
          </p>
          {detail ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
          ) : null}
        </div>
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${iconTone}`}
        >
          {React.createElement(icon, { className: "h-4 w-4" })}
        </span>
      </div>
    </article>
  );
}

function SidebarStat({ label, value, helper }) {
  return (
    <div className={`${insetPanelClass} px-3 py-3`}>
      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      {helper ? (
        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{helper}</p>
      ) : null}
    </div>
  );
}

function RoleGuideCard({ role, active = false, compact = false }) {
  const meta = getRoleGuideMeta(role);

  return (
    <div
      className={`${insetPanelClass} rounded-2xl transition ${
        compact ? "px-3 py-2.5" : "px-3 py-3"
      } ${
        active ? "border-sky-300/60 bg-sky-50/60 dark:border-sky-500/30 dark:bg-sky-500/10" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <WorkspaceRolePill role={role} compact />
        <span
          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${meta.accentClass}`}
        >
          {meta.eyebrow}
        </span>
      </div>
      <p
        className={`text-slate-600 dark:text-slate-300 ${
          compact ? "mt-2 text-[13px] leading-5" : "mt-3 text-sm leading-relaxed"
        }`}
      >
        {meta.description}
      </p>
      {compact ? null : (
        <div className={`flex flex-wrap gap-1.5 ${compact ? "mt-2" : "mt-3"}`}>
          {meta.capabilities.map((capability) => (
            <span
              key={`${role}-${capability}`}
              className="inline-flex rounded-full border border-slate-200/80 bg-white/70 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-300"
            >
              {capability}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const WORKSPACE_ROLE_PILL_STYLES = Object.freeze({
  OWNER: {
    className:
      "border-amber-300/75 bg-amber-50/95 text-amber-950 shadow-[0_8px_18px_rgba(245,158,11,0.12)] dark:border-amber-300/30 dark:bg-slate-950/95 dark:text-amber-100",
    dotClass: "bg-amber-400 dark:bg-amber-300",
  },
  ADMIN: {
    className:
      "border-fuchsia-300/75 bg-fuchsia-50/95 text-fuchsia-950 shadow-[0_8px_18px_rgba(217,70,239,0.12)] dark:border-fuchsia-300/30 dark:bg-slate-950/95 dark:text-fuchsia-100",
    dotClass: "bg-fuchsia-400 dark:bg-fuchsia-300",
  },
  MANAGER: {
    className:
      "border-emerald-300/75 bg-emerald-50/95 text-emerald-950 shadow-[0_8px_18px_rgba(16,185,129,0.12)] dark:border-emerald-300/30 dark:bg-slate-950/95 dark:text-emerald-100",
    dotClass: "bg-emerald-400 dark:bg-emerald-300",
  },
  STAFF: {
    className:
      "border-sky-300/75 bg-sky-50/95 text-sky-950 shadow-[0_8px_18px_rgba(14,165,233,0.12)] dark:border-sky-300/30 dark:bg-slate-950/95 dark:text-sky-100",
    dotClass: "bg-sky-400 dark:bg-sky-300",
  },
});

function WorkspaceRolePill({ role, className = "", compact = false }) {
  const normalizedRole = normalizeWorkspaceRole(role);
  const label = getWorkspaceRoleLabel(normalizedRole);
  const tone =
    WORKSPACE_ROLE_PILL_STYLES[normalizedRole] || WORKSPACE_ROLE_PILL_STYLES.STAFF;

  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full border font-semibold leading-none tracking-[0.06em] whitespace-nowrap ${
        compact
          ? "min-h-[2rem] min-w-[5.5rem] px-3 py-1 text-[11px]"
          : "min-h-[2.15rem] min-w-[6rem] px-3.5 py-1.5 text-[12px]"
      } ${tone.className} ${className}`}
    >
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_0_3px_rgba(255,255,255,0.12)] ${tone.dotClass}`}
      />
      {label}
    </span>
  );
}

function PageTabs({ activeTab, onChange, tabs }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2 rounded-xl border border-slate-200/80 bg-white/65 p-2 dark:border-slate-800/80 dark:bg-slate-900/65">
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              active
                ? "bg-gradient-to-r from-accent-primary/18 via-blue-500/16 to-emerald-500/14 text-slate-900 shadow-soft dark:text-slate-50"
                : "text-slate-600 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function PaginationControls({
  page,
  totalPages,
  visibleCount,
  totalCount,
  label,
  onPrevious,
  onNext,
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 pt-4 text-sm dark:border-slate-800/85">
      <div className="text-slate-600 dark:text-slate-300">
        Showing {formatNumber(visibleCount)} of {formatNumber(totalCount)} {label}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-slate-600 dark:text-slate-300">
          Page {page + 1} of {formatNumber(totalPages)}
        </span>
        <Button size="sm" variant="outline" disabled={page === 0} onClick={onPrevious}>
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages - 1}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function MobileField({ label, children, className = "" }) {
  return (
    <div className={className}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-sm text-slate-700 dark:text-slate-200">{children}</div>
    </div>
  );
}

function MobileCardSkeleton({ rows = 3 }) {
  return (
    <div className={mobileCardClass} aria-hidden="true">
      <div className="skeleton-glass h-5 w-32 rounded" />
      <div className="mt-2 skeleton-glass h-4 w-48 rounded" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={`mobile-card-skeleton-${index}`} className="skeleton-glass h-10 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function MobileEmptyState({ title, message }) {
  return (
    <div className={`${mobileCardClass} text-center`}>
      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
      <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{message}</div>
    </div>
  );
}

export default function UsersPage() {
  const { user } = useAuth();
  const { activeTenant, activeTenantId } = useTenant();
  const invitePanelRef = React.useRef(null);

  const tenantRole = normalizeWorkspaceRole(activeTenant?.myRole);
  const isEnterprisePlan = normalizePlanId(activeTenant?.plan, "FREE") === "ENTERPRISE";
  const canViewUsers = hasAnyWorkspacePermission(activeTenant, [
    WORKSPACE_PERMISSIONS.USERS_VIEW,
    WORKSPACE_PERMISSIONS.USERS_MANAGE,
  ]);
  const canViewAudit =
    isEnterprisePlan &&
    hasAnyWorkspacePermission(activeTenant, [WORKSPACE_PERMISSIONS.AUDIT_VIEW]);
  const canManageTeam = hasAnyWorkspacePermission(activeTenant, [
    WORKSPACE_PERMISSIONS.USERS_MANAGE,
  ]);
  const manageableRoleOptions = React.useMemo(
    () => getManageableWorkspaceRoleOptions(tenantRole),
    [tenantRole],
  );
  const canAccessPage = canViewUsers || canViewAudit;
  const currentUserId = Number(user?.id) || null;
  const currentUserEmail = String(user?.email ?? "").trim().toLowerCase();

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [members, setMembers] = React.useState([]);
  const [invitations, setInvitations] = React.useState([]);
  const [auditLogs, setAuditLogs] = React.useState([]);
  const [auditLoading, setAuditLoading] = React.useState(false);
  const [auditRefreshing, setAuditRefreshing] = React.useState(false);
  const [auditError, setAuditError] = React.useState("");
  const [activeTab, setActiveTab] = React.useState(() =>
    canViewUsers ? "members" : canViewAudit ? "audit" : "members",
  );
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [memberPage, setMemberPage] = React.useState(0);
  const [invitationPage, setInvitationPage] = React.useState(0);
  const [auditPage, setAuditPage] = React.useState(0);
  const [memberRoleFilter, setMemberRoleFilter] = React.useState("");
  const [memberStatusFilter, setMemberStatusFilter] = React.useState("");
  const [invitationRoleFilter, setInvitationRoleFilter] = React.useState("");
  const [invitationStateFilter, setInvitationStateFilter] = React.useState("");
  const [auditTotalItems, setAuditTotalItems] = React.useState(0);
  const [auditTotalPages, setAuditTotalPages] = React.useState(1);
  const [auditAction, setAuditAction] = React.useState("");
  const [roleDrafts, setRoleDrafts] = React.useState({});
  const [permissionDrafts, setPermissionDrafts] = React.useState({});
  const [expandedPermissionMemberId, setExpandedPermissionMemberId] = React.useState(null);
  const [inviteForm, setInviteForm] = React.useState({
    email: "",
    role: "STAFF",
  });
  const [submittingInvite, setSubmittingInvite] = React.useState(false);
  const [mutatingId, setMutatingId] = React.useState("");
  const [confirmState, setConfirmState] = React.useState({
    open: false,
    title: "",
    message: "",
    type: "",
    payload: null,
  });
  const [toast, setToast] = React.useState({ message: "", type: "info" });

  React.useEffect(() => {
    if (manageableRoleOptions.length === 0) return;
    if (manageableRoleOptions.some((option) => option.value === inviteForm.role)) return;

    setInviteForm((current) => ({
      ...current,
      role: manageableRoleOptions[0].value,
    }));
  }, [inviteForm.role, manageableRoleOptions]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setMemberPage(0);
      setInvitationPage(0);
      setAuditPage(0);
    }, 260);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  React.useEffect(() => {
    const availableTabs = [
      ...(canViewUsers ? ["members", "invitations"] : []),
      ...(canViewAudit ? ["audit"] : []),
    ];

    if (availableTabs.length === 0) return;
    if (availableTabs.includes(activeTab)) return;
    setActiveTab(availableTabs[0]);
  }, [activeTab, canViewAudit, canViewUsers]);

  const loadTeam = React.useCallback(
    async ({ silent = false } = {}) => {
      if (!activeTenantId || !canViewUsers) {
        setMembers([]);
        setInvitations([]);
        setRoleDrafts({});
        setPermissionDrafts({});
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      try {
        const [memberList, invitationList] = await Promise.all([
          listTeamMembers(),
          listPendingInvitations(),
        ]);

        setMembers(memberList);
        setInvitations(invitationList);
        setRoleDrafts(
          memberList.reduce((accumulator, member) => {
            accumulator[member.memberId] = member.role;
            return accumulator;
          }, {}),
        );
        setPermissionDrafts(
          memberList.reduce((accumulator, member) => {
            accumulator[member.memberId] = {
              customRoleName: member.customRoleName || "",
              permissions: sanitizeEnterprisePermissions(
                member.permissions?.length ? member.permissions : resolveWorkspacePermissions(member),
              ),
            };
            return accumulator;
          }, {}),
        );
      } catch (loadError) {
        setMembers([]);
        setInvitations([]);
        setRoleDrafts({});
        setPermissionDrafts({});
        setError(loadError?.message || "Could not load team access right now.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTenantId, canViewUsers],
  );

  React.useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const loadAudit = React.useCallback(
    async ({ silent = false } = {}) => {
      if (!activeTenantId || !canViewAudit) {
        setAuditLogs([]);
        setAuditTotalItems(0);
        setAuditTotalPages(1);
        setAuditError("");
        setAuditLoading(false);
        setAuditRefreshing(false);
        return;
      }

      if (silent) {
        setAuditRefreshing(true);
      } else {
        setAuditLoading(true);
      }
      setAuditError("");

      try {
        const result = await listAuditLogs({
          search,
          action: auditAction,
          page: auditPage,
          size: AUDIT_PAGE_SIZE,
        });

        setAuditLogs(result.items);
        setAuditTotalItems(result.totalItems);
        setAuditTotalPages(result.totalPages);
      } catch (loadError) {
        setAuditLogs([]);
        setAuditTotalItems(0);
        setAuditTotalPages(1);
        setAuditError(loadError?.message || "Could not load audit history right now.");
      } finally {
        setAuditLoading(false);
        setAuditRefreshing(false);
      }
    },
    [activeTenantId, auditAction, auditPage, canViewAudit, search],
  );

  React.useEffect(() => {
    if (!canViewAudit) return;
    if (canViewUsers && activeTab !== "audit") return;
    loadAudit();
  }, [activeTab, canViewAudit, canViewUsers, loadAudit]);

  const accessEditorMember = React.useMemo(
    () =>
      members.find((member) => Number(member.memberId) === Number(expandedPermissionMemberId)) ||
      null,
    [expandedPermissionMemberId, members],
  );

  React.useEffect(() => {
    if (!expandedPermissionMemberId) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !mutatingId) {
        setExpandedPermissionMemberId(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [expandedPermissionMemberId, mutatingId]);

  React.useEffect(() => {
    if (expandedPermissionMemberId && !accessEditorMember) {
      setExpandedPermissionMemberId(null);
    }
  }, [accessEditorMember, expandedPermissionMemberId]);

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setMemberPage(0);
    setInvitationPage(0);
    setAuditPage(0);
  }

  function clearActiveFilters() {
    clearSearch();
    if (activeTab === "audit") {
      setAuditAction("");
      return;
    }
    if (activeTab === "members") {
      setMemberRoleFilter("");
      setMemberStatusFilter("");
      return;
    }
    if (activeTab === "invitations") {
      setInvitationRoleFilter("");
      setInvitationStateFilter("");
    }
  }

  function closeConfirm() {
    if (mutatingId) return;
    setConfirmState({
      open: false,
      title: "",
      message: "",
      type: "",
      payload: null,
    });
  }

  function isCurrentUser(member) {
    const memberEmail = String(member?.email ?? "").trim().toLowerCase();
    return (
      (currentUserId && Number(member?.userId) === currentUserId) ||
      (currentUserEmail && memberEmail === currentUserEmail)
    );
  }

  function isProtectedMember(member) {
    return member?.role === "OWNER" || isCurrentUser(member);
  }

  function canManageMemberAccess(member) {
    return (
      canManageTeam &&
      !isProtectedMember(member) &&
      canManageWorkspaceMember(tenantRole, member?.role)
    );
  }

  function canManageInvitationAccess(invitation) {
    return canManageTeam && canAssignWorkspaceRole(tenantRole, invitation?.role);
  }

  function getHierarchyHelper(member) {
    if (member?.role === "OWNER") {
      return "Owners are protected from role changes here.";
    }

    if (isCurrentUser(member)) {
      return "Use another admin account to edit your own access.";
    }

    if (!canManageWorkspaceMember(tenantRole, member?.role)) {
      return `${getWorkspaceRoleLabel(tenantRole)} can only manage teammates below that level in the hierarchy.`;
    }

    return "";
  }

  function getPermissionDraft(member) {
    return (
      permissionDrafts[member.memberId] || {
        customRoleName: member.customRoleName || "",
        permissions: sanitizeEnterprisePermissions(
          member.permissions?.length ? member.permissions : resolveWorkspacePermissions(member),
        ),
      }
    );
  }

  function hasPermissionDraftChanges(member) {
    const draft = getPermissionDraft(member);
    const currentPermissions = sanitizeEnterprisePermissions(
      member.permissions?.length ? member.permissions : resolveWorkspacePermissions(member),
    );
    return (
      String(draft.customRoleName || "").trim() !== String(member.customRoleName || "").trim() ||
      JSON.stringify(draft.permissions) !== JSON.stringify(currentPermissions)
    );
  }

  async function handleSavePermissionProfile(member) {
    const draft = getPermissionDraft(member);
    const memberKey = `member-${member.memberId}-permissions`;
    setMutatingId(memberKey);
    try {
      await updateMemberPermissions({
        memberId: member.memberId,
        customRoleName: draft.customRoleName,
        permissions: draft.permissions,
      });
      setExpandedPermissionMemberId(null);
      setToast({
        message: `Advanced access updated for ${getMemberName(member)}.`,
        type: "success",
      });
      await loadTeam({ silent: true });
    } catch (error) {
      setToast({
        message: error?.message || "Could not update advanced access.",
        type: "error",
      });
    } finally {
      setMutatingId("");
    }
  }

  async function handleConfirmAction() {
    const payload = confirmState.payload;
    if (!payload || !confirmState.type) return;

    const pendingKey =
      confirmState.type === "revoke_invitation"
        ? `invite-${payload.invitationId}`
        : `member-${payload.memberId}`;

    setMutatingId(pendingKey);

    try {
      if (confirmState.type === "change_role") {
        await updateMemberRole({
          memberId: payload.memberId,
          role: payload.nextRole,
        });
        setToast({
          message: `${getMemberName(payload)} is now ${getWorkspaceRoleLabel(payload.nextRole)}.`,
          type: "success",
        });
      }

      if (confirmState.type === "toggle_member") {
        await updateMemberActive({
          memberId: payload.memberId,
          active: payload.nextActive,
        });
        setToast({
          message: payload.nextActive
            ? `${getMemberName(payload)} has been reactivated.`
            : `${getMemberName(payload)} has been deactivated.`,
          type: "success",
        });
      }

      if (confirmState.type === "remove_member") {
        await removeMember({ memberId: payload.memberId });
        setToast({
          message: `${getMemberName(payload)} was removed from this workspace.`,
          type: "success",
        });
      }

      if (confirmState.type === "revoke_invitation") {
        await revokeInvitation({ invitationId: payload.invitationId });
        setToast({
          message: `Invitation for ${payload.email} was revoked.`,
          type: "success",
        });
      }

      setConfirmState({
        open: false,
        title: "",
        message: "",
        type: "",
        payload: null,
      });
      await loadTeam({ silent: true });
    } catch (mutationError) {
      setToast({
        message: mutationError?.message || "Could not update team access.",
        type: "error",
      });
    } finally {
      setMutatingId("");
    }
  }

  async function handleInviteSubmit(event) {
    event.preventDefault();
    if (!canManageTeam || submittingInvite) return;

    if (manageableRoleOptions.length === 0) {
      setToast({
        message: "Your current role cannot send invitations from this workspace.",
        type: "error",
      });
      return;
    }

    const email = inviteForm.email.trim();
    if (!email) {
      setToast({ message: "Enter an email address to send an invitation.", type: "error" });
      return;
    }

    setSubmittingInvite(true);
    try {
      const invitation = await createInvitation(inviteForm);
      setInviteForm((current) => ({
        ...current,
        email: "",
      }));
      setToast({
        message: `Invitation created for ${invitation.email}.`,
        type: "success",
      });
      setActiveTab("invitations");
      await loadTeam({ silent: true });
    } catch (inviteError) {
      setToast({
        message: inviteError?.message || "Could not create invitation.",
        type: "error",
      });
    } finally {
      setSubmittingInvite(false);
    }
  }

  async function handleCopyInvite(invitation) {
    const value = invitation?.inviteLink || invitation?.token;
    if (!value) {
      setToast({
        message: "This invitation does not have a shareable link yet.",
        type: "error",
      });
      return;
    }

    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("Clipboard access is unavailable.");
      }

      await navigator.clipboard.writeText(value);
      setToast({
        message: `Invite link copied for ${invitation.email}.`,
        type: "success",
      });
    } catch {
      setToast({
        message: "Could not copy the invite link from this browser.",
        type: "error",
      });
    }
  }

  function scrollToInvitePanel() {
    invitePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const manageableMemberCount = members.filter((member) => canManageMemberAccess(member)).length;

  const filteredMembers = members
    .filter(
      (member) =>
        memberMatchesSearch(member, search) &&
        (!memberRoleFilter || normalizeWorkspaceRole(member.role) === memberRoleFilter) &&
        (!memberStatusFilter ||
          (memberStatusFilter === "enabled" ? Boolean(member.active) : !member.active)),
    )
    .sort(compareWorkspaceMembersByAuthority);
  const filteredInvitations = invitations
    .filter(
      (invitation) =>
        invitationMatchesSearch(invitation, search) &&
        (!invitationRoleFilter ||
          normalizeWorkspaceRole(invitation.role) === invitationRoleFilter) &&
        invitationMatchesStateFilter(invitation, invitationStateFilter),
    )
    .sort(compareWorkspaceInvitationsByAuthority);
  const totalMemberPages = Math.max(1, Math.ceil(filteredMembers.length / TABLE_PAGE_SIZE));
  const totalInvitationPages = Math.max(
    1,
    Math.ceil(filteredInvitations.length / TABLE_PAGE_SIZE),
  );
  const visibleMembers = filteredMembers.slice(
    memberPage * TABLE_PAGE_SIZE,
    memberPage * TABLE_PAGE_SIZE + TABLE_PAGE_SIZE,
  );
  const visibleInvitations = filteredInvitations.slice(
    invitationPage * TABLE_PAGE_SIZE,
    invitationPage * TABLE_PAGE_SIZE + TABLE_PAGE_SIZE,
  );

  React.useEffect(() => {
    if (memberPage <= totalMemberPages - 1) return;
    setMemberPage(Math.max(totalMemberPages - 1, 0));
  }, [memberPage, totalMemberPages]);

  React.useEffect(() => {
    if (invitationPage <= totalInvitationPages - 1) return;
    setInvitationPage(Math.max(totalInvitationPages - 1, 0));
  }, [invitationPage, totalInvitationPages]);

  React.useEffect(() => {
    if (auditPage <= auditTotalPages - 1) return;
    setAuditPage(Math.max(auditTotalPages - 1, 0));
  }, [auditPage, auditTotalPages]);

  const activeMemberCount = members.filter((member) => member.active).length;
  const disabledMemberCount = members.filter((member) => !member.active).length;
  const adminCount = members.filter((member) => {
    const role = normalizeWorkspaceRole(member.role);
    return role === "OWNER" || role === "ADMIN";
  }).length;
  const accessLeadCount = members.filter((member) => {
    const role = normalizeWorkspaceRole(member.role);
    return role === "OWNER" || role === "ADMIN" || role === "MANAGER";
  }).length;
  const expiringSoonInviteCount = invitations.filter((invitation) => {
    const state = getInvitationState(invitation);
    return state.key === "today" || state.key === "soon";
  }).length;
  const highestManageableRole = manageableRoleOptions[0]?.label || "None";
  const workspaceAccessSummary = canManageTeam
    ? "Invite teammates, adjust access, and keep team permissions clean from one place."
    : canViewUsers
      ? "Review members, invitations, and role coverage without changing access."
      : "Review the recorded audit trail for access activity in this workspace.";
  const workspaceModeLabel = canManageTeam
    ? "Admin controls"
    : canViewUsers
      ? "Review mode"
      : "Audit mode";
  const hasSearch = Boolean(search);
  const hasMemberFilters =
    hasSearch || Boolean(memberRoleFilter) || Boolean(memberStatusFilter);
  const hasInvitationFilters =
    hasSearch || Boolean(invitationRoleFilter) || Boolean(invitationStateFilter);
  const hasAuditFilters = hasSearch || Boolean(auditAction);
  const hasActiveFilters =
    activeTab === "audit"
      ? hasAuditFilters
      : activeTab === "members"
        ? hasMemberFilters
        : hasInvitationFilters;
  const activeResultsLabel =
    activeTab === "members"
      ? `${formatNumber(filteredMembers.length)} members`
      : activeTab === "invitations"
        ? `${formatNumber(filteredInvitations.length)} invites`
        : `${formatNumber(auditTotalItems)} events`;
  const activeSectionTitle = activeTab === "audit" ? "Access history" : "Team roster";
  const activeSectionDescription =
    activeTab === "audit"
      ? "Review invitation changes, role updates, and access events recorded for this workspace."
      : "Review active teammates and pending invitations for this workspace.";
  const currentSearchPlaceholder =
    activeTab === "members"
      ? "Search members by name, email, role, or status"
      : activeTab === "invitations"
        ? "Search invitations by email, role, or inviter"
        : "Search audit by actor, target, description, or change";
  const activeFilterBadges = [
    hasSearch ? `Search: ${search}` : "",
    activeTab === "members" && memberRoleFilter
      ? `Role: ${
          WORKSPACE_ROLE_FILTER_OPTIONS.find((option) => option.value === memberRoleFilter)?.label ||
          memberRoleFilter
        }`
      : "",
    activeTab === "members" && memberStatusFilter
      ? `Status: ${
          MEMBER_STATUS_FILTER_OPTIONS.find((option) => option.value === memberStatusFilter)
            ?.label || memberStatusFilter
        }`
      : "",
    activeTab === "invitations" && invitationRoleFilter
      ? `Role: ${
          WORKSPACE_ROLE_FILTER_OPTIONS.find((option) => option.value === invitationRoleFilter)
            ?.label || invitationRoleFilter
        }`
      : "",
    activeTab === "invitations" && invitationStateFilter
      ? `Invite state: ${
          INVITATION_STATE_FILTER_OPTIONS.find(
            (option) => option.value === invitationStateFilter,
          )?.label || invitationStateFilter
        }`
      : "",
    activeTab === "audit" && auditAction
      ? `Event: ${
          AUDIT_ACTION_OPTIONS.find((option) => option.value === auditAction)?.label ||
          auditAction
        }`
      : "",
  ].filter(Boolean);

  const tabs = [
    ...(canViewUsers
      ? [
          { id: "members", label: `Members (${formatNumber(filteredMembers.length)})` },
          {
            id: "invitations",
            label: `Invitations (${formatNumber(filteredInvitations.length)})`,
          },
        ]
      : []),
    ...(canViewAudit
      ? [{ id: "audit", label: `Audit log (${formatNumber(auditTotalItems)})` }]
      : []),
  ];

  const memberColumns = [
    { key: "member", label: "Member", width: "240px" },
    { key: "role", label: "Role", width: "290px" },
    { key: "status", label: "Status", width: "140px" },
    { key: "joined", label: "Joined", width: "165px" },
    {
      key: "actions",
      label: "Actions",
      width: "170px",
      align: "right",
      className: "text-right",
    },
  ];

  const invitationColumns = [
    { key: "invitee", label: "Invitee", width: "230px" },
    { key: "role", label: "Role", width: "140px" },
    { key: "created", label: "Created", width: "180px" },
    { key: "expires", label: "Expires", width: "220px" },
    { key: "share", label: canManageTeam ? "Share" : "Status", width: "150px" },
    {
      key: "actions",
      label: "Actions",
      width: "150px",
      align: "right",
      className: "text-right",
    },
  ];
  const auditColumns = [
    { key: "action", label: "Event", width: "250px" },
    { key: "target", label: "Target", width: "240px" },
    { key: "actor", label: "Changed by", width: "200px" },
    { key: "detail", label: "Details", width: "320px" },
    { key: "time", label: "Recorded", width: "190px" },
  ];

  const accessEditorDraft = accessEditorMember ? getPermissionDraft(accessEditorMember) : null;
  const accessEditorPermissionKey = accessEditorMember
    ? `member-${accessEditorMember.memberId}-permissions`
    : "";
  const accessEditorBusy = mutatingId === accessEditorPermissionKey;
  const accessEditorProtected = Boolean(
    accessEditorMember &&
      (accessEditorMember.role === "OWNER" || isProtectedMember(accessEditorMember)),
  );
  const accessEditorCanCustomize =
    Boolean(accessEditorMember) && !accessEditorProtected && canManageMemberAccess(accessEditorMember);
  const accessEditorPermissions = accessEditorMember
    ? getEnterprisePermissionLabels(accessEditorDraft?.permissions)
    : [];
  const renderMemberMobileCard = (member) => {
    const currentRole = member.role;
    const draftRole = roleDrafts[member.memberId] || currentRole;
    const hasRoleDraft = draftRole !== currentRole;
    const canManageMember = canManageMemberAccess(member);
    const hierarchyHelper = getHierarchyHelper(member);
    const memberKey = `member-${member.memberId}`;
    const memberBusy = mutatingId === memberKey;
    const permissionSummary = getEnterprisePermissionLabels(
      member.permissions?.length
        ? member.permissions
        : resolveWorkspacePermissions(member),
    );
    const previewPermissions = permissionSummary.slice(0, 3);
    const remainingPermissionCount = Math.max(
      permissionSummary.length - previewPermissions.length,
      0,
    );
    const roleDisplay = getRoleDisplayMeta(
      currentRole,
      member.customRoleName,
      member.roleLabel,
    );

    return (
      <article key={member.memberId || member.email} className={mobileCardClass}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-semibold leading-snug text-slate-900 dark:text-slate-100">
              {getMemberName(member)}
            </div>
            <div className="mt-1 break-words text-sm text-slate-600 dark:text-slate-300">
              {member.email || "No email"}
            </div>
          </div>
          <Badge kind="active" value={member.active ? "ENABLED" : "DISABLED"} />
        </div>

        {member.createdBy ? (
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Added by {member.createdBy}
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <MobileField label="Access lane">
            <div className="flex flex-wrap gap-1.5">
              <WorkspaceRolePill role={currentRole} />
              {isCurrentUser(member) ? (
                <div className="inline-flex items-center rounded-full border border-sky-300/40 bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-sky-700 dark:text-sky-100">
                  You
                </div>
              ) : null}
              {roleDisplay.isCustom ? (
                <div className="inline-flex items-center rounded-full border border-slate-200/70 bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-400">
                  {roleDisplay.label}
                </div>
              ) : null}
            </div>
          </MobileField>
          <MobileField label="Status">
            {member.active
              ? "Can access this workspace"
              : "Blocked until an admin re-enables access"}
          </MobileField>
          <MobileField label="Joined">
            <div>{formatDateTime(member.createdAt)}</div>
            {member.updatedAt ? (
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Updated {formatDateTime(member.updatedAt)}
              </div>
            ) : null}
          </MobileField>
        </div>

        {canManageMember ? (
          <div className="mt-4 rounded-xl border border-slate-200/80 bg-white/55 p-3 dark:border-slate-800/80 dark:bg-slate-900/55">
            <MobileField label="Change role">
              <div className="space-y-2">
                <select
                  value={draftRole}
                  disabled={memberBusy}
                  onChange={(event) =>
                    setRoleDrafts((current) => ({
                      ...current,
                      [member.memberId]: event.target.value,
                    }))
                  }
                  className={`${compactSelectClassName} w-full`}
                >
                  {manageableRoleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {hasRoleDraft ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={memberBusy}
                    onClick={() =>
                      setConfirmState({
                        open: true,
                        title: "Change member role",
                        message: `Change ${getMemberName(member)} from ${getWorkspaceRoleLabel(
                          currentRole,
                        )} to ${getWorkspaceRoleLabel(draftRole)}?`,
                        type: "change_role",
                        payload: {
                          ...member,
                          nextRole: draftRole,
                        },
                      })
                    }
                  >
                    Apply role change
                  </Button>
                ) : null}
              </div>
            </MobileField>
          </div>
        ) : null}

        {isEnterprisePlan ? (
          <div className="mt-4 rounded-xl border border-slate-200/80 bg-white/55 p-3 dark:border-slate-800/80 dark:bg-slate-900/55">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Access details
                </div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {permissionSummary.length} active permission
                  {permissionSummary.length === 1 ? "" : "s"}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className={accessActionButtonClass}
                onClick={() => setExpandedPermissionMemberId(member.memberId)}
              >
                {canManageMember ? "Edit access" : "View access"}
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {previewPermissions.map((permission) => (
                <span
                  key={`${member.memberId}-${permission.value}`}
                  className={premiumPermissionChipClass}
                >
                  {permission.label}
                </span>
              ))}
              {remainingPermissionCount > 0 ? (
                <span className={premiumPermissionChipClass}>
                  +{remainingPermissionCount} more
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        {hierarchyHelper ? (
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {hierarchyHelper}
          </div>
        ) : null}

        <div className="mt-4">
          {canManageTeam ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                disabled={!canManageMember || memberBusy}
                onClick={() =>
                  setConfirmState({
                    open: true,
                    title: member.active ? "Deactivate member" : "Reactivate member",
                    message: member.active
                      ? `Deactivate ${getMemberName(member)}? They will lose workspace access until you re-enable them.`
                      : `Reactivate ${getMemberName(member)} and restore workspace access?`,
                    type: "toggle_member",
                    payload: {
                      ...member,
                      nextActive: !member.active,
                    },
                  })
                }
              >
                {member.active ? "Disable" : "Enable"}
              </Button>
              <Button
                size="sm"
                variant="danger"
                className="w-full"
                disabled={!canManageMember || memberBusy}
                onClick={() =>
                  setConfirmState({
                    open: true,
                    title: "Remove member",
                    message: `Remove ${getMemberName(member)} from this workspace? This will revoke their active membership immediately.`,
                    type: "remove_member",
                    payload: member,
                  })
                }
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="text-sm text-slate-500 dark:text-slate-400">View only</div>
          )}
        </div>
      </article>
    );
  };
  const renderInvitationMobileCard = (invitation) => {
    const inviteKey = `invite-${invitation.invitationId}`;
    const inviteBusy = mutatingId === inviteKey;
    const invitationState = getInvitationState(invitation);
    const canManageInvitation = canManageInvitationAccess(invitation);

    return (
      <article key={invitation.invitationId || invitation.email} className={mobileCardClass}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="break-words text-base font-semibold text-slate-900 dark:text-slate-100">
              {invitation.email}
            </div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {invitation.createdBy
                ? `Invited by ${invitation.createdBy}`
                : "Pending teammate invite"}
            </div>
          </div>
          <WorkspaceRolePill role={invitation.role} compact />
        </div>

        <div className="mt-3">
          <span
            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${invitationState.classes}`}
          >
            {invitationState.label}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <MobileField label="Created">{formatDateTime(invitation.createdAt)}</MobileField>
          <MobileField label="Expires">
            <div>{formatDateTime(invitation.expiresAt)}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {invitationState.helper}
            </div>
          </MobileField>
        </div>

        <div className="mt-4">
          {canManageTeam ? (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleCopyInvite(invitation)}
                >
                  <Copy className="h-4 w-4" />
                  Copy link
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  className="w-full"
                  disabled={!canManageInvitation || inviteBusy}
                  onClick={() =>
                    setConfirmState({
                      open: true,
                      title: "Revoke invitation",
                      message: `Revoke the invitation sent to ${invitation.email}? They will need a new invite to join later.`,
                      type: "revoke_invitation",
                      payload: invitation,
                    })
                  }
                >
                  Revoke
                </Button>
              </div>
              {!canManageInvitation ? (
                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  You can only revoke invitations for roles below your own hierarchy level.
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-sm text-slate-500 dark:text-slate-400">View only</div>
          )}
        </div>
      </article>
    );
  };
  const renderAuditMobileCard = (entry) => {
    const actionMeta = getAuditActionMeta(entry.action);
    const targetPrimary = getAuditTargetPrimary(entry);
    const targetSecondary = getAuditTargetSecondary(entry);
    const changeSummary = getAuditChangeSummary(entry);

    return (
      <article
        key={entry.auditId || `${entry.action}-${entry.createdAt}`}
        className={mobileCardClass}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${actionMeta.classes}`}
            >
              {actionMeta.label}
            </span>
            <div className="mt-3 text-sm text-slate-700 dark:text-slate-200">
              {entry.description || "Workspace access activity recorded."}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <MobileField label="Target">
            <div className="font-medium text-slate-900 dark:text-slate-100">{targetPrimary}</div>
            {targetSecondary ? (
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {targetSecondary}
              </div>
            ) : null}
          </MobileField>
          <MobileField label="Changed by">{entry.actor || "System"}</MobileField>
          <MobileField label="Details">
            {changeSummary || "No before-and-after values were recorded for this event."}
          </MobileField>
          <MobileField label="Recorded">{formatDateTime(entry.createdAt)}</MobileField>
        </div>
      </article>
    );
  };
  const guideCard =
    canViewUsers
      ? {
          icon: Users,
          title: canViewAudit
            ? "Understand team access faster"
            : "Understand your farm team faster",
          description: canViewAudit
            ? "See who already has access, who is still waiting on an invite, and what changed over time."
            : "See who already has access, who is still waiting on an invite, and what each person can do.",
          steps: [
            "Start with the access cards so you know your role, active teammates, and pending invites at a glance.",
            "Use Members for people who can already sign in and Invitations for people who are still joining.",
            ...(canViewAudit
              ? ["Use Audit log when you need to explain role changes, invite activity, or access updates."]
              : ["Keep roles small and clear so workers only see what they need."]),
          ],
          tip: canViewAudit
            ? "If something feels unclear, check the access lane on the member card first, then the audit log."
            : "If something feels unclear, start from the access lane on each member card before changing roles.",
        }
      : {
          icon: History,
          title: "Understand the audit log faster",
          description:
            "Use this page to review invitation activity, role changes, and access updates recorded for this workspace.",
          steps: [
            "Search by teammate, actor, email, or change description to find the event you need.",
            "Use the action filter to narrow the log to invitations, role changes, or member access updates.",
            "Review recent events regularly so access history stays easy to explain during reviews.",
          ],
          tip: "The audit log is read-only here, so you can review history without changing workspace access.",
        };

  return (
    <DashboardLayout>
      <div className="space-y-4 font-body">
        <section className={`relative isolate overflow-hidden ${headerPanelClass} p-5 md:p-6`}>
          <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(108deg,rgba(37,99,235,0.17)_0%,rgba(14,116,144,0.14)_48%,rgba(16,185,129,0.12)_100%),radial-gradient(circle_at_12%_22%,rgba(56,189,248,0.13),transparent_43%),radial-gradient(circle_at_90%_22%,rgba(16,185,129,0.14),transparent_38%)] dark:bg-[linear-gradient(108deg,rgba(6,19,43,0.96)_0%,rgba(7,32,63,0.9)_48%,rgba(6,58,55,0.84)_100%),radial-gradient(circle_at_12%_22%,rgba(56,189,248,0.16),transparent_43%),radial-gradient(circle_at_90%_22%,rgba(16,185,129,0.18),transparent_38%)]" />
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-accent-primary/30 bg-accent-primary/10 px-3 py-1 text-xs font-semibold text-accent-primary dark:text-blue-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                {workspaceModeLabel}
              </div>
              <h1 className="mt-3 text-2xl font-header font-semibold text-slate-900 dark:text-slate-100 md:text-[1.9rem]">
                Team access that stays easy to manage
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-700/90 dark:text-slate-300/85">
                Keep access clear for{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {activeTenant?.name || "this farm"}
                </span>
                . {workspaceAccessSummary}
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-start">
              {canManageTeam ? (
                <Button size="sm" onClick={scrollToInvitePanel}>
                  <MailPlus className="h-4 w-4" />
                  Invite teammate
                </Button>
              ) : null}
              {canViewAudit && canViewUsers ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab((current) => (current === "audit" ? "members" : "audit"))}
                >
                  <History className="h-4 w-4" />
                  {activeTab === "audit" ? "Team roster" : "Audit log"}
                </Button>
              ) : null}
              <button
                type="button"
                onClick={async () => {
                  await Promise.all([
                    canViewUsers ? loadTeam({ silent: true }) : Promise.resolve(),
                    canViewAudit && (!canViewUsers || activeTab === "audit")
                      ? loadAudit({ silent: true })
                      : Promise.resolve(),
                  ]);
                }}
                disabled={
                  (!canViewUsers && !canViewAudit) ||
                  loading ||
                  refreshing ||
                  auditLoading ||
                  auditRefreshing
                }
                className={secondaryButtonClass}
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing || auditRefreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </button>
            </div>
          </div>

          <div className="relative z-10 mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            <div className={`${insetPanelClass} px-3 py-2.5`}>
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-600/80 dark:text-slate-300/70">
                Your access
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {getWorkspaceRoleLabel(tenantRole)}
              </p>
              <p className="mt-1 hidden text-[11px] text-slate-600/80 dark:text-slate-300/80 sm:block">
                Current role
              </p>
            </div>
            {canViewUsers ? (
              <>
                <div className={`${insetPanelClass} px-3 py-2.5`}>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-600/80 dark:text-slate-300/70">
                    Active access
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {formatNumber(activeMemberCount)}/{formatNumber(members.length)}
                  </p>
                  <p className="mt-1 hidden text-[11px] text-slate-600/80 dark:text-slate-300/80 sm:block">
                    Can sign in now
                  </p>
                </div>
                <div className={`${insetPanelClass} px-3 py-2.5`}>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-600/80 dark:text-slate-300/70">
                    Pending invites
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {formatNumber(invitations.length)}
                  </p>
                  <p className="mt-1 hidden text-[11px] text-slate-600/80 dark:text-slate-300/80 sm:block">
                    {expiringSoonInviteCount > 0
                      ? `${formatNumber(expiringSoonInviteCount)} expiring soon`
                      : "Waiting to join"}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className={`${insetPanelClass} px-3 py-2.5`}>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-600/80 dark:text-slate-300/70">
                    Audit filter
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {AUDIT_ACTION_OPTIONS.find((option) => option.value === auditAction)?.label ||
                      "All activity"}
                  </p>
                  <p className="mt-1 hidden text-[11px] text-slate-600/80 dark:text-slate-300/80 sm:block">
                    Current filter
                  </p>
                </div>
                <div className={`${insetPanelClass} px-3 py-2.5`}>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-600/80 dark:text-slate-300/70">
                    Matching events
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {formatNumber(auditTotalItems)}
                  </p>
                  <p className="mt-1 hidden text-[11px] text-slate-600/80 dark:text-slate-300/80 sm:block">
                    Events found
                  </p>
                </div>
              </>
            )}
          </div>
        </section>

        {!canAccessPage ? (
          <section className={`${glassPanelClass} p-5`}>
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-primary/15 text-accent-primary dark:bg-accent-primary/20 dark:text-blue-200">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-header text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Workspace access is limited for your role
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  You need user-management or audit-log permission to open this page. Your current
                  role is{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {getWorkspaceRoleLabel(tenantRole)}
                  </span>
                  .
                </p>
              </div>
            </div>
          </section>
        ) : (
          <>
            <FarmerGuideCard
              icon={guideCard.icon}
              title={guideCard.title}
              description={guideCard.description}
              storageKey="users-guide"
              steps={guideCard.steps}
              tip={guideCard.tip}
            />

            {loading && canViewUsers && activeTab !== "audit" && (
              <div className="rounded-xl border border-accent-primary/30 bg-accent-primary/10 px-4 py-3 text-sm text-accent-primary dark:text-blue-200">
                Loading team access...
              </div>
            )}

            {error && activeTab !== "audit" && (
              <div className="rounded-xl border border-violet-300/60 bg-violet-50 px-4 py-3 text-sm text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/20 dark:text-violet-100">
                {error}
              </div>
            )}

            {auditError && activeTab === "audit" && (
              <div className="rounded-xl border border-violet-300/60 bg-violet-50 px-4 py-3 text-sm text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/20 dark:text-violet-100">
                {auditError}
              </div>
            )}

            {canViewUsers && activeTab !== "audit" ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <MetricCard
                  icon={Users}
                  label="Team members"
                  value={formatNumber(members.length)}
                  detail={`${formatNumber(filteredMembers.length)} matching current filters`}
                  iconTone="bg-accent-primary/15 text-accent-primary dark:bg-accent-primary/20 dark:text-blue-200"
                />
                <MetricCard
                  icon={ShieldCheck}
                  label="Active access"
                  value={formatNumber(activeMemberCount)}
                  detail="Teammates who can sign in right now"
                  iconTone="bg-violet-500/15 text-violet-600 dark:bg-violet-500/20 dark:text-violet-200"
                />
                <MetricCard
                  icon={MailPlus}
                  label="Pending invites"
                  value={formatNumber(invitations.length)}
                  detail={
                    expiringSoonInviteCount > 0
                      ? `${formatNumber(expiringSoonInviteCount)} expiring soon`
                      : "Ready for new teammates to join"
                  }
                  iconTone="bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200"
                />
                <MetricCard
                  icon={UserRoundCog}
                  label="Disabled access"
                  value={formatNumber(disabledMemberCount)}
                  detail={
                    canManageTeam
                      ? `${formatNumber(manageableMemberCount)} members within your control lane`
                      : "Review only from your current role"
                  }
                  iconTone="bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200"
                />
              </div>
            ) : null}

            {activeTab !== "audit" && hasActiveFilters ? (
              <FilteredResultsHint
                summaryLabel="teammates and invitations"
                tableLabel={activeTab === "members" ? "members table" : "invites table"}
                hasFilters
                onClear={clearActiveFilters}
              />
            ) : null}

            <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.58fr)_minmax(20rem,0.92fr)]">
              <section className={`${glassPanelClass} self-start p-5`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {activeTab === "audit" ? (
                      <History className="h-4 w-4 text-accent-primary" />
                    ) : (
                      <Users className="h-4 w-4 text-accent-primary" />
                    )}
                    <h2 className="font-header font-semibold text-slate-900 dark:text-slate-100">
                      {activeSectionTitle}
                    </h2>
                  </div>
                  <span className="inline-flex rounded-full border border-slate-300/70 bg-white/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600 dark:border-slate-700/80 dark:bg-slate-900/65 dark:text-slate-300">
                    {activeResultsLabel}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {activeSectionDescription}
                </p>

                <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--atlas-muted)]" />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder={currentSearchPlaceholder}
                      className={`pl-10 ${inputClassName}`}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {activeTab === "members" ? (
                      <>
                        <select
                          value={memberRoleFilter}
                          onChange={(event) => {
                            setMemberRoleFilter(event.target.value);
                            setMemberPage(0);
                          }}
                          className={compactSelectClassName}
                        >
                          {WORKSPACE_ROLE_FILTER_OPTIONS.map((option) => (
                            <option key={`member-role-${option.value || "all"}`} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={memberStatusFilter}
                          onChange={(event) => {
                            setMemberStatusFilter(event.target.value);
                            setMemberPage(0);
                          }}
                          className={compactSelectClassName}
                        >
                          {MEMBER_STATUS_FILTER_OPTIONS.map((option) => (
                            <option
                              key={`member-status-${option.value || "all"}`}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </>
                    ) : null}
                    {activeTab === "invitations" ? (
                      <>
                        <select
                          value={invitationRoleFilter}
                          onChange={(event) => {
                            setInvitationRoleFilter(event.target.value);
                            setInvitationPage(0);
                          }}
                          className={compactSelectClassName}
                        >
                          {WORKSPACE_ROLE_FILTER_OPTIONS.map((option) => (
                            <option
                              key={`invitation-role-${option.value || "all"}`}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={invitationStateFilter}
                          onChange={(event) => {
                            setInvitationStateFilter(event.target.value);
                            setInvitationPage(0);
                          }}
                          className={compactSelectClassName}
                        >
                          {INVITATION_STATE_FILTER_OPTIONS.map((option) => (
                            <option
                              key={`invitation-state-${option.value || "all"}`}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </>
                    ) : null}
                    {activeTab === "audit" ? (
                      <select
                        value={auditAction}
                        onChange={(event) => {
                          setAuditAction(event.target.value);
                          setAuditPage(0);
                        }}
                        className={compactSelectClassName}
                      >
                        {AUDIT_ACTION_OPTIONS.map((option) => (
                          <option key={option.value || "all"} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    {hasActiveFilters ? (
                      <Button size="sm" variant="outline" onClick={clearActiveFilters}>
                        <X className="h-4 w-4" />
                        Clear
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-slate-200/80 bg-white/55 px-3 py-2.5 text-sm text-slate-600 dark:border-slate-800/80 dark:bg-slate-900/60 dark:text-slate-300">
                  {activeTab === "audit"
                    ? "Audit history tracks invite activity, role changes, and member access updates."
                    : canManageTeam
                      ? "You can invite teammates, update roles, disable access, and remove members beneath your own hierarchy level."
                      : "You can review access coverage and pending invites here, but role changes stay with admins."}
                </div>

                {activeFilterBadges.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeFilterBadges.map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex rounded-full border border-slate-200/80 bg-white/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600 dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-300"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                ) : null}

                {tabs.length > 1 ? (
                  <PageTabs activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />
                ) : null}

                {activeTab === "members" ? (
                  <>
                    <div className="mt-4 space-y-3 md:hidden">
                      {loading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                          <MobileCardSkeleton key={`member-mobile-skeleton-${index}`} rows={4} />
                        ))
                      ) : visibleMembers.length === 0 ? (
                        <MobileEmptyState
                          title="No team members found"
                          message={
                            hasMemberFilters
                              ? "Try broader search terms or clear a filter to find the teammate you need."
                              : "Team members will appear here once access has been granted."
                          }
                        />
                      ) : (
                        visibleMembers.map(renderMemberMobileCard)
                      )}
                    </div>

                    <div className="hidden md:block">
                      <Table
                        columns={memberColumns}
                        data={visibleMembers}
                        loading={loading}
                        tableClassName={`min-w-[1030px] ${premiumDesktopTableClass}`}
                        wrapperClassName={`${tableWrapperClass} mt-4`}
                        scrollClassName={premiumTableScrollClass}
                        headClassName={tableHeadClass}
                        bodyClassName={tableBodyClass}
                        rowClassName={tableRowClass}
                        emptyCellClassName="text-slate-600 dark:text-slate-300"
                        rowKey={(member) => member.memberId || member.email}
                        renderRow={(member) => {
                          const currentRole = member.role;
                          const draftRole = roleDrafts[member.memberId] || currentRole;
                          const hasRoleDraft = draftRole !== currentRole;
                          const memberKey = `member-${member.memberId}`;
                          const memberBusy = mutatingId === memberKey;
                          const permissionSummary = getEnterprisePermissionLabels(
                            member.permissions?.length
                              ? member.permissions
                              : resolveWorkspacePermissions(member),
                          );
                          const previewPermissions = permissionSummary.slice(0, 2);
                          const remainingPermissionCount = Math.max(
                            permissionSummary.length - previewPermissions.length,
                            0,
                          );
                          const roleDisplay = getRoleDisplayMeta(
                            currentRole,
                            member.customRoleName,
                            member.roleLabel,
                          );

                          return (
                            <>
                              <td className={premiumCellClass}>
                                <div className="flex items-start gap-3">
                                  <div className={premiumAvatarClass}>
                                    {getInitials(getMemberName(member), "MB")}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold leading-snug text-slate-900 dark:text-slate-100">
                                      {getMemberName(member)}
                                    </div>
                                    <div className={`mt-0.5 break-all ${premiumMetaTextClass}`}>
                                      {member.email || "No email"}
                                    </div>
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                      {isCurrentUser(member) ? (
                                        <div className="inline-flex rounded-full border border-sky-300/40 bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-sky-600 dark:text-sky-100">
                                          You
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className={premiumCellClass}>
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <WorkspaceRolePill role={currentRole} compact />
                                    {roleDisplay.isCustom ? (
                                      <span className={premiumPermissionChipClass}>
                                        {roleDisplay.label}
                                      </span>
                                    ) : null}
                                  </div>
                                  {canManageMemberAccess(member) ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <select
                                        value={draftRole}
                                        disabled={memberBusy}
                                        onChange={(event) =>
                                          setRoleDrafts((current) => ({
                                            ...current,
                                            [member.memberId]: event.target.value,
                                          }))
                                        }
                                        className={compactSelectClassName}
                                      >
                                        {manageableRoleOptions.map((option) => (
                                          <option key={option.value} value={option.value}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                      {hasRoleDraft ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          disabled={memberBusy}
                                          onClick={() =>
                                            setConfirmState({
                                              open: true,
                                              title: "Change member role",
                                              message: `Change ${getMemberName(member)} from ${getWorkspaceRoleLabel(
                                                currentRole,
                                              )} to ${getWorkspaceRoleLabel(draftRole)}?`,
                                              type: "change_role",
                                              payload: {
                                                ...member,
                                                nextRole: draftRole,
                                              },
                                            })
                                          }
                                        >
                                          Apply
                                        </Button>
                                      ) : null}
                                    </div>
                                  ) : null}
                                  {isEnterprisePlan && (
                                    <div className={premiumPermissionSummaryClass}>
                                      <span className="font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                        Access
                                      </span>
                                      <span className="text-slate-600 dark:text-slate-300">
                                        {permissionSummary.length} permission
                                        {permissionSummary.length === 1 ? "" : "s"}
                                      </span>
                                      {previewPermissions[0] ? (
                                        <span className={premiumPermissionChipClass}>
                                          {previewPermissions[0].label}
                                        </span>
                                      ) : null}
                                      {remainingPermissionCount > 0 ? (
                                        <span className={premiumPermissionChipClass}>
                                          +{remainingPermissionCount} more
                                        </span>
                                      ) : null}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className={accessActionButtonClass}
                                        onClick={() => setExpandedPermissionMemberId(member.memberId)}
                                      >
                                        {canManageMemberAccess(member) ? "Edit access" : "View access"}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className={premiumCellClass}>
                                <Badge
                                  kind="active"
                                  value={member.active ? "ENABLED" : "DISABLED"}
                                />
                              </td>
                              <td className={`${premiumCellClass} whitespace-nowrap`}>
                                <div className={premiumMetaTextClass}>{formatDateTime(member.createdAt)}</div>
                              </td>
                              <td className={`${premiumCellClass} text-right`}>
                                <div className="flex flex-wrap justify-end gap-2">
                                  {canManageTeam ? (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={!canManageMemberAccess(member) || memberBusy}
                                        onClick={() =>
                                          setConfirmState({
                                            open: true,
                                            title: member.active
                                              ? "Deactivate member"
                                              : "Reactivate member",
                                            message: member.active
                                              ? `Deactivate ${getMemberName(member)}? They will lose workspace access until you re-enable them.`
                                              : `Reactivate ${getMemberName(member)} and restore workspace access?`,
                                            type: "toggle_member",
                                            payload: {
                                              ...member,
                                              nextActive: !member.active,
                                            },
                                          })
                                        }
                                      >
                                        {member.active ? "Disable" : "Enable"}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="danger"
                                        disabled={!canManageMemberAccess(member) || memberBusy}
                                        onClick={() =>
                                          setConfirmState({
                                            open: true,
                                            title: "Remove member",
                                            message: `Remove ${getMemberName(member)} from this workspace? This will revoke their active membership immediately.`,
                                            type: "remove_member",
                                            payload: member,
                                          })
                                        }
                                      >
                                        Remove
                                      </Button>
                                    </>
                                  ) : (
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                      View only
                                    </span>
                                  )}
                                </div>
                              </td>
                            </>
                          );
                        }}
                        emptyTitle="No team members found"
                        emptyMessage={
                          hasMemberFilters
                            ? "Try broader search terms or clear a filter to find the teammate you need."
                            : "Team members will appear here once access has been granted."
                        }
                      />
                    </div>

                    {!loading ? (
                      <PaginationControls
                        page={memberPage}
                        totalPages={totalMemberPages}
                        visibleCount={visibleMembers.length}
                        totalCount={filteredMembers.length}
                        label="members"
                        onPrevious={() => setMemberPage((current) => Math.max(current - 1, 0))}
                        onNext={() =>
                          setMemberPage((current) =>
                            Math.min(current + 1, totalMemberPages - 1),
                          )
                        }
                      />
                    ) : null}
                  </>
                ) : activeTab === "invitations" ? (
                  <>
                    <div className="mt-4 space-y-3 md:hidden">
                      {loading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                          <MobileCardSkeleton
                            key={`invitation-mobile-skeleton-${index}`}
                            rows={3}
                          />
                        ))
                      ) : visibleInvitations.length === 0 ? (
                        <MobileEmptyState
                          title="No pending invitations"
                          message={
                            hasInvitationFilters
                              ? "Try broader search terms or clear a filter to find the invite you need."
                              : "When you invite a teammate, the pending access will appear here."
                          }
                        />
                      ) : (
                        visibleInvitations.map(renderInvitationMobileCard)
                      )}
                    </div>

                    <div className="hidden md:block">
                      <Table
                        columns={invitationColumns}
                        data={visibleInvitations}
                        loading={loading}
                        tableClassName={`min-w-[1080px] ${premiumDesktopTableClass}`}
                        wrapperClassName={`${tableWrapperClass} mt-4`}
                        scrollClassName={premiumTableScrollClass}
                        headClassName={tableHeadClass}
                        bodyClassName={tableBodyClass}
                        rowClassName={tableRowClass}
                        emptyCellClassName="text-slate-600 dark:text-slate-300"
                        rowKey={(invitation) => invitation.invitationId || invitation.email}
                        renderRow={(invitation) => {
                          const inviteKey = `invite-${invitation.invitationId}`;
                          const inviteBusy = mutatingId === inviteKey;
                          const canManageInvitation = canManageInvitationAccess(invitation);
                          const invitationState = getInvitationState(invitation);

                          return (
                            <>
                              <td className={premiumCellClass}>
                                <div className="flex items-start gap-3">
                                  <div className={premiumAvatarClass}>
                                    {getInitials(invitation.email, "IV")}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="break-all font-semibold text-slate-900 dark:text-slate-100">
                                      {invitation.email}
                                    </div>
                                    <div className={`mt-1 ${premiumMetaTextClass}`}>
                                      {invitation.createdBy
                                        ? `Invited by ${invitation.createdBy}`
                                        : "Pending teammate invite"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className={`${premiumCellClass} whitespace-nowrap`}>
                                <WorkspaceRolePill role={invitation.role} compact />
                              </td>
                              <td className={`${premiumCellClass} whitespace-nowrap`}>
                                <div className={premiumMetaTextClass}>
                                  {formatDateTime(invitation.createdAt)}
                                </div>
                                <div className={`mt-1 ${premiumHelperTextClass}`}>
                                  Waiting for acceptance
                                </div>
                              </td>
                              <td className={premiumCellClass}>
                                <div className={premiumMetaTextClass}>
                                  {formatDateTime(invitation.expiresAt)}
                                </div>
                                <div
                                  className={`mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${invitationState.classes}`}
                                >
                                  {invitationState.label}
                                </div>
                                <div className={`mt-2 ${premiumHelperTextClass}`}>
                                  {invitationState.helper}
                                </div>
                              </td>
                              <td className={premiumCellClass}>
                                {canManageTeam ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCopyInvite(invitation)}
                                  >
                                    <Copy className="h-4 w-4" />
                                    Copy link
                                  </Button>
                                ) : (
                                  <span className="text-sm text-slate-500 dark:text-slate-400">
                                    {invitationState.label}
                                  </span>
                                )}
                              </td>
                              <td className={`${premiumCellClass} text-right`}>
                                <div className="flex justify-end">
                                  {canManageTeam ? (
                                    <Button
                                      size="sm"
                                      variant="danger"
                                      disabled={!canManageInvitation || inviteBusy}
                                      onClick={() =>
                                        setConfirmState({
                                          open: true,
                                          title: "Revoke invitation",
                                          message: `Revoke the invitation sent to ${invitation.email}? They will need a new invite to join later.`,
                                          type: "revoke_invitation",
                                          payload: invitation,
                                        })
                                      }
                                    >
                                      Revoke
                                    </Button>
                                  ) : (
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                      View only
                                    </span>
                                  )}
                                </div>
                                {canManageTeam && !canManageInvitation ? (
                                  <div className={`mt-2 ${premiumHelperTextClass}`}>
                                    Below your hierarchy only
                                  </div>
                                ) : null}
                              </td>
                            </>
                          );
                        }}
                        emptyTitle="No pending invitations"
                        emptyMessage={
                          hasInvitationFilters
                            ? "Try broader search terms or clear a filter to find the invite you need."
                            : "When you invite a teammate, the pending access will appear here."
                        }
                      />
                    </div>

                    {!loading ? (
                      <PaginationControls
                        page={invitationPage}
                        totalPages={totalInvitationPages}
                        visibleCount={visibleInvitations.length}
                        totalCount={filteredInvitations.length}
                        label="invitations"
                        onPrevious={() =>
                          setInvitationPage((current) => Math.max(current - 1, 0))
                        }
                        onNext={() =>
                          setInvitationPage((current) =>
                            Math.min(current + 1, totalInvitationPages - 1),
                          )
                        }
                      />
                    ) : null}
                  </>
                ) : (
                  <>
                    <div className="mt-4 space-y-3 md:hidden">
                      {auditLoading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                          <MobileCardSkeleton key={`audit-mobile-skeleton-${index}`} rows={4} />
                        ))
                      ) : auditLogs.length === 0 ? (
                        <MobileEmptyState
                          title="No audit activity found"
                          message={
                            hasAuditFilters
                              ? "Try a broader search or show all activity to see more history."
                              : "Access history will appear here after teammates are invited or roles change."
                          }
                        />
                      ) : (
                        auditLogs.map(renderAuditMobileCard)
                      )}
                    </div>

                    <div className="hidden md:block">
                      <Table
                        columns={auditColumns}
                        data={auditLogs}
                        loading={auditLoading}
                        tableClassName={`min-w-[1200px] ${premiumDesktopTableClass}`}
                        wrapperClassName={`${tableWrapperClass} mt-4`}
                        scrollClassName={premiumTableScrollClass}
                        headClassName={tableHeadClass}
                        bodyClassName={tableBodyClass}
                        rowClassName={tableRowClass}
                        emptyCellClassName="text-slate-600 dark:text-slate-300"
                        rowKey={(entry) => entry.auditId || `${entry.action}-${entry.createdAt}`}
                        renderRow={(entry) => {
                          const actionMeta = getAuditActionMeta(entry.action);
                          const targetPrimary = getAuditTargetPrimary(entry);
                          const targetSecondary = getAuditTargetSecondary(entry);
                          const changeSummary = getAuditChangeSummary(entry);

                          return (
                            <>
                              <td className={premiumCellClass}>
                                <div className="space-y-2">
                                  <div
                                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${actionMeta.classes}`}
                                  >
                                    {actionMeta.label}
                                  </div>
                                  <div className="font-medium text-slate-900 dark:text-slate-100">
                                    {entry.description || "Workspace access activity recorded."}
                                  </div>
                                </div>
                              </td>
                              <td className={premiumCellClass}>
                                <div className="flex items-start gap-3">
                                  <div className={premiumAvatarClass}>
                                    {getInitials(targetPrimary, "AU")}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                                      {targetPrimary}
                                    </div>
                                    {targetSecondary ? (
                                      <div className={`mt-1 ${premiumMetaTextClass}`}>
                                        {targetSecondary}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                              <td className={premiumCellClass}>
                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                  {entry.actor || "System"}
                                </div>
                                <div className={`mt-1 ${premiumHelperTextClass}`}>
                                  Actor on this access event
                                </div>
                              </td>
                              <td className={premiumCellClass}>
                                {changeSummary ? (
                                  <div className="text-sm leading-6 text-slate-700 dark:text-slate-200">
                                    {changeSummary}
                                  </div>
                                ) : (
                                  <div className={premiumMetaTextClass}>
                                    No before-and-after values were recorded for this event.
                                  </div>
                                )}
                              </td>
                              <td className={`${premiumCellClass} whitespace-nowrap`}>
                                <div className={premiumMetaTextClass}>
                                  {formatDateTime(entry.createdAt)}
                                </div>
                              </td>
                            </>
                          );
                        }}
                        emptyTitle="No audit activity found"
                        emptyMessage={
                          hasAuditFilters
                            ? "Try a broader search or show all activity to see more history."
                            : "Access history will appear here after teammates are invited or roles change."
                        }
                      />
                    </div>

                    {!auditLoading ? (
                      <PaginationControls
                        page={auditPage}
                        totalPages={auditTotalPages}
                        visibleCount={auditLogs.length}
                        totalCount={auditTotalItems}
                        label="audit events"
                        onPrevious={() => setAuditPage((current) => Math.max(current - 1, 0))}
                        onNext={() =>
                          setAuditPage((current) => Math.min(current + 1, auditTotalPages - 1))
                        }
                      />
                    ) : null}
                  </>
                )}
              </section>

              <section className="space-y-4 xl:sticky xl:top-6 xl:self-start">
                {activeTab === "audit" ? (
                  <>
                    <div className={`${glassPanelClass} p-4`}>
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-accent-primary" />
                        <h3 className="font-header font-semibold text-slate-900 dark:text-slate-100">
                          Audit coverage
                        </h3>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        This log records invitation activity, member role changes, access
                        activation, deactivation, and removals for the current workspace.
                      </p>
                    </div>

                    <div className={`${glassPanelClass} p-4`}>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-accent-primary" />
                        <h3 className="font-header font-semibold text-slate-900 dark:text-slate-100">
                          Filter status
                        </h3>
                      </div>
                      <div className={`${insetPanelClass} mt-3 px-3 py-3`}>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Current action filter
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {AUDIT_ACTION_OPTIONS.find((option) => option.value === auditAction)
                            ?.label || "All activity"}
                        </p>
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                          {formatNumber(auditTotalItems)} matching event
                          {auditTotalItems === 1 ? "" : "s"} found.
                        </p>
                      </div>
                    </div>

                    <div className={`${glassPanelClass} p-4`}>
                      <div className="flex items-center gap-2">
                        <UserRoundCog className="h-4 w-4 text-accent-primary" />
                        <h3 className="font-header font-semibold text-slate-900 dark:text-slate-100">
                          Review tip
                        </h3>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        Search by teammate name, email, actor, or change description when you need
                        to explain who changed access and when it happened.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {canManageTeam ? (
                      <div ref={invitePanelRef} className={`${glassPanelClass} p-4`}>
                        <div className="flex items-center gap-2">
                          <MailPlus className="h-4 w-4 text-accent-primary" />
                          <h3 className="font-header font-semibold text-slate-900 dark:text-slate-100">
                            Invite teammate
                          </h3>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                          Invite from the right lane from the start. You can currently assign up to{" "}
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {highestManageableRole}
                          </span>
                          .
                        </p>

                        <form onSubmit={handleInviteSubmit} className="mt-4 space-y-3">
                          <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              Email
                            </label>
                            <input
                              type="email"
                              value={inviteForm.email}
                              onChange={(event) =>
                                setInviteForm((current) => ({
                                  ...current,
                                  email: event.target.value,
                                }))
                              }
                              placeholder="teammate@farm.com"
                              className={`mt-1 ${inputClassName}`}
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              Role
                            </label>
                            <select
                              value={inviteForm.role}
                              onChange={(event) =>
                                setInviteForm((current) => ({
                                  ...current,
                                  role: event.target.value,
                                }))
                              }
                              className={`mt-1 ${selectClassName}`}
                            >
                              {manageableRoleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <Button type="submit" disabled={submittingInvite} className="w-full">
                            <MailPlus className="h-4 w-4" />
                            {submittingInvite ? "Inviting..." : "Send invite"}
                          </Button>
                        </form>

                        <div className="mt-4">
                          <RoleGuideCard role={inviteForm.role} active compact />
                        </div>
                      </div>
                    ) : (
                      <div className={`${glassPanelClass} p-4`}>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-accent-primary" />
                          <h3 className="font-header font-semibold text-slate-900 dark:text-slate-100">
                            View permissions
                          </h3>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                          Team actions follow hierarchy first, then permissions. You can review
                          access clearly here, but role changes stay with admins.
                        </p>
                        <div className="mt-4">
                          <RoleGuideCard role={tenantRole} active compact />
                        </div>
                      </div>
                    )}

                    <div className={`${glassPanelClass} p-4`}>
                      <div className="flex items-center gap-2">
                        <UserRoundCog className="h-4 w-4 text-accent-primary" />
                        <h3 className="font-header font-semibold text-slate-900 dark:text-slate-100">
                          Workspace roles
                        </h3>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        Quick role guide for this workspace.
                      </p>
                      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                        {roleGuide.map((role) => (
                          <RoleGuideCard
                            key={role.value}
                            role={role.value}
                            compact
                            active={
                              canManageTeam
                                ? inviteForm.role === role.value
                                : normalizeWorkspaceRole(tenantRole) === role.value
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <div className={`${glassPanelClass} p-4`}>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-accent-primary" />
                        <h3 className="font-header font-semibold text-slate-900 dark:text-slate-100">
                          Access lane
                        </h3>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                        <SidebarStat
                          label="Your role"
                          value={getWorkspaceRoleLabel(tenantRole)}
                          helper={
                            canManageTeam
                              ? `You can manage ${formatNumber(manageableMemberCount)} teammate${manageableMemberCount === 1 ? "" : "s"} beneath your hierarchy level.`
                              : "This page is currently read-only for your role."
                          }
                        />
                        <SidebarStat
                          label="Access leads"
                          value={formatNumber(accessLeadCount)}
                          helper="Owners, admins, and managers coordinating access across this workspace."
                        />
                        <SidebarStat
                          label="Invite health"
                          value={formatNumber(invitations.length)}
                          helper={
                            expiringSoonInviteCount > 0
                              ? `${formatNumber(expiringSoonInviteCount)} invite(s) will expire soon.`
                              : "No invite expiry risk right now."
                          }
                        />
                        <SidebarStat
                          label="Admin coverage"
                          value={formatNumber(adminCount)}
                          helper="Owners and admins who can change roles, disable access, and remove members."
                        />
                      </div>
                    </div>
                  </>
                )}
              </section>
            </div>
          </>
        )}
      </div>

      {isEnterprisePlan && accessEditorMember ? (
        <div
          className="fixed inset-0 z-[12000] flex items-start justify-center overflow-y-auto px-3 py-3 sm:items-center sm:px-4 sm:py-6"
          onClick={accessEditorBusy ? undefined : () => setExpandedPermissionMemberId(null)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/92 shadow-2xl dark:bg-[#061024]/96 sm:max-h-[calc(100vh-3rem)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-access-title"
          >
            <div className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/95 px-4 py-4 backdrop-blur sm:px-5 dark:border-slate-800/70 dark:bg-[#061024]/95">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-accent-primary/20 bg-accent-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-primary dark:text-blue-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Advanced access
                  </div>
                  <h3
                    id="member-access-title"
                    className="mt-3 text-lg font-header font-semibold text-slate-900 dark:text-slate-100 sm:text-xl"
                  >
                    {getMemberName(accessEditorMember)}
                  </h3>
                  <p className="mt-1 break-words pr-2 text-sm text-slate-600 dark:text-slate-300">
                    {accessEditorMember.email || "No email"} ·{" "}
                    {getWorkspaceRoleLabel(accessEditorMember.role)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedPermissionMemberId(null)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white/85 text-slate-500 transition hover:bg-white sm:h-10 sm:w-10 sm:rounded-2xl dark:border-slate-700/80 dark:bg-slate-900/85 dark:text-slate-300 dark:hover:bg-slate-900"
                  aria-label="Close access editor"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-800/80 dark:bg-slate-900/70">
                    <div className="flex flex-wrap items-center gap-2">
                      <WorkspaceRolePill role={accessEditorMember.role} compact />
                      {accessEditorMember.active ? (
                        <Badge kind="active" value="ENABLED" />
                      ) : (
                        <Badge kind="active" value="DISABLED" />
                      )}
                    </div>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                      {accessEditorCanCustomize
                        ? "Choose a role label and fine-tune exactly which enterprise areas this member can open."
                        : "This member's enterprise access can be reviewed here, but not edited from this account."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-800/80 dark:bg-slate-900/55">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                      Custom role label
                    </label>
                    <input
                      type="text"
                      value={accessEditorDraft?.customRoleName || ""}
                      onChange={(event) =>
                        setPermissionDrafts((current) => ({
                          ...current,
                          [accessEditorMember.memberId]: {
                            ...(accessEditorDraft || {
                              customRoleName: "",
                              permissions: sanitizeEnterprisePermissions(
                                accessEditorMember.permissions?.length
                                  ? accessEditorMember.permissions
                                  : resolveWorkspacePermissions(accessEditorMember),
                              ),
                            }),
                            customRoleName: event.target.value,
                          },
                        }))
                      }
                      className={`mt-2 ${inputClassName}`}
                      placeholder="Site lead"
                      disabled={!accessEditorCanCustomize}
                    />
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Leave this blank to keep the standard {getWorkspaceRoleLabel(accessEditorMember.role)} label.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-800/80 dark:bg-slate-900/55">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                        Permissions
                      </div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {accessEditorPermissions.length} active permission
                        {accessEditorPermissions.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {ENTERPRISE_PERMISSION_OPTIONS.map((option) => {
                      const checked = Boolean(
                        accessEditorDraft?.permissions?.includes(option.value),
                      );

                      return (
                        <label
                          key={`modal-${accessEditorMember.memberId}-${option.value}`}
                          className={`rounded-2xl border px-3 py-3 transition ${
                            checked
                              ? "border-accent-primary/30 bg-accent-primary/10"
                              : "border-slate-200/80 bg-slate-50/70 dark:border-slate-800/80 dark:bg-slate-950/50"
                          } ${accessEditorCanCustomize ? "cursor-pointer" : "cursor-default"}`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!accessEditorCanCustomize}
                              onChange={(event) =>
                                setPermissionDrafts((current) => {
                                  const baseDraft = current[accessEditorMember.memberId] || {
                                    customRoleName: accessEditorMember.customRoleName || "",
                                    permissions: sanitizeEnterprisePermissions(
                                      accessEditorMember.permissions?.length
                                        ? accessEditorMember.permissions
                                        : resolveWorkspacePermissions(accessEditorMember),
                                    ),
                                  };
                                  const nextPermissions = event.target.checked
                                    ? [...baseDraft.permissions, option.value]
                                    : baseDraft.permissions.filter((value) => value !== option.value);

                                  return {
                                    ...current,
                                    [accessEditorMember.memberId]: {
                                      ...baseDraft,
                                      permissions: sanitizeEnterprisePermissions(nextPermissions),
                                    },
                                  };
                                })
                              }
                              className="mt-0.5"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {option.label}
                              </div>
                              <div className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                {option.description}
                              </div>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="sticky bottom-0 mt-4 -mx-4 border-t border-slate-200/70 bg-white/95 px-4 pt-4 backdrop-blur sm:-mx-5 sm:px-5 dark:border-slate-800/70 dark:bg-[#061024]/95">
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        disabled={accessEditorBusy}
                        onClick={() => setExpandedPermissionMemberId(null)}
                      >
                        Close
                      </Button>
                      {accessEditorCanCustomize ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full sm:w-auto"
                            disabled={accessEditorBusy}
                            onClick={() =>
                              setPermissionDrafts((current) => ({
                                ...current,
                                [accessEditorMember.memberId]: {
                                  customRoleName: accessEditorMember.customRoleName || "",
                                  permissions: sanitizeEnterprisePermissions(
                                    accessEditorMember.permissions?.length
                                      ? accessEditorMember.permissions
                                      : resolveWorkspacePermissions(accessEditorMember),
                                  ),
                                },
                              }))
                            }
                          >
                            Reset
                          </Button>
                          <Button
                            size="sm"
                            className="w-full sm:w-auto"
                            disabled={
                              accessEditorBusy || !hasPermissionDraftChanges(accessEditorMember)
                            }
                            onClick={() => handleSavePermissionProfile(accessEditorMember)}
                          >
                            {accessEditorBusy ? "Saving..." : "Save access"}
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={
          confirmState.type === "remove_member" || confirmState.type === "revoke_invitation"
            ? "Confirm"
            : "Continue"
        }
        cancelText="Cancel"
        loading={Boolean(mutatingId)}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirm}
      />

      <GlassToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />
    </DashboardLayout>
  );
}

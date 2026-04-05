import { normalizeWorkspaceRole } from "./workspaceRoles";

export const WORKSPACE_PERMISSIONS = Object.freeze({
  SETTINGS_VIEW: "SETTINGS_VIEW",
  SETTINGS_MANAGE: "SETTINGS_MANAGE",
  USERS_VIEW: "USERS_VIEW",
  USERS_MANAGE: "USERS_MANAGE",
  AUDIT_VIEW: "AUDIT_VIEW",
  ENTERPRISE_VIEW: "ENTERPRISE_VIEW",
  ENTERPRISE_MANAGE: "ENTERPRISE_MANAGE",
  REPORT_EXPORT: "REPORT_EXPORT",
  BILLING_VIEW: "BILLING_VIEW",
  BILLING_MANAGE: "BILLING_MANAGE",
});

export const ENTERPRISE_PERMISSION_OPTIONS = Object.freeze([
  {
    value: WORKSPACE_PERMISSIONS.SETTINGS_MANAGE,
    label: "Manage settings",
    description: "Edit workspace branding and farm-wide configuration.",
  },
  {
    value: WORKSPACE_PERMISSIONS.USERS_MANAGE,
    label: "Manage users",
    description: "Invite people, change roles, and update access profiles.",
  },
  {
    value: WORKSPACE_PERMISSIONS.AUDIT_VIEW,
    label: "View audit log",
    description: "Review invitation history, role changes, and access activity.",
  },
  {
    value: WORKSPACE_PERMISSIONS.ENTERPRISE_VIEW,
    label: "View enterprise",
    description: "Open the enterprise operations dashboard and site rollups.",
  },
  {
    value: WORKSPACE_PERMISSIONS.ENTERPRISE_MANAGE,
    label: "Manage enterprise",
    description: "Create branches, edit performance targets, and maintain site records.",
  },
  {
    value: WORKSPACE_PERMISSIONS.REPORT_EXPORT,
    label: "Export reports",
    description: "Download exports and branded reports.",
  },
  {
    value: WORKSPACE_PERMISSIONS.BILLING_MANAGE,
    label: "Manage billing",
    description: "Change plans, review invoices, and update subscription state.",
  },
]);

const ALL_PERMISSIONS = new Set(Object.values(WORKSPACE_PERMISSIONS));

const DEFAULT_ROLE_PERMISSIONS = Object.freeze({
  OWNER: Object.values(WORKSPACE_PERMISSIONS),
  ADMIN: Object.values(WORKSPACE_PERMISSIONS),
  MANAGER: [
    WORKSPACE_PERMISSIONS.SETTINGS_VIEW,
    WORKSPACE_PERMISSIONS.USERS_VIEW,
    WORKSPACE_PERMISSIONS.AUDIT_VIEW,
    WORKSPACE_PERMISSIONS.ENTERPRISE_VIEW,
    WORKSPACE_PERMISSIONS.REPORT_EXPORT,
    WORKSPACE_PERMISSIONS.BILLING_VIEW,
  ],
  STAFF: [
    WORKSPACE_PERMISSIONS.SETTINGS_VIEW,
    WORKSPACE_PERMISSIONS.REPORT_EXPORT,
  ],
});

export function normalizeWorkspacePermission(value) {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return ALL_PERMISSIONS.has(normalized) ? normalized : "";
}

export function normalizeWorkspacePermissions(values = []) {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(values.map((value) => normalizeWorkspacePermission(value)).filter(Boolean)),
  );
}

export function resolveWorkspacePermissions(target) {
  const permissions = normalizeWorkspacePermissions(target?.permissions);
  if (permissions.length > 0) return permissions;

  const role =
    typeof target === "string"
      ? normalizeWorkspaceRole(target)
      : normalizeWorkspaceRole(target?.myRole || target?.role);
  return [...(DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.STAFF)];
}

export function hasWorkspacePermission(target, permission) {
  const normalized = normalizeWorkspacePermission(permission);
  if (!normalized) return false;
  return resolveWorkspacePermissions(target).includes(normalized);
}

export function hasAnyWorkspacePermission(target, permissions = []) {
  return permissions.some((permission) => hasWorkspacePermission(target, permission));
}

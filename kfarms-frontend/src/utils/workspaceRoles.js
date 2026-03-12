const WORKSPACE_ROLE_LABELS = Object.freeze({
  OWNER: "Owner",
  ADMIN: "Admin",
  MANAGER: "Manager",
  USER: "Staff",
  STAFF: "Staff",
  PLATFORM_ADMIN: "Platform Admin",
});

export const MUTABLE_WORKSPACE_ROLE_OPTIONS = Object.freeze([
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "STAFF", label: "Staff" },
]);

export function normalizeWorkspaceRole(value, fallback = "STAFF") {
  const normalized = String(value ?? "").trim().toUpperCase();

  if (normalized === "USER") return "STAFF";
  if (["OWNER", "ADMIN", "MANAGER", "STAFF", "PLATFORM_ADMIN"].includes(normalized)) {
    return normalized;
  }

  return fallback;
}

export function toBackendWorkspaceRole(value) {
  return normalizeWorkspaceRole(value, "STAFF");
}

export function getWorkspaceRoleLabel(value) {
  const normalized = String(value ?? "").trim().toUpperCase();
  return WORKSPACE_ROLE_LABELS[normalized] || WORKSPACE_ROLE_LABELS[normalizeWorkspaceRole(value)];
}

export function canViewWorkspaceUsers(value) {
  const normalized = normalizeWorkspaceRole(value);
  return normalized === "OWNER" || normalized === "ADMIN" || normalized === "MANAGER";
}

export function canManageWorkspaceUsers(value) {
  const normalized = normalizeWorkspaceRole(value);
  return normalized === "OWNER" || normalized === "ADMIN";
}

export function hasWorkspaceRoleAccess(value, allowedRoles = []) {
  const normalized = normalizeWorkspaceRole(value);
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return true;
  }

  return allowedRoles
    .map((role) => normalizeWorkspaceRole(role, ""))
    .includes(normalized);
}

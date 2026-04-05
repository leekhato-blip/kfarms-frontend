const WORKSPACE_ROLE_LABELS = Object.freeze({
  OWNER: "Owner",
  ADMIN: "Admin",
  MANAGER: "Manager",
  USER: "Staff",
  STAFF: "Staff",
<<<<<<< HEAD
  PLATFORM_ADMIN: "ROOTS Admin",
=======
  PLATFORM_ADMIN: "Platform Admin",
>>>>>>> 0babf4d (Update frontend application)
});

export const MUTABLE_WORKSPACE_ROLE_OPTIONS = Object.freeze([
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "STAFF", label: "Staff" },
]);

<<<<<<< HEAD
const WORKSPACE_ROLE_RANKS = Object.freeze({
  STAFF: 100,
  MANAGER: 200,
  ADMIN: 300,
  OWNER: 400,
  PLATFORM_ADMIN: 500,
});

=======
>>>>>>> 0babf4d (Update frontend application)
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

<<<<<<< HEAD
export function getWorkspaceRoleRank(value) {
  return WORKSPACE_ROLE_RANKS[normalizeWorkspaceRole(value)] || WORKSPACE_ROLE_RANKS.STAFF;
}

export function canManageWorkspaceMember(actorRole, targetRole) {
  return getWorkspaceRoleRank(actorRole) > getWorkspaceRoleRank(targetRole);
}

export function canAssignWorkspaceRole(actorRole, targetRole) {
  return getWorkspaceRoleRank(actorRole) > getWorkspaceRoleRank(targetRole);
}

export function getManageableWorkspaceRoleOptions(actorRole) {
  return MUTABLE_WORKSPACE_ROLE_OPTIONS.filter((option) =>
    canAssignWorkspaceRole(actorRole, option.value),
  );
}

=======
>>>>>>> 0babf4d (Update frontend application)
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

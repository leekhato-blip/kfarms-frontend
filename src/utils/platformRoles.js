export const PLATFORM_ROLE_LABELS = Object.freeze({
  PLATFORM_OWNER: "ROOTS Prime",
  PLATFORM_ADMIN: "ROOTS Admin",
  PLATFORM_STAFF: "ROOTS Ops",
  PLATFORM_USER: "ROOTS Access",
  USER: "User",
});

export function normalizePlatformRole(value, fallback = "USER") {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (
    normalized === "PLATFORM_ADMIN" ||
    normalized === "PLATFORM_OWNER" ||
    normalized === "PLATFORM_STAFF" ||
    normalized === "PLATFORM_USER" ||
    normalized === "USER"
  ) {
    return normalized;
  }
  return fallback;
}

export function getPlatformRoleLabel(value) {
  const normalized = normalizePlatformRole(value);
  return PLATFORM_ROLE_LABELS[normalized] || PLATFORM_ROLE_LABELS.USER;
}

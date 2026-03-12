export const TENANT_SCOPED_PATHS = [
  "/dashboard",
  "/sales",
  "/supplies",
  "/fish-ponds",
  "/poultry",
  "/livestock",
  "/feeds",
  "/productions",
  "/settings",
];

export function isTenantOnboardingPath(pathname) {
  return pathname === "/onboarding/create-tenant" || pathname === "/onboarding/accept-invite";
}

export function isTenantScopedPath(pathname) {
  if (!pathname) return false;

  return TENANT_SCOPED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

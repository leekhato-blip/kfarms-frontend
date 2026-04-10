import {
  KFARMS_BASE_PATH,
  KFARMS_LEGACY_ALIASES,
  KFARMS_ROUTE_LIST,
} from "../apps/kfarms/paths";

export const TENANT_SCOPED_PATHS = Object.freeze([
  KFARMS_BASE_PATH,
  ...KFARMS_ROUTE_LIST.flatMap((route) => [route.legacyPath, route.appPath]),
  ...Object.keys(KFARMS_LEGACY_ALIASES),
]);

export function isTenantOnboardingPath(pathname) {
  return pathname === "/onboarding/create-tenant" || pathname === "/onboarding/accept-invite";
}

export function isTenantScopedPath(pathname) {
  if (!pathname) return false;

  return TENANT_SCOPED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

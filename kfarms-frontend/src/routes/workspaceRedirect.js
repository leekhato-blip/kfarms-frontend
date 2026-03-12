import { normalizeLandingPage } from "../constants/settings";
import { resolveTenantLandingPage } from "../tenant/tenantModules";

export function resolveWorkspaceRedirect({
  isAuthenticated,
  loading,
  tenantBootstrapDone,
  activeTenantId,
  activeTenant,
  landingPage,
}) {
  if (loading || (isAuthenticated && !tenantBootstrapDone)) {
    return "loading";
  }

  if (!isAuthenticated) {
    return "/auth/login";
  }

  if (activeTenantId) {
    return resolveTenantLandingPage(normalizeLandingPage(landingPage), activeTenant);
  }

  return "/onboarding/create-tenant";
}

import { normalizeLandingPage } from "../constants/settings";
import { toKfarmsAppPath } from "../apps/kfarms/paths";
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
    return toKfarmsAppPath(
      resolveTenantLandingPage(normalizeLandingPage(landingPage), activeTenant),
    );
  }

  return "/dashboard";
}

import { normalizeLandingPage } from "../constants/settings";
<<<<<<< HEAD
import { toKfarmsAppPath } from "../apps/kfarms/paths";
=======
>>>>>>> 0babf4d (Update frontend application)
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
<<<<<<< HEAD
    return toKfarmsAppPath(
      resolveTenantLandingPage(normalizeLandingPage(landingPage), activeTenant),
    );
=======
    return resolveTenantLandingPage(normalizeLandingPage(landingPage), activeTenant);
>>>>>>> 0babf4d (Update frontend application)
  }

  return "/onboarding/create-tenant";
}

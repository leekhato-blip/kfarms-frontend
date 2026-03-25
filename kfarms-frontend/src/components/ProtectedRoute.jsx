import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../tenant/TenantContext";
import PageLoader from "./PageLoader";
import { isPlanAtLeast, normalizePlanId } from "../constants/plans";
import {
  hasWorkspaceRoleAccess,
  normalizeWorkspaceRole,
} from "../utils/workspaceRoles";
import {
  hasAnyWorkspacePermission,
  normalizeWorkspacePermission,
} from "../utils/workspacePermissions";
import { KFARMS_DEFAULT_APP_PATH } from "../apps/kfarms/paths";
import { isTenantPathEnabled } from "../tenant/tenantModules";

/**
 * ProtectedRoute: wraps route elements that require auth.
 * Usage: <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 */
export default function ProtectedRoute({
  children,
  requireTenant = true,
  minPlan = "FREE",
  allowedWorkspaceRoles = null,
  requiredPermissions = null,
  requiredModules = null,
  redirectTo = KFARMS_DEFAULT_APP_PATH,
  planRedirectTo = null,
  roleRedirectTo = null,
}) {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const { activeTenantId, activeTenant, tenantBootstrapDone } = useTenant();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  if (requireTenant && !tenantBootstrapDone) {
    return <PageLoader />;
  }

  if (requireTenant && !activeTenantId) {
    return <Navigate to="/onboarding/create-tenant" replace state={{ from: location.pathname }} />;
  }

  if (requireTenant) {
    if (activeTenantId && !activeTenant) {
      return <PageLoader />;
    }

    const currentPlan = normalizePlanId(activeTenant?.plan, "FREE");
    if (!isPlanAtLeast(currentPlan, minPlan)) {
      return (
        <Navigate
          to={planRedirectTo || redirectTo}
          replace
          state={{
            from: location.pathname,
            requiredPlan: normalizePlanId(minPlan, "FREE"),
            currentPlan,
          }}
        />
      );
    }

    if (
      Array.isArray(allowedWorkspaceRoles) &&
      allowedWorkspaceRoles.length > 0 &&
      !hasWorkspaceRoleAccess(activeTenant?.myRole, allowedWorkspaceRoles)
    ) {
      return (
        <Navigate
          to={roleRedirectTo || redirectTo}
          replace
          state={{
            from: location.pathname,
            requiredWorkspaceRoles: allowedWorkspaceRoles.map((role) =>
              normalizeWorkspaceRole(role),
            ),
            currentWorkspaceRole: normalizeWorkspaceRole(activeTenant?.myRole),
          }}
        />
      );
    }

    if (
      Array.isArray(requiredPermissions) &&
      requiredPermissions.length > 0 &&
      !hasAnyWorkspacePermission(activeTenant, requiredPermissions)
    ) {
      return (
        <Navigate
          to={roleRedirectTo || redirectTo}
          replace
          state={{
            from: location.pathname,
            requiredPermissions: requiredPermissions.map((permission) =>
              normalizeWorkspacePermission(permission),
            ),
          }}
        />
      );
    }

    if (
      Array.isArray(requiredModules) &&
      requiredModules.length > 0 &&
      !isTenantPathEnabled(location.pathname, activeTenant)
    ) {
      return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
    }
  }

  return children;
}

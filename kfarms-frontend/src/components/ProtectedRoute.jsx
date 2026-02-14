import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../tenant/TenantContext";
import PageLoader from "./PageLoader";

/**
 * ProtectedRoute: wraps route elements that require auth.
 * Usage: <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children, requireTenant = true }) {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const { activeTenantId, tenantBootstrapDone } = useTenant();

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

  return children;
}

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashbordPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SalesPage from "./pages/SalesPage";
import SuppliesPage from "./pages/SuppliesPage";
import FishPonds from "./pages/FishPonds";
import LivestockPage from "./pages/LivestockPage";
import FeedsPage from "./pages/FeedsPage";
import PageLoader from "./components/PageLoader";
import { useAuth } from "./hooks/useAuth";
import ScrollToTop from "./components/ScrollToTop";
import CompanyProfilePage from "./pages/CompanyProfilePage";
import CreateTenant from "./pages/CreateTenant";
import AcceptInvite from "./pages/AcceptInvite";
import { useTenant } from "./tenant/TenantContext";
import BackendRecoveryPrompt from "./components/BackendRecoveryPrompt";

/**
 * App routes:
 * - "/" -> if authenticated -> dashboard, else -> auth page
 * - "/auth" -> auth page (login/signup)
 *
 * Wrap with AuthProvider to give hooks access to auth state
 */
function WorkspaceRedirect() {
  const { isAuthenticated, loading } = useAuth();
  const { activeTenantId, tenantBootstrapDone } = useTenant();

  if (loading || (isAuthenticated && !tenantBootstrapDone)) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (activeTenantId) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/onboarding/create-tenant" replace />;
}

export default function App() {
  const { loading, isAuthenticated } = useAuth();

  return (
    <>
      <ScrollToTop />
      <BackendRecoveryPrompt />
      <Routes>
        <Route
          path="/auth/login"
          element={
            loading ? (
              <PageLoader />
            ) : isAuthenticated ? (
              <Navigate to="/workspace" replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route
          path="/auth/signup"
          element={
            loading ? (
              <PageLoader />
            ) : isAuthenticated ? (
              <Navigate to="/workspace" replace />
            ) : (
              <SignupPage />
            )
          }
        />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/workspace" element={<WorkspaceRedirect />} />
        <Route
          path="/onboarding/create-tenant"
          element={
            <ProtectedRoute requireTenant={false}>
              <CreateTenant />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding/accept-invite"
          element={
            <ProtectedRoute requireTenant={false}>
              <AcceptInvite />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accept-invite"
          element={<Navigate to="/onboarding/accept-invite" replace />}
        />

        <Route path="/" element={<CompanyProfilePage />} />
        <Route path="/company-profile" element={<CompanyProfilePage />} />

        {/* Protected dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        {/* Protected Sales route */}
        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <SalesPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Supplies route */}
        <Route
          path="/supplies"
          element={
            <ProtectedRoute>
              <SuppliesPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Fish Ponds route */}
        <Route
          path="/fish-ponds"
          element={
            <ProtectedRoute>
              <FishPonds />
            </ProtectedRoute>
          }
        />

        {/* Protected Livestock route */}
        <Route
          path="/livestock"
          element={
            <ProtectedRoute>
              <LivestockPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Feeds route */}
        <Route
          path="/feeds"
          element={
            <ProtectedRoute>
              <FeedsPage />
            </ProtectedRoute>
          }
        />

        {/* fallback to company profile as first-load/default page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

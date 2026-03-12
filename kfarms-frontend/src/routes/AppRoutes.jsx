import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../tenant/TenantContext";
import ScrollToTop from "../components/ScrollToTop";
import BackendRecoveryPrompt from "../components/BackendRecoveryPrompt";
import PageLoader from "../components/PageLoader";
import ProtectedRoute from "../components/ProtectedRoute";
import PlatformProtectedRoute from "../auth/ProtectedRoute";
import { resolveWorkspaceRedirect } from "./workspaceRedirect";
import {
  getCachedUserPreferences,
  getUserPreferences,
} from "../services/settingsService";
import { FARM_MODULES } from "../tenant/tenantModules";

const LoginPage = React.lazy(() => import("../pages/LoginPage"));
const SignupPage = React.lazy(() => import("../pages/SignupPage"));
const ForgotPasswordPage = React.lazy(() => import("../pages/ForgotPasswordPage"));
const ResetPasswordPage = React.lazy(() => import("../pages/ResetPasswordPage"));
const DashboardPage = React.lazy(() => import("../pages/DashbordPage"));
const SalesPage = React.lazy(() => import("../pages/SalesPage"));
const SuppliesPage = React.lazy(() => import("../pages/SuppliesPage"));
const InventoryPage = React.lazy(() => import("../pages/InventoryPage"));
const BillingPage = React.lazy(() => import("../pages/BillingPage"));
const SupportPage = React.lazy(() => import("../pages/SupportPage"));
const FishPonds = React.lazy(() => import("../pages/FishPonds"));
const LivestockPage = React.lazy(() => import("../pages/LivestockPage"));
const FeedsPage = React.lazy(() => import("../pages/FeedsPage"));
const ProductionsPage = React.lazy(() => import("../pages/ProductionsPage"));
const SearchPage = React.lazy(() => import("../pages/SearchPage"));
const UsersPage = React.lazy(() => import("../pages/UsersPage"));
const SettingsPage = React.lazy(() => import("../pages/SettingsPage"));
const CompanyProfilePage = React.lazy(() => import("../pages/CompanyProfilePage"));
const CreateTenant = React.lazy(() => import("../pages/CreateTenant"));
const AcceptInvite = React.lazy(() => import("../pages/AcceptInvite"));

const PlatformLayout = React.lazy(() => import("../layouts/PlatformLayout"));
const PlatformLoginPage = React.lazy(() => import("../pages/platform/Login"));
const PlatformDashboardPage = React.lazy(() => import("../pages/platform/Dashboard"));
const PlatformTenantsPage = React.lazy(() => import("../pages/platform/Tenants"));
const PlatformUsersPage = React.lazy(() => import("../pages/platform/Users"));
const PlatformHealthPage = React.lazy(() => import("../pages/platform/Health"));
const PlatformSettingsPage = React.lazy(() => import("../pages/platform/Settings"));

export function WorkspaceRedirect() {
  const { isAuthenticated, loading, user } = useAuth();
  const { activeTenant, activeTenantId, tenantBootstrapDone } = useTenant();
  const userId = user?.id || user?.username || user?.email || "me";
  const [landingPage, setLandingPage] = React.useState("/dashboard");
  const [preferencesReady, setPreferencesReady] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    if (!isAuthenticated || loading || !tenantBootstrapDone) {
      return () => {
        active = false;
      };
    }

    if (!activeTenantId) {
      setLandingPage("/dashboard");
      setPreferencesReady(true);
      return () => {
        active = false;
      };
    }

    const cachedPreferences = getCachedUserPreferences({
      tenantId: activeTenantId,
      userId,
    });

    if (cachedPreferences) {
      setLandingPage(cachedPreferences.landingPage);
      setPreferencesReady(true);
    } else {
      setLandingPage("/dashboard");
      setPreferencesReady(false);
    }

    getUserPreferences({
      tenantId: activeTenantId,
      userId,
    })
      .then((preferences) => {
        if (!active) return;
        setLandingPage(preferences.landingPage);
      })
      .catch(() => {
        if (!active) return;
        setLandingPage((current) => current || "/dashboard");
      })
      .finally(() => {
        if (active) {
          setPreferencesReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, [activeTenantId, isAuthenticated, loading, tenantBootstrapDone, userId]);

  const target = resolveWorkspaceRedirect({
    isAuthenticated,
    loading,
    tenantBootstrapDone,
    activeTenantId,
    activeTenant,
    landingPage,
  });

  const waitingForPreferences =
    isAuthenticated &&
    !loading &&
    tenantBootstrapDone &&
    Boolean(activeTenantId) &&
    !preferencesReady;

  if (target === "loading" || waitingForPreferences) {
    return <PageLoader />;
  }

  return <Navigate to={target} replace />;
}

export default function AppRoutes() {
  const { loading, isAuthenticated } = useAuth();

  return (
    <>
      <ScrollToTop />
      <BackendRecoveryPrompt />
      <React.Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/platform/login"
            element={
              <PlatformProtectedRoute publicOnly>
                <PlatformLoginPage />
              </PlatformProtectedRoute>
            }
          />

          <Route
            path="/platform"
            element={
              <PlatformProtectedRoute>
                <PlatformLayout />
              </PlatformProtectedRoute>
            }
          >
            <Route index element={<PlatformDashboardPage />} />
            <Route path="tenants" element={<PlatformTenantsPage />} />
            <Route path="users" element={<PlatformUsersPage />} />
            <Route path="health" element={<PlatformHealthPage />} />
            <Route path="settings" element={<PlatformSettingsPage />} />
            <Route path="*" element={<Navigate to="/platform" replace />} />
          </Route>

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
          <Route path="/accept-invite" element={<Navigate to="/onboarding/accept-invite" replace />} />

          <Route path="/" element={<CompanyProfilePage />} />
          <Route path="/company-profile" element={<CompanyProfilePage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales"
            element={
              <ProtectedRoute>
                <SalesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplies"
            element={
              <ProtectedRoute>
                <SuppliesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <InventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing"
            element={
              <ProtectedRoute
                requiredPermissions={["BILLING_VIEW", "BILLING_MANAGE"]}
              >
                <BillingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <SupportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fish-ponds"
            element={
              <ProtectedRoute requiredModules={[FARM_MODULES.FISH_FARMING]}>
                <FishPonds />
              </ProtectedRoute>
            }
          />
          <Route
            path="/poultry"
            element={
              <ProtectedRoute requiredModules={[FARM_MODULES.POULTRY]}>
                <LivestockPage />
              </ProtectedRoute>
            }
          />
          <Route path="/livestock" element={<Navigate to="/poultry" replace />} />
          <Route
            path="/feeds"
            element={
              <ProtectedRoute>
                <FeedsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/productions"
            element={
              <ProtectedRoute requiredModules={[FARM_MODULES.POULTRY]}>
                <ProductionsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/enterprise" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute
                requiredPermissions={["SETTINGS_VIEW", "SETTINGS_MANAGE"]}
              >
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute
                minPlan="PRO"
                planRedirectTo="/billing"
                requiredPermissions={["USERS_VIEW", "USERS_MANAGE", "AUDIT_VIEW"]}
              >
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </>
  );
}

import React from "react";
<<<<<<< HEAD
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
=======
import { Navigate, Route, Routes } from "react-router-dom";
>>>>>>> 0babf4d (Update frontend application)
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../tenant/TenantContext";
import ScrollToTop from "../components/ScrollToTop";
import BackendRecoveryPrompt from "../components/BackendRecoveryPrompt";
import PageLoader from "../components/PageLoader";
<<<<<<< HEAD
import PlatformLoader from "../components/PlatformLoader";
=======
>>>>>>> 0babf4d (Update frontend application)
import ProtectedRoute from "../components/ProtectedRoute";
import PlatformProtectedRoute from "../auth/ProtectedRoute";
import { resolveWorkspaceRedirect } from "./workspaceRedirect";
import {
<<<<<<< HEAD
  KFARMS_BASE_PATH,
  KFARMS_DEFAULT_APP_PATH,
  KFARMS_ROUTE_REGISTRY,
  toKfarmsAppPath,
} from "../apps/kfarms/paths";
import { resolveDocumentTitle } from "../utils/pageMeta";
import {
=======
>>>>>>> 0babf4d (Update frontend application)
  getCachedUserPreferences,
  getUserPreferences,
} from "../services/settingsService";
import { FARM_MODULES } from "../tenant/tenantModules";

const LoginPage = React.lazy(() => import("../pages/LoginPage"));
const SignupPage = React.lazy(() => import("../pages/SignupPage"));
<<<<<<< HEAD
const VerifyContactPage = React.lazy(() => import("../pages/VerifyContactPage"));
=======
>>>>>>> 0babf4d (Update frontend application)
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
<<<<<<< HEAD
const ProductProfilePage = React.lazy(() => import("../pages/ProductProfilePage"));
const TermsPage = React.lazy(() => import("../pages/TermsPage"));
=======
>>>>>>> 0babf4d (Update frontend application)
const CreateTenant = React.lazy(() => import("../pages/CreateTenant"));
const AcceptInvite = React.lazy(() => import("../pages/AcceptInvite"));

const PlatformLayout = React.lazy(() => import("../layouts/PlatformLayout"));
const PlatformLoginPage = React.lazy(() => import("../pages/platform/Login"));
<<<<<<< HEAD
const PlatformInviteSetupPage = React.lazy(() => import("../pages/platform/InviteSetup"));
const PlatformDashboardPage = React.lazy(() => import("../pages/platform/Dashboard"));
const PlatformAppsPage = React.lazy(() => import("../pages/platform/Apps"));
const PlatformMessagesPage = React.lazy(() => import("../pages/platform/Messages"));
=======
const PlatformDashboardPage = React.lazy(() => import("../pages/platform/Dashboard"));
>>>>>>> 0babf4d (Update frontend application)
const PlatformTenantsPage = React.lazy(() => import("../pages/platform/Tenants"));
const PlatformUsersPage = React.lazy(() => import("../pages/platform/Users"));
const PlatformHealthPage = React.lazy(() => import("../pages/platform/Health"));
const PlatformSettingsPage = React.lazy(() => import("../pages/platform/Settings"));

<<<<<<< HEAD
const KFARMS_APP_ROUTES = Object.freeze([
  {
    route: KFARMS_ROUTE_REGISTRY.dashboard,
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    route: KFARMS_ROUTE_REGISTRY.sales,
    element: (
      <ProtectedRoute>
        <SalesPage />
      </ProtectedRoute>
    ),
  },
  {
    route: KFARMS_ROUTE_REGISTRY.supplies,
    element: (
      <ProtectedRoute>
        <SuppliesPage />
      </ProtectedRoute>
    ),
  },
  {
    route: KFARMS_ROUTE_REGISTRY.inventory,
    element: (
      <ProtectedRoute>
        <InventoryPage />
      </ProtectedRoute>
    ),
  },
  {
    route: KFARMS_ROUTE_REGISTRY.billing,
    element: (
      <ProtectedRoute
        requiredPermissions={["BILLING_VIEW", "BILLING_MANAGE"]}
        planRedirectTo={toKfarmsAppPath("/billing")}
      >
        <BillingPage />
      </ProtectedRoute>
    ),
  },
  {
    route: KFARMS_ROUTE_REGISTRY.search,
    element: (
      <ProtectedRoute>
        <SearchPage />
      </ProtectedRoute>
    ),
  },
  {
    route: KFARMS_ROUTE_REGISTRY.support,
    element: (
      <ProtectedRoute>
        <SupportPage />
      </ProtectedRoute>
    ),
  },
  {
    route: KFARMS_ROUTE_REGISTRY.fishPonds,
    element: (
      <ProtectedRoute requiredModules={[FARM_MODULES.FISH_FARMING]}>
        <FishPonds />
      </ProtectedRoute>
    ),
  },
  {
    route: KFARMS_ROUTE_REGISTRY.poultry,
    element: (
      <ProtectedRoute requiredModules={[FARM_MODULES.POULTRY]}>
        <LivestockPage />
      </ProtectedRoute>
    ),
  },
  {
    route: KFARMS_ROUTE_REGISTRY.feeds,
    element: (
      <ProtectedRoute>
        <FeedsPage />
      </ProtectedRoute>
    ),
  },
  {
    route: KFARMS_ROUTE_REGISTRY.productions,
    element: (
      <ProtectedRoute requiredModules={[FARM_MODULES.POULTRY]}>
        <ProductionsPage />
      </ProtectedRoute>
    ),
  },
  {
    route: KFARMS_ROUTE_REGISTRY.settings,
    element: (
      <ProtectedRoute
        requiredPermissions={["SETTINGS_VIEW", "SETTINGS_MANAGE"]}
      >
        <SettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    route: KFARMS_ROUTE_REGISTRY.users,
    element: (
      <ProtectedRoute
        minPlan="PRO"
        planRedirectTo={toKfarmsAppPath("/billing")}
        requiredPermissions={["USERS_VIEW", "USERS_MANAGE", "AUDIT_VIEW"]}
      >
        <UsersPage />
      </ProtectedRoute>
    ),
  },
]);

=======
>>>>>>> 0babf4d (Update frontend application)
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
<<<<<<< HEAD
  const location = useLocation();
  const { loading, isAuthenticated } = useAuth();
  const suspenseFallback = location.pathname.startsWith("/platform")
    ? <PlatformLoader />
    : <PageLoader />;

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = resolveDocumentTitle(location.pathname);
  }, [location.pathname]);
=======
  const { loading, isAuthenticated } = useAuth();
>>>>>>> 0babf4d (Update frontend application)

  return (
    <>
      <ScrollToTop />
      <BackendRecoveryPrompt />
<<<<<<< HEAD
      <React.Suspense fallback={suspenseFallback}>
=======
      <React.Suspense fallback={<PageLoader />}>
>>>>>>> 0babf4d (Update frontend application)
        <Routes>
          <Route
            path="/platform/login"
            element={
              <PlatformProtectedRoute publicOnly>
                <PlatformLoginPage />
              </PlatformProtectedRoute>
            }
          />
<<<<<<< HEAD
          <Route path="/platform/setup" element={<PlatformInviteSetupPage />} />
=======
>>>>>>> 0babf4d (Update frontend application)

          <Route
            path="/platform"
            element={
              <PlatformProtectedRoute>
                <PlatformLayout />
              </PlatformProtectedRoute>
            }
          >
            <Route index element={<PlatformDashboardPage />} />
<<<<<<< HEAD
            <Route path="apps" element={<PlatformAppsPage />} />
            <Route path="messages" element={<PlatformMessagesPage />} />
=======
>>>>>>> 0babf4d (Update frontend application)
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
<<<<<<< HEAD
          <Route path="/auth/verify-contact" element={<VerifyContactPage />} />
=======
>>>>>>> 0babf4d (Update frontend application)
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

<<<<<<< HEAD
          <Route path="/" element={<ProductProfilePage />} />
          <Route path="/product-profile" element={<ProductProfilePage />} />
          <Route path="/company-profile" element={<CompanyProfilePage />} />
          <Route path="/terms" element={<TermsPage />} />

          <Route path={KFARMS_BASE_PATH} element={<WorkspaceRedirect />} />
          {KFARMS_APP_ROUTES.map(({ route, element }) => (
            <Route key={route.appPath} path={route.appPath} element={element} />
          ))}
          <Route path={`${KFARMS_BASE_PATH}/*`} element={<Navigate to={KFARMS_BASE_PATH} replace />} />

          {KFARMS_APP_ROUTES.map(({ route }) => (
            <Route
              key={route.legacyPath}
              path={route.legacyPath}
              element={<Navigate to={route.appPath} replace />}
            />
          ))}
          <Route path="/livestock" element={<Navigate to={toKfarmsAppPath("/livestock")} replace />} />
          <Route path="/enterprise" element={<Navigate to={KFARMS_DEFAULT_APP_PATH} replace />} />
=======
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
>>>>>>> 0babf4d (Update frontend application)
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </>
  );
}

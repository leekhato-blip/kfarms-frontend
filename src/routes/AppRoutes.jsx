import React from "react";
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../tenant/TenantContext";
import ScrollToTop from "../components/ScrollToTop";
import BackendRecoveryPrompt from "../components/BackendRecoveryPrompt";
import PageLoader from "../components/PageLoader";
import PlatformLoader from "../components/PlatformLoader";
import ProtectedRoute from "../components/ProtectedRoute";
import PlatformProtectedRoute from "../auth/ProtectedRoute";
import RouteErrorBoundary from "../components/RouteErrorBoundary";
import DashboardLayout from "../layouts/DashboardLayout";
import { resolveWorkspaceRedirect } from "./workspaceRedirect";
import {
  KFARMS_BASE_PATH,
  KFARMS_DEFAULT_APP_PATH,
  KFARMS_ROUTE_REGISTRY,
  toKfarmsAppPath,
} from "../apps/kfarms/paths";
import { resolveDocumentTitle } from "../utils/pageMeta";
import {
  getCachedUserPreferences,
  getUserPreferences,
} from "../services/settingsService";
import { FARM_MODULES } from "../tenant/tenantModules";

const LoginPage = React.lazy(() => import("../pages/LoginPage"));
const SignupPage = React.lazy(() => import("../pages/SignupPage"));
const VerifyContactPage = React.lazy(() => import("../pages/VerifyContactPage"));
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
const ProductProfilePage = React.lazy(() => import("../pages/ProductProfilePage"));
const TermsPage = React.lazy(() => import("../pages/TermsPage"));
const CreateTenant = React.lazy(() => import("../pages/CreateTenant"));
const AcceptInvite = React.lazy(() => import("../pages/AcceptInvite"));

const PlatformLayout = React.lazy(() => import("../layouts/PlatformLayout"));
const PlatformLoginPage = React.lazy(() => import("../pages/platform/Login"));
const PlatformInviteSetupPage = React.lazy(() => import("../pages/platform/InviteSetup"));
const PlatformDashboardPage = React.lazy(() => import("../pages/platform/Dashboard"));
const PlatformAppsPage = React.lazy(() => import("../pages/platform/Apps"));
const PlatformMessagesPage = React.lazy(() => import("../pages/platform/Messages"));
const PlatformTenantsPage = React.lazy(() => import("../pages/platform/Tenants"));
const PlatformUsersPage = React.lazy(() => import("../pages/platform/Users"));
const PlatformHealthPage = React.lazy(() => import("../pages/platform/Health"));
const PlatformSettingsPage = React.lazy(() => import("../pages/platform/Settings"));
const KFARMS_APP_ROUTES = Object.freeze([
  {
    route: KFARMS_ROUTE_REGISTRY.dashboard,
    element: <DashboardPage />,
  },
  {
    route: KFARMS_ROUTE_REGISTRY.sales,
    element: <SalesPage />,
  },
  {
    route: KFARMS_ROUTE_REGISTRY.supplies,
    element: <SuppliesPage />,
  },
  {
    route: KFARMS_ROUTE_REGISTRY.inventory,
    element: <InventoryPage />,
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
    element: <SearchPage />,
  },
  {
    route: KFARMS_ROUTE_REGISTRY.support,
    element: <SupportPage />,
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
    element: <FeedsPage />,
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

function WorkspaceAppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <RouteErrorBoundary
          locationKey={location.key}
          onRecover={() => navigate(location.pathname, { replace: true })}
        >
          <Outlet />
        </RouteErrorBoundary>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

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
  const location = useLocation();
  const { loading, isAuthenticated } = useAuth();
  const suspenseFallback = location.pathname.startsWith("/platform")
    ? <PlatformLoader />
    : <PageLoader />;

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = resolveDocumentTitle(location.pathname);

    const useRootsBrand =
      location.pathname.startsWith("/platform") || location.pathname === "/company-profile";
    const nextFaviconHref = useRootsBrand ? "/roots-favicon.png" : "/kfarms-favicon.png";
    let favicon = document.getElementById("app-favicon");

    if (!favicon) {
      favicon = document.querySelector("link[rel='icon']");
    }

    if (!favicon) {
      favicon = document.createElement("link");
      favicon.setAttribute("rel", "icon");
      favicon.setAttribute("type", "image/png");
      favicon.setAttribute("id", "app-favicon");
      document.head.appendChild(favicon);
    }

    if (favicon.getAttribute("href") !== nextFaviconHref) {
      favicon.setAttribute("href", nextFaviconHref);
    }
  }, [location.pathname]);

  return (
    <>
      <ScrollToTop />
      <BackendRecoveryPrompt />
      <RouteErrorBoundary
        locationKey={location.key}
      >
        <React.Suspense fallback={suspenseFallback}>
          <Routes>
          <Route
            path="/platform/login"
            element={
              <PlatformProtectedRoute publicOnly>
                <PlatformLoginPage />
              </PlatformProtectedRoute>
            }
          />
          <Route path="/platform/setup" element={<PlatformInviteSetupPage />} />

          <Route
            path="/platform"
            element={
              <PlatformProtectedRoute>
                <PlatformLayout />
              </PlatformProtectedRoute>
            }
          >
            <Route index element={<PlatformDashboardPage />} />
            <Route path="apps" element={<PlatformAppsPage />} />
            <Route path="messages" element={<PlatformMessagesPage />} />
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
          <Route path="/auth/verify-contact" element={<VerifyContactPage />} />
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

          <Route path="/" element={<ProductProfilePage />} />
          <Route path="/product-profile" element={<ProductProfilePage />} />
          <Route path="/company-profile" element={<CompanyProfilePage />} />
          <Route path="/terms" element={<TermsPage />} />

          <Route path={KFARMS_BASE_PATH} element={<WorkspaceAppShell />}>
            <Route index element={<WorkspaceRedirect />} />
            {KFARMS_APP_ROUTES.map(({ route, element }) => (
              <Route key={route.appPath} path={route.segment} element={element} />
            ))}
            <Route path="*" element={<Navigate to={KFARMS_BASE_PATH} replace />} />
          </Route>

          {KFARMS_APP_ROUTES.map(({ route }) => (
            <Route
              key={route.legacyPath}
              path={route.legacyPath}
              element={<Navigate to={route.appPath} replace />}
            />
          ))}
          <Route path="/livestock" element={<Navigate to={toKfarmsAppPath("/livestock")} replace />} />
          <Route path="/enterprise" element={<Navigate to={KFARMS_DEFAULT_APP_PATH} replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </React.Suspense>
      </RouteErrorBoundary>
    </>
  );
}

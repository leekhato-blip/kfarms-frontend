/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient, { tenantStorageKey } from "../api/apiClient";
import { useAuth } from "../hooks/useAuth";

const TenantContext = React.createContext(null);

function parseTenantId(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isTenantOnboardingPath(pathname) {
  return pathname === "/onboarding/create-tenant" || pathname === "/onboarding/accept-invite";
}

function isTenantScopedPath(pathname) {
  if (!pathname) return false;
  return [
    "/dashboard",
    "/sales",
    "/supplies",
    "/fish-ponds",
    "/livestock",
    "/feeds",
  ].some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function useTenant() {
  const context = React.useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return context;
}

export function TenantProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [tenants, setTenants] = React.useState([]);
  const tenantsRef = React.useRef([]);
  const refreshPromiseRef = React.useRef(null);
  const networkRetryAfterRef = React.useRef(0);
  const [activeTenantId, setActiveTenantId] = React.useState(() => {
    if (typeof window === "undefined") return null;
    return parseTenantId(window.localStorage.getItem(tenantStorageKey));
  });
  const [loadingTenants, setLoadingTenants] = React.useState(false);
  const [tenantBootstrapDone, setTenantBootstrapDone] = React.useState(false);
  const [tenantSwitchMessage, setTenantSwitchMessage] = React.useState("");
  const pathnameRef = React.useRef(location.pathname);

  React.useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  React.useEffect(() => {
    tenantsRef.current = tenants;
  }, [tenants]);

  const setActiveTenant = React.useCallback((tenantId) => {
    const parsed = parseTenantId(tenantId);
    setActiveTenantId(parsed);

    if (typeof window !== "undefined") {
      if (parsed) {
        window.localStorage.setItem(tenantStorageKey, String(parsed));
      } else {
        window.localStorage.removeItem(tenantStorageKey);
      }
      window.dispatchEvent(
        new CustomEvent("kf-active-tenant-changed", {
          detail: { tenantId: parsed },
        }),
      );
    }
  }, []);

  const refreshTenants = React.useCallback(async (options = {}) => {
    const force = Boolean(options?.force);

    if (!force && !isAuthenticated) {
      return [];
    }

    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    if (Date.now() < networkRetryAfterRef.current) {
      return tenantsRef.current;
    }

    const promise = (async () => {
      setLoadingTenants(true);
      try {
        const res = await apiClient.get("/tenants/my", { skipAuthInvalid: true });
        const payload = res.data?.data ?? res.data;
        const tenantList = Array.isArray(payload) ? payload : [];
        setTenants(tenantList);
        networkRetryAfterRef.current = 0;
        return tenantList;
      } catch (error) {
        const status = error?.response?.status;
        if (status === 400 || status === 401 || status === 403) {
          setTenants([]);
          networkRetryAfterRef.current = 0;
          return [];
        }

        // Backend down / CORS / DNS errors have no HTTP response. Back off briefly.
        if (!error?.response) {
          networkRetryAfterRef.current = Date.now() + 5000;
          return tenantsRef.current;
        }

        throw error;
      } finally {
        setLoadingTenants(false);
        setTenantBootstrapDone(true);
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = promise;
    return promise;
  }, [isAuthenticated]);

  const ensureActiveTenant = React.useCallback(
    (tenantList, options = {}) => {
      const { allowFallback = true, redirectIfEmpty = true } = options;
      const list = Array.isArray(tenantList) ? tenantList : tenantsRef.current;
      const currentPath = pathnameRef.current;

      if (list.length === 0) {
        setActiveTenant(null);
        if (
          redirectIfEmpty &&
          !isTenantOnboardingPath(currentPath) &&
          isTenantScopedPath(currentPath)
        ) {
          navigate("/onboarding/create-tenant", { replace: true });
        }
        return null;
      }

      const persistedTenantId =
        typeof window === "undefined"
          ? null
          : parseTenantId(window.localStorage.getItem(tenantStorageKey));

      if (
        persistedTenantId &&
        list.some((tenant) => Number(tenant?.tenantId) === persistedTenantId)
      ) {
        setActiveTenant(persistedTenantId);
        return persistedTenantId;
      }

      if (!allowFallback) {
        setActiveTenant(null);
        return null;
      }

      const firstTenantId = parseTenantId(list[0]?.tenantId);
      if (firstTenantId) {
        setActiveTenant(firstTenantId);
        return firstTenantId;
      }

      setActiveTenant(null);
      return null;
    },
    [navigate, setActiveTenant],
  );

  const clearTenantSwitchMessage = React.useCallback(() => {
    setTenantSwitchMessage("");
  }, []);

  React.useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setTenants([]);
      setLoadingTenants(false);
      setTenantBootstrapDone(false);
      setTenantSwitchMessage("");
      refreshPromiseRef.current = null;
      networkRetryAfterRef.current = 0;
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const tenantList = await refreshTenants();
        if (cancelled) return;

        if (tenantSwitchMessage) {
          const currentPath = pathnameRef.current;
          if (tenantList.length === 0) {
            ensureActiveTenant([], { allowFallback: false, redirectIfEmpty: false });
          } else {
            setActiveTenant(null);
            if (
              !isTenantOnboardingPath(currentPath) &&
              isTenantScopedPath(currentPath)
            ) {
              navigate("/onboarding/create-tenant", { replace: true });
            }
          }
          return;
        }

        // Keep tenant state in sync without forcing global redirects from non-tenant pages.
        ensureActiveTenant(tenantList, { redirectIfEmpty: false });
      } catch {
        if (cancelled) return;
        setTenants([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    ensureActiveTenant,
    isAuthenticated,
    navigate,
    refreshTenants,
    setActiveTenant,
    tenantSwitchMessage,
  ]);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleInvalidMembership = async (event) => {
      const rawMessage = event?.detail?.message;
      const message =
        typeof rawMessage === "string" &&
        rawMessage.toLowerCase().includes("not a member of this tenant")
          ? "You no longer have access to this organization. Please choose another one."
          : rawMessage ||
            "You no longer have access to this organization. Please choose another one.";

      setTenantSwitchMessage(message);
      setActiveTenant(null);

      try {
        const tenantList = await refreshTenants();
        const currentPath = pathnameRef.current;
        if (tenantList.length === 0) {
          if (
            !isTenantOnboardingPath(currentPath) &&
            isTenantScopedPath(currentPath)
          ) {
            navigate("/onboarding/create-tenant", { replace: true });
          }
          return;
        }

        if (
          !isTenantOnboardingPath(currentPath) &&
          isTenantScopedPath(currentPath)
        ) {
          navigate("/onboarding/create-tenant", { replace: true });
        }
      } catch {
        const currentPath = pathnameRef.current;
        if (
          !isTenantOnboardingPath(currentPath) &&
          isTenantScopedPath(currentPath)
        ) {
          navigate("/onboarding/create-tenant", { replace: true });
        }
      }
    };

    window.addEventListener("kf-tenant-membership-invalid", handleInvalidMembership);
    return () => {
      window.removeEventListener("kf-tenant-membership-invalid", handleInvalidMembership);
    };
  }, [navigate, refreshTenants, setActiveTenant]);

  const activeTenant = React.useMemo(
    () =>
      tenants.find((tenant) => Number(tenant?.tenantId) === Number(activeTenantId)) || null,
    [activeTenantId, tenants],
  );

  const value = React.useMemo(
    () => ({
      tenants,
      activeTenant,
      activeTenantId,
      loadingTenants,
      tenantBootstrapDone,
      tenantSwitchMessage,
      refreshTenants,
      setActiveTenant,
      ensureActiveTenant,
      clearTenantSwitchMessage,
    }),
    [
      tenants,
      activeTenant,
      activeTenantId,
      loadingTenants,
      tenantBootstrapDone,
      tenantSwitchMessage,
      refreshTenants,
      setActiveTenant,
      ensureActiveTenant,
      clearTenantSwitchMessage,
    ],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

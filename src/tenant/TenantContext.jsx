/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient, { tenantStorageKey } from "../api/apiClient";
import { useAuth } from "../hooks/useAuth";
import { isTenantOnboardingPath, isTenantScopedPath } from "./tenantRouting";
import { FARM_MODULES, normalizeEnabledModules } from "./tenantModules";
import { normalizePlanId } from "../constants/plans";

const TenantContext = React.createContext(null);
const TENANT_PLAN_OVERRIDE_STORAGE_KEY = "kf-placeholder-tenant-plan-overrides";

function parseTenantId(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function readTenantPlanOverrides() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TENANT_PLAN_OVERRIDE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeTenantPlanOverrides(overrides) {
  if (typeof window === "undefined") return;

  if (!overrides || Object.keys(overrides).length === 0) {
    window.localStorage.removeItem(TENANT_PLAN_OVERRIDE_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(
    TENANT_PLAN_OVERRIDE_STORAGE_KEY,
    JSON.stringify(overrides),
  );
}

function reconcileTenantPlanOverrides(tenantList = [], currentOverrides = {}) {
  if (!currentOverrides || typeof currentOverrides !== "object") {
    return { nextOverrides: {}, changed: false };
  }

  let changed = false;
  const nextOverrides = { ...currentOverrides };

  tenantList.forEach((tenant) => {
    const key = String(Number(tenant?.tenantId) || "");
    if (!key || !Object.prototype.hasOwnProperty.call(nextOverrides, key)) {
      return;
    }

    const serverPlan = normalizePlanId(tenant?.plan, "");
    const overridePlan = normalizePlanId(nextOverrides[key], "");

    if (!serverPlan || !overridePlan || serverPlan === overridePlan) {
      return;
    }

    delete nextOverrides[key];
    changed = true;
  });

  return { nextOverrides, changed };
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
  const { isAuthenticated, loading: authLoading, user } = useAuth();

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
  const [tenantPlanOverrides, setTenantPlanOverrides] = React.useState(
    () => readTenantPlanOverrides(),
  );
  const pathnameRef = React.useRef(location.pathname);
  const lastAuthIdentityRef = React.useRef("");

  React.useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  React.useEffect(() => {
    tenantsRef.current = tenants;
  }, [tenants]);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleOverridesChanged = () => {
      setTenantPlanOverrides(readTenantPlanOverrides());
    };

    const handleStorage = (event) => {
      if (event?.key && event.key !== TENANT_PLAN_OVERRIDE_STORAGE_KEY) {
        return;
      }
      handleOverridesChanged();
    };

    window.addEventListener("kf-tenant-plan-overrides-changed", handleOverridesChanged);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("kf-tenant-plan-overrides-changed", handleOverridesChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

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

  const resetTenantState = React.useCallback(() => {
    setTenants([]);
    tenantsRef.current = [];
    setLoadingTenants(false);
    setTenantBootstrapDone(false);
    setTenantSwitchMessage("");
    refreshPromiseRef.current = null;
    networkRetryAfterRef.current = 0;
    setTenantPlanOverrides(readTenantPlanOverrides());
    setActiveTenant(null);
  }, [setActiveTenant]);

  const authIdentityKey = React.useMemo(() => {
    if (!isAuthenticated) return "";
    const rawIdentity =
      user?.id ??
      user?.userId ??
      user?.email ??
      user?.username ??
      user?.displayName ??
      "";
    return String(rawIdentity || "").trim();
  }, [
    isAuthenticated,
    user?.displayName,
    user?.email,
    user?.id,
    user?.userId,
    user?.username,
  ]);

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
        const { nextOverrides, changed } = reconcileTenantPlanOverrides(
          tenantList,
          readTenantPlanOverrides(),
        );
        if (changed) {
          writeTenantPlanOverrides(nextOverrides);
          setTenantPlanOverrides(nextOverrides);
        }
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
      lastAuthIdentityRef.current = "";
      resetTenantState();
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
    resetTenantState,
    tenantSwitchMessage,
  ]);

  React.useEffect(() => {
    if (authLoading || !isAuthenticated || !authIdentityKey) return;

    if (!lastAuthIdentityRef.current) {
      lastAuthIdentityRef.current = authIdentityKey;
      return;
    }

    if (lastAuthIdentityRef.current !== authIdentityKey) {
      resetTenantState();
    }

    lastAuthIdentityRef.current = authIdentityKey;
  }, [authIdentityKey, authLoading, isAuthenticated, resetTenantState]);

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

          return;
        }


      } catch {
        const currentPath = pathnameRef.current;

      }
    };

    window.addEventListener("kf-tenant-membership-invalid", handleInvalidMembership);
    return () => {
      window.removeEventListener("kf-tenant-membership-invalid", handleInvalidMembership);
    };
  }, [navigate, refreshTenants, setActiveTenant]);

  const resolvedTenants = React.useMemo(() => {
    if (!Array.isArray(tenants) || tenants.length === 0) return [];

    return tenants.map((tenant) => {
      const key = String(Number(tenant?.tenantId) || "");
      const overridePlan = key ? tenantPlanOverrides[key] : "";
      const modules = normalizeEnabledModules(tenant);
      const resolvedTenant = !overridePlan
        ? tenant
        : {
            ...tenant,
            plan: String(overridePlan),
          };

      return {
        ...resolvedTenant,
        modules,
        poultryEnabled: modules.includes(FARM_MODULES.POULTRY),
        fishEnabled: modules.includes(FARM_MODULES.FISH_FARMING),
      };
    });
  }, [tenantPlanOverrides, tenants]);

  const activeTenant = React.useMemo(
    () =>
      resolvedTenants.find((tenant) => Number(tenant?.tenantId) === Number(activeTenantId)) ||
      null,
    [activeTenantId, resolvedTenants],
  );

  const value = React.useMemo(
    () => ({
      tenants,
      resolvedTenants,
      activeTenant,
      activeTenantId,
      loadingTenants,
      tenantBootstrapDone,
      tenantSwitchMessage,
      refreshTenants,
      setActiveTenant,
      ensureActiveTenant,
      clearTenantSwitchMessage,
      resetTenantState,
    }),
    [
      tenants,
      resolvedTenants,
      activeTenant,
      activeTenantId,
      loadingTenants,
      tenantBootstrapDone,
      tenantSwitchMessage,
      refreshTenants,
      setActiveTenant,
      ensureActiveTenant,
      clearTenantSwitchMessage,
      resetTenantState,
    ],
  );

  return (
    <TenantContext.Provider
      value={{
        ...value,
        tenants: resolvedTenants,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

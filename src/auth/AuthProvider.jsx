/* eslint-disable react-refresh/only-export-components */
import React from "react";
import {
  clearPlatformSession,
  getPlatformToken,
<<<<<<< HEAD
  getPlatformTenantId,
  getApiErrorMessage,
  PLATFORM_JWT_FALLBACK_KEY,
  PLATFORM_TOKEN_KEY,
  platformAxios,
  setPlatformTenantId,
  setPlatformToken,
  unwrapApiResponse,
} from "../api/platformClient";
import {
  isPlatformDevToken,
} from "./platformDevSession";
import { normalizePlatformRole } from "../utils/platformRoles";
import {
  applyPlatformUserProfile,
  savePlatformUserProfile,
} from "../services/userProfileService";

const PlatformAuthContext = React.createContext(null);

function normalizeTenantId(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : "";
}

function getTenantList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function resolvePreferredTenantId(tenantList = []) {
  const ids = tenantList
    .map((tenant) => normalizeTenantId(tenant?.tenantId ?? tenant?.id))
    .filter(Boolean);
  const currentTenantId = normalizeTenantId(getPlatformTenantId());

  if (currentTenantId && ids.includes(currentTenantId)) {
    return currentTenantId;
  }

  if (currentTenantId && ids.length === 0) {
    return currentTenantId;
  }

  return ids[0] || "";
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  return fallback;
}

export function PlatformAuthProvider({ children }) {
  const [token, setToken] = React.useState(() => getPlatformToken());
  const [user, setUser] = React.useState(null);
  const [profileLoading, setProfileLoading] = React.useState(Boolean(getPlatformToken()));

  const login = React.useCallback((nextToken) => {
    if (isPlatformDevToken(nextToken)) {
      clearPlatformSession();
      setProfileLoading(false);
      setUser(null);
      setToken("");
      return;
    }

    setPlatformToken(nextToken);
    setProfileLoading(Boolean(nextToken));
    setUser(null);
=======
  PLATFORM_JWT_FALLBACK_KEY,
  PLATFORM_TOKEN_KEY,
  setPlatformToken,
} from "../api/platformClient";

const PlatformAuthContext = React.createContext(null);

export function PlatformAuthProvider({ children }) {
  const [token, setToken] = React.useState(() => getPlatformToken());

  const login = React.useCallback((nextToken) => {
    setPlatformToken(nextToken);
>>>>>>> 0babf4d (Update frontend application)
    setToken(nextToken);
  }, []);

  const logout = React.useCallback(() => {
    clearPlatformSession();
    setToken("");
<<<<<<< HEAD
    setUser(null);
    setProfileLoading(false);
=======
>>>>>>> 0babf4d (Update frontend application)
  }, []);

  React.useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== PLATFORM_TOKEN_KEY && event.key !== PLATFORM_JWT_FALLBACK_KEY) return;
<<<<<<< HEAD
      const nextToken = getPlatformToken();
      setToken(nextToken);
      setProfileLoading(Boolean(nextToken));
      if (!nextToken) {
        setUser(null);
      }
=======
      setToken(getPlatformToken());
>>>>>>> 0babf4d (Update frontend application)
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

<<<<<<< HEAD
  React.useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!token) {
        if (active) {
          setUser(null);
          setProfileLoading(false);
        }
        return;
      }

      if (isPlatformDevToken(token)) {
        clearPlatformSession();
        if (active) {
          setToken("");
          setUser(null);
          setProfileLoading(false);
        }
        return;
      }

      setProfileLoading(true);

      try {
        const response = await platformAxios.get("/api/auth/me");
        const payload = unwrapApiResponse(response.data, "Unable to load session profile");
        const nextUser = applyPlatformUserProfile({
          id: Number(payload?.id) || null,
          username: String(payload?.username ?? "").trim(),
          email: String(payload?.email ?? "").trim(),
          role: normalizePlatformRole(payload?.role),
          platformAccess: normalizeBoolean(
            payload?.platformAccess,
            normalizePlatformRole(payload?.role) === "PLATFORM_ADMIN",
          ),
          platformOwner: normalizeBoolean(payload?.platformOwner),
          enabled: normalizeBoolean(payload?.enabled, payload?.active ?? true),
          createdAt: payload?.createdAt || null,
          updatedAt: payload?.updatedAt || null,
        });
        let tenantBootstrapSucceeded = false;
        let resolvedTenantId = "";

        try {
          const tenantsResponse = await platformAxios.get("/api/tenants/my", {
            skipPlatformAuthHandling: true,
          });
          const tenantPayload = unwrapApiResponse(
            tenantsResponse.data,
            "Unable to load available tenants",
          );
          tenantBootstrapSucceeded = true;
          resolvedTenantId = resolvePreferredTenantId(getTenantList(tenantPayload));
        } catch {
          tenantBootstrapSucceeded = false;
        }

        if (!active) return;

        setUser(nextUser);

        if (tenantBootstrapSucceeded) {
          setPlatformTenantId(resolvedTenantId);
        }
      } catch (error) {
        if (!active) return;
        setUser(null);
        if (!String(getApiErrorMessage(error, "")).trim()) {
          clearPlatformSession();
          setToken("");
        }
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [token]);

  const updateProfile = React.useCallback((profile) => {
    if (!user) return null;

    const savedProfile = savePlatformUserProfile({ user, profile });
    const nextUser = applyPlatformUserProfile({
      ...user,
      displayName: savedProfile.displayName || user?.displayName,
      phoneNumber: savedProfile.phoneNumber || user?.phoneNumber,
      jobTitle: savedProfile.jobTitle || user?.jobTitle,
      bio: savedProfile.bio || user?.bio,
    });
    setUser(nextUser);
    return nextUser;
  }, [user]);

  const value = React.useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token) && !isPlatformDevToken(token),
      user,
      profileLoading,
      canAccessPlatform:
        Boolean(user?.platformOwner) ||
        Boolean(user?.platformAccess) ||
        normalizePlatformRole(user?.role) === "PLATFORM_ADMIN",
      isPlatformAdmin:
        normalizePlatformRole(user?.role) === "PLATFORM_ADMIN" || Boolean(user?.platformOwner),
      login,
      logout,
      updateProfile,
    }),
    [token, user, profileLoading, login, logout, updateProfile],
=======
  const value = React.useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, login, logout],
>>>>>>> 0babf4d (Update frontend application)
  );

  return <PlatformAuthContext.Provider value={value}>{children}</PlatformAuthContext.Provider>;
}

export function usePlatformAuth() {
  const context = React.useContext(PlatformAuthContext);

  if (!context) {
    throw new Error("usePlatformAuth must be used within PlatformAuthProvider");
  }

  return context;
}

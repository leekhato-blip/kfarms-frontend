/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { login as loginApi, logout as logoutApi, me as meApi } from "../services/authService";
import { isDemoAccountUser, setDemoAccountHint } from "../auth/demoMode";
import { clearQueuedMutations } from "../offline/offlineStore";
import apiClient, { clearWorkspaceToken, getWorkspaceToken, setWorkspaceToken } from "../api/apiClient";
import {
  applyTenantUserProfile,
  saveTenantUserProfile,
} from "../services/userProfileService";
import { readTokenFromPayload } from "../utils/formatters";

export const AuthContext = React.createContext(null);
const AUTH_SESSION_HINT_KEY = "kf_auth_session_hint";

function isPlatformPathActive() {
  if (typeof window === "undefined") return false;
  return String(window.location.pathname || "").startsWith("/platform");
}

function hasSessionHint() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(AUTH_SESSION_HINT_KEY) === "1";
}

function hasWorkspaceSessionBootstrap() {
  return Boolean(getWorkspaceToken());
}

function setSessionHint(value) {
  if (typeof window === "undefined") return;
  if (value) {
    window.localStorage.setItem(AUTH_SESSION_HINT_KEY, "1");
  } else {
    window.localStorage.removeItem(AUTH_SESSION_HINT_KEY);
  }
}

export function useAuth() {
  return React.useContext(AuthContext);
}


export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(hasWorkspaceSessionBootstrap);

  const setSession = (userData) => {
    const nextUser = applyTenantUserProfile(userData);
    setUser(nextUser);
    setIsAuthenticated(Boolean(nextUser));
    setSessionHint(Boolean(nextUser));
    const demoAccount = isDemoAccountUser(nextUser);
    setDemoAccountHint(demoAccount);
    if (demoAccount) {
      clearQueuedMutations();
    }
  };

  const login = async ({ identifier, password }) => {
    const userData = await loginApi({ identifier, password });
    setWorkspaceToken(readTokenFromPayload(userData));
    const resolvedUser = userData?.user ?? userData;

    setSession(resolvedUser);
    return resolvedUser;
  };

  const logoutLocal = () => {
    clearWorkspaceToken();
    setUser(null);
    setIsAuthenticated(false);
    setSessionHint(false);
    setDemoAccountHint(false);
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // ignore network errors during logout
    } finally {
      logoutLocal();
    }
  };

  const refreshMe = async () => {
    setLoading(true);
    try {
      const userData = await meApi();
      setSession(userData);
    } catch {
      logoutLocal();
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = (profile) => {
    if (!user) return null;
    const savedProfile = saveTenantUserProfile({ user, profile });
    const nextUser = applyTenantUserProfile({
      ...user,
      displayName: savedProfile.displayName || user?.displayName,
      phoneNumber: savedProfile.phoneNumber || user?.phoneNumber,
      jobTitle: savedProfile.jobTitle || user?.jobTitle,
      bio: savedProfile.bio || user?.bio,
    });
    setUser(nextUser);
    return nextUser;
  };

  React.useEffect(() => {
    if (isPlatformPathActive()) {
      setLoading(false);
      return undefined;
    }

    const workspaceToken = getWorkspaceToken();
    if (!workspaceToken) {
      if (hasSessionHint()) {
        logoutLocal();
      }
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    meApi()
      .then(async (userData) => {
        if (!active) return;
        setSession(userData);
      })
      .catch(() => {
        if (!active) return;
        logoutLocal();
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    const handleAuthInvalid = () => logoutLocal();
    window.addEventListener("kf-auth-invalid", handleAuthInvalid);
    return () => window.removeEventListener("kf-auth-invalid", handleAuthInvalid);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        refreshMe,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

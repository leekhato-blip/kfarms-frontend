/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { login as loginApi, logout as logoutApi, me as meApi } from "../services/authService";

export const AuthContext = React.createContext(null);
const AUTH_SESSION_HINT_KEY = "kf_auth_session_hint";

function hasSessionHint() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(AUTH_SESSION_HINT_KEY) === "1";
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
  const [loading, setLoading] = React.useState(hasSessionHint);

  const setSession = (userData) => {
    setUser(userData);
    setIsAuthenticated(Boolean(userData));
    setSessionHint(Boolean(userData));
  };

  const login = async ({ identifier, password }) => {
    const userData = await loginApi({ identifier, password });
    const resolvedUser = userData?.user ?? userData;
    setSession(resolvedUser);
    return resolvedUser;
  };

  const logoutLocal = () => {
    setUser(null);
    setIsAuthenticated(false);
    setSessionHint(false);
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

  React.useEffect(() => {
    if (!hasSessionHint()) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    meApi()
      .then((userData) => {
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

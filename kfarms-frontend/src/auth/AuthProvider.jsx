/* eslint-disable react-refresh/only-export-components */
import React from "react";
import {
  clearPlatformSession,
  getPlatformToken,
  PLATFORM_JWT_FALLBACK_KEY,
  PLATFORM_TOKEN_KEY,
  setPlatformToken,
} from "../api/platformClient";

const PlatformAuthContext = React.createContext(null);

export function PlatformAuthProvider({ children }) {
  const [token, setToken] = React.useState(() => getPlatformToken());

  const login = React.useCallback((nextToken) => {
    setPlatformToken(nextToken);
    setToken(nextToken);
  }, []);

  const logout = React.useCallback(() => {
    clearPlatformSession();
    setToken("");
  }, []);

  React.useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== PLATFORM_TOKEN_KEY && event.key !== PLATFORM_JWT_FALLBACK_KEY) return;
      setToken(getPlatformToken());
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = React.useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, login, logout],
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

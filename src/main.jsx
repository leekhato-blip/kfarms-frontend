import "./index.css";
import App from "./App.jsx";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth.jsx";
import { TenantProvider } from "./tenant/TenantContext.jsx";
import { PlatformAuthProvider } from "./auth/AuthProvider.jsx";
import { initializeOfflineSync } from "./offline/offlineSync.js";
import { getStoredThemeMode, resolveThemeScopeFromPath } from "./constants/settings.js";

const SPA_REDIRECT_STORAGE_KEY = "kf_spa_redirect";
const SERVICE_WORKER_CLEANUP_SESSION_KEY = "kf_sw_cleanup_v3";
const root = document.getElementById("root");

if (typeof document !== "undefined") {
  const initialThemeScope =
    typeof window !== "undefined"
      ? resolveThemeScopeFromPath(window.location.pathname)
      : undefined;
  const initialThemeMode = getStoredThemeMode(initialThemeScope);
  document.documentElement.classList.toggle("dark", initialThemeMode === "dark");
  document.body?.classList.toggle("dark", initialThemeMode === "dark");
  document.documentElement.style.colorScheme = initialThemeMode;
}

async function clearAppCaches() {
  if (typeof window === "undefined" || !("caches" in window)) return;

  const cacheKeys = await window.caches.keys();
  await Promise.all(
    cacheKeys.map((key) => window.caches.delete(key)),
  );
}

async function disableLegacyServiceWorkers() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  const hadRegistrations = registrations.length > 0;
  await Promise.all(
    registrations.map((registration) => registration.unregister().catch(() => false)),
  );
  const cacheKeys =
    "caches" in window ? await window.caches.keys().catch(() => []) : [];
  const hadCaches = Array.isArray(cacheKeys) && cacheKeys.length > 0;
  await clearAppCaches();
  return hadRegistrations || hadCaches;
}

if (typeof window !== "undefined" && window.location.pathname === "/") {
  const pendingRedirect = window.sessionStorage.getItem(SPA_REDIRECT_STORAGE_KEY);
  if (pendingRedirect?.startsWith("/")) {
    window.sessionStorage.removeItem(SPA_REDIRECT_STORAGE_KEY);
    window.history.replaceState(null, "", pendingRedirect);
  }
}

const scheduleIdleWork = (callback) => {
  if (typeof window === "undefined") {
    callback();
    return;
  }

  const idle = window.requestIdleCallback ?? ((fn) => window.setTimeout(fn, 800));
  idle(callback);
};

scheduleIdleWork(() => {
  initializeOfflineSync();
});

if (typeof window !== "undefined" && "serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    disableLegacyServiceWorkers()
      .then((didCleanup) => {
        if (!didCleanup) {
          window.sessionStorage.removeItem(SERVICE_WORKER_CLEANUP_SESSION_KEY);
          return;
        }

        if (window.sessionStorage.getItem(SERVICE_WORKER_CLEANUP_SESSION_KEY) === "1") {
          return;
        }

        window.sessionStorage.setItem(SERVICE_WORKER_CLEANUP_SESSION_KEY, "1");
        window.location.reload();
      })
      .catch((error) => {
        console.error("Legacy service worker cleanup failed", error);
      });
  });
}

const RootMode = import.meta.env.DEV ? React.Fragment : React.StrictMode;

createRoot(root).render(
  <RootMode>
    <PlatformAuthProvider>
      <AuthProvider>
        <BrowserRouter>
          <TenantProvider>
            <App />
          </TenantProvider>
        </BrowserRouter>
      </AuthProvider>
    </PlatformAuthProvider>
  </RootMode>,
);

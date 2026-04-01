import "./index.css";
import App from "./App.jsx";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth.jsx";
import { TenantProvider } from "./tenant/TenantContext.jsx";
import { PlatformAuthProvider } from "./auth/AuthProvider.jsx";
import { initializeOfflineSync } from "./offline/offlineSync.js";

const SPA_REDIRECT_STORAGE_KEY = "kf_spa_redirect";
const LEGACY_CACHE_PREFIXES = ["kfarms-app-shell-", "kfarms-runtime-"];
const root = document.getElementById("root");

async function clearLegacyAppCaches() {
  if (typeof window === "undefined" || !("caches" in window)) return;

  const cacheKeys = await window.caches.keys();
  await Promise.all(
    cacheKeys
      .filter((key) => LEGACY_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix)))
      .map((key) => window.caches.delete(key)),
  );
}

async function disableLegacyServiceWorkers() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations.map((registration) => registration.unregister().catch(() => false)),
  );
  await clearLegacyAppCaches();
}

if (typeof window !== "undefined" && window.location.pathname === "/") {
  const pendingRedirect = window.sessionStorage.getItem(SPA_REDIRECT_STORAGE_KEY);
  if (pendingRedirect?.startsWith("/")) {
    window.sessionStorage.removeItem(SPA_REDIRECT_STORAGE_KEY);
    window.history.replaceState(null, "", pendingRedirect);
  }
}

initializeOfflineSync();

if (typeof window !== "undefined" && "serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    disableLegacyServiceWorkers().catch((error) => {
      console.error("Legacy service worker cleanup failed", error);
    });
  });
}

createRoot(root).render(
  <React.StrictMode>
    <PlatformAuthProvider>
      <AuthProvider>
        <BrowserRouter>
          <TenantProvider>
            <App />
          </TenantProvider>
        </BrowserRouter>
      </AuthProvider>
    </PlatformAuthProvider>
  </React.StrictMode>,
);

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
const root = document.getElementById("root");

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
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed", error);
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

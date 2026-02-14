import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
const PING_PATH = "/health/events";
const ACTIVE_TENANT_STORAGE_KEY = "activeTenantId";
const TENANT_MEMBERSHIP_ERROR = "Not a member of this tenant";
const AUTH_PUBLIC_401_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
]);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

const pingClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 3000,
});

let backendDown = false;
let pingTimer = null;
let sessionValidationPromise = null;

function dispatchWindowEvent(event) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(event);
}

function normalizePath(pathname) {
  const basePath = (pathname || "").split("?")[0].split("#")[0];
  if (!basePath) return "/";
  if (basePath.startsWith("http://") || basePath.startsWith("https://")) {
    return normalizePath(new URL(basePath).pathname);
  }
  return `/${basePath.replace(/^\/+/, "")}`;
}

function combinePaths(left, right) {
  if (!left) return normalizePath(right);
  if (!right) return normalizePath(left);
  return normalizePath(`${left.replace(/\/+$/, "")}/${right.replace(/^\/+/, "")}`);
}

function resolveRequestPath(config) {
  const rawUrl = `${config?.url || ""}`;
  if (!rawUrl) return normalizePath(config?.baseURL || "");
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return normalizePath(rawUrl);
  }
  if (rawUrl === "/api" || rawUrl.startsWith("/api/")) {
    return normalizePath(rawUrl);
  }

  const baseUrl = `${config?.baseURL || API_BASE_URL || ""}`;
  if (!baseUrl) return normalizePath(rawUrl);

  if (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")) {
    return combinePaths(new URL(baseUrl).pathname, rawUrl);
  }

  return combinePaths(baseUrl, rawUrl);
}

function shouldAttachTenantHeader(pathname) {
  if (!pathname.startsWith("/api/")) return false;
  if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) return false;
  if (pathname === "/api/tenants" || pathname === "/api/tenants/") return false;
  if (pathname === "/api/tenants/my" || pathname === "/api/tenants/invites/accept") return false;
  return true;
}

function extractErrorMessage(error) {
  const payload = error?.response?.data;
  if (typeof payload === "string") return payload;
  if (typeof payload?.message === "string") return payload.message;
  if (typeof payload?.error === "string") return payload.error;
  return "";
}

function isNetworkError(error) {
  return (
    !error.response &&
    (error.code === "ECONNABORTED" || error.message === "Network Error" || !error.response)
  );
}

function stopPing() {
  if (!pingTimer) return;
  clearInterval(pingTimer);
  pingTimer = null;
}

function startPing() {
  if (pingTimer) return;
  pingTimer = setInterval(async () => {
    try {
      await pingClient.get(PING_PATH, { validateStatus: () => true });
      backendDown = false;
      stopPing();
      dispatchWindowEvent(new Event("kf-backend-up"));
    } catch {
      // Keep waiting until backend is reachable.
    }
  }, 3000);
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/auth/login") return;
  window.location.assign("/auth/login");
}

async function hasActiveSession() {
  if (sessionValidationPromise) {
    return sessionValidationPromise;
  }

  sessionValidationPromise = (async () => {
    try {
      const res = await pingClient.get("/auth/me", { validateStatus: () => true });
      return res.status >= 200 && res.status < 300;
    } catch {
      // Avoid logging out users on transient network failures.
      return true;
    } finally {
      sessionValidationPromise = null;
    }
  })();

  return sessionValidationPromise;
}

apiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const pathname = resolveRequestPath(config);
  if (!shouldAttachTenantHeader(pathname)) return config;

  const tenantId = window.localStorage.getItem(ACTIVE_TENANT_STORAGE_KEY);
  if (!tenantId) return config;

  config.headers = config.headers || {};
  config.headers["X-Tenant-Id"] = tenantId;
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (backendDown) {
      backendDown = false;
      stopPing();
      dispatchWindowEvent(new Event("kf-backend-up"));
    }
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const skipAuthInvalid = error.config?.skipAuthInvalid;
    const message = extractErrorMessage(error);
    const requestPath = resolveRequestPath(error.config);

    // If we received any HTTP response, the backend is reachable again.
    if (status && backendDown) {
      backendDown = false;
      stopPing();
      dispatchWindowEvent(new Event("kf-backend-up"));
    }

    if (status === 401 && !skipAuthInvalid) {
      const shouldProbeSession = !AUTH_PUBLIC_401_PATHS.has(requestPath);

      if (shouldProbeSession) {
        const sessionActive = await hasActiveSession();
        if (!sessionActive) {
          dispatchWindowEvent(new Event("kf-auth-invalid"));
          redirectToLogin();
        }
      }
    }

    if (status === 403 && message.toLowerCase().includes(TENANT_MEMBERSHIP_ERROR.toLowerCase())) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(ACTIVE_TENANT_STORAGE_KEY);
      }
      dispatchWindowEvent(
        new CustomEvent("kf-tenant-membership-invalid", {
          detail: {
            message: message || TENANT_MEMBERSHIP_ERROR,
          },
        }),
      );
    }

    if (isNetworkError(error) && !backendDown) {
      backendDown = true;
      dispatchWindowEvent(new Event("kf-backend-down"));
      startPing();
    }

    return Promise.reject(error);
  },
);

export const tenantStorageKey = ACTIVE_TENANT_STORAGE_KEY;
export default apiClient;

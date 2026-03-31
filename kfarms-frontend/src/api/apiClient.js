import axios from "axios";
import {
  DEMO_ACCOUNT_BLOCKED_MESSAGE,
  emitDemoAccountBlocked,
  hasDemoAccountHint,
  isDemoBlockedMessage,
} from "../auth/demoMode";
import {
  cacheApiResponse,
  createQueuedAxiosResponse,
  ensureOfflineRequestId,
  getCachedApiResponse,
  shouldServeOfflineImmediately,
} from "../offline/offlineStore";
import { resolveApiBaseUrl } from "./apiBaseUrl";

const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
const PING_PATH = "/auth/login";
const ACTIVE_TENANT_STORAGE_KEY = "activeTenantId";
const TENANT_MEMBERSHIP_ERROR = "Not a member of this tenant";
const BACKEND_UNAVAILABLE_STATUS_CODES = new Set([502, 503, 504]);
const BACKEND_UNAVAILABLE_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ERR_NETWORK",
]);
const AUTH_PUBLIC_401_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/verify-contact",
  "/api/auth/resend-contact-verification",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
]);

export function isPlatformPathname(pathname = "") {
  return String(pathname || "").startsWith("/platform");
}

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
let backendWaitPromise = null;
let lastBackendConfirmedAt = 0;

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

function getHeaderValue(headers, key) {
  if (!headers) return "";
  if (typeof headers.get === "function") {
    return headers.get(key) || "";
  }
  return headers[key] || headers[String(key).toLowerCase()] || headers[String(key).toUpperCase()] || "";
}

function getRenderRoutingHeader(headers) {
  return String(getHeaderValue(headers, "x-render-routing") || "").toLowerCase();
}

export function isBackendUnavailableResponse(response) {
  const status = Number(response?.status || 0);
  if (!Number.isFinite(status) || status <= 0) {
    return false;
  }

  if (getRenderRoutingHeader(response?.headers).includes("no-server")) {
    return true;
  }

  return BACKEND_UNAVAILABLE_STATUS_CODES.has(status);
}

function isBackendReachableResponse(response) {
  const status = Number(response?.status || 0);
  if (!Number.isFinite(status) || status <= 0) {
    return false;
  }

  if (isBackendUnavailableResponse(response)) {
    return false;
  }

  // For readiness checks, any real HTTP response means the host is awake.
  return true;
}

function isCanceledError(error) {
  return (
    axios.isCancel?.(error) ||
    error?.code === "ERR_CANCELED" ||
    error?.name === "CanceledError" ||
    error?.message === "canceled"
  );
}

function isNetworkError(error) {
  if (!error || error.response || isCanceledError(error)) {
    return false;
  }

  if (typeof window !== "undefined" && window.navigator?.onLine === false) {
    return true;
  }

  const code = String(error.code || "").toUpperCase();
  const message = String(error.message || "").toLowerCase();

  return (
    BACKEND_UNAVAILABLE_ERROR_CODES.has(code) ||
    message.includes("network error") ||
    message.includes("connection refused") ||
    message.includes("failed to fetch") ||
    message.includes("load failed")
  );
}

export function isBackendUnavailableError(error) {
  if (!error || isCanceledError(error)) {
    return false;
  }

  if (isBackendUnavailableResponse(error.response)) {
    return true;
  }

  return isNetworkError(error);
}

function isGetRequest(config) {
  return String(config?.method || "get").toUpperCase() === "GET";
}

function isMutationRequest(config) {
  const method = String(config?.method || "").toUpperCase();
  return method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
}

function shouldAllowDemoMutation(pathname) {
  return pathname === "/api/auth/logout";
}

function createDemoModeError(config, requestPath) {
  const error = new Error(DEMO_ACCOUNT_BLOCKED_MESSAGE);
  error.name = "AxiosError";
  error.code = "ERR_DEMO_MODE";
  error.config = config;
  error.response = {
    status: 403,
    statusText: "Forbidden",
    config,
    headers: {},
    data: {
      success: false,
      message: DEMO_ACCOUNT_BLOCKED_MESSAGE,
      path: requestPath,
    },
  };
  return error;
}

function isOfflineSyntheticResponse(response) {
  return (
    getHeaderValue(response?.headers, "x-offline-cache") === "1" ||
    getHeaderValue(response?.headers, "x-offline-queued") === "1"
  );
}

function getRequestStartedAt(config) {
  const startedAt = Number(config?._kfRequestStartedAt);
  return Number.isFinite(startedAt) && startedAt > 0 ? startedAt : 0;
}

export function getBackendConnectionSnapshot() {
  return {
    backendDown,
    lastBackendConfirmedAt,
  };
}

function confirmBackendUp() {
  lastBackendConfirmedAt = Date.now();
  if (!backendDown) return;
  backendDown = false;
  stopPing();
  dispatchWindowEvent(new Event("kf-backend-up"));
}

function markBackendDown(config) {
  const requestStartedAt = getRequestStartedAt(config);
  if (requestStartedAt && requestStartedAt < lastBackendConfirmedAt) {
    return false;
  }

  if (backendDown) return true;

  backendDown = true;
  dispatchWindowEvent(new Event("kf-backend-down"));
  startPing();
  return true;
}

function stopPing() {
  if (!pingTimer) return;
  clearInterval(pingTimer);
  pingTimer = null;
}

export async function probeBackendConnection({
  silent = false,
  bypassBrowserCheck = false,
} = {}) {
  if (
    !bypassBrowserCheck &&
    typeof window !== "undefined" &&
    window.navigator?.onLine === false
  ) {
    if (!silent) {
      markBackendDown({ _kfRequestStartedAt: Date.now() });
    }
    return false;
  }

  try {
    const response = await pingClient.options(PING_PATH, {
      validateStatus: () => true,
    });

    if (isBackendReachableResponse(response)) {
      confirmBackendUp();
      return true;
    }

    if (!silent) {
      markBackendDown({ _kfRequestStartedAt: Date.now() });
    }
    return false;
  } catch (error) {
    if (!silent && isBackendUnavailableError(error)) {
      markBackendDown({ _kfRequestStartedAt: Date.now() });
    }
    return false;
  }
}

export async function waitForBackendConnection({
  timeoutMs = 180000,
  intervalMs = 5000,
  silent = false,
  bypassBrowserCheck = false,
} = {}) {
  if (backendWaitPromise) {
    return backendWaitPromise;
  }

  backendWaitPromise = (async () => {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const reachable = await probeBackendConnection({ silent, bypassBrowserCheck });
      if (reachable) {
        return true;
      }

      await new Promise((resolve) => {
        window.setTimeout(resolve, intervalMs);
      });
    }

    return false;
  })();

  try {
    return await backendWaitPromise;
  } finally {
    backendWaitPromise = null;
  }
}

function startPing() {
  if (pingTimer) return;

  const runProbe = () => {
    void probeBackendConnection({ silent: true, bypassBrowserCheck: true });
  };

  pingTimer = setInterval(runProbe, 3000);
  runProbe();
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (isPlatformPathname(window.location.pathname)) return;
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

  config._kfRequestStartedAt = Date.now();

  const pathname = resolveRequestPath(config);
  if (config.offline?.enabled) {
    ensureOfflineRequestId(config);
  }

  if (shouldAttachTenantHeader(pathname)) {
    const tenantId = window.localStorage.getItem(ACTIVE_TENANT_STORAGE_KEY);
    if (tenantId) {
      config.headers = config.headers || {};
      config.headers["X-Tenant-Id"] = tenantId;
    }
  }

  if (isMutationRequest(config) && hasDemoAccountHint() && !shouldAllowDemoMutation(pathname)) {
    config.adapter = async () => {
      throw createDemoModeError(config, pathname);
    };
    return config;
  }

  if (shouldServeOfflineImmediately(config)) {
    if (isGetRequest(config)) {
      const cachedData = getCachedApiResponse({
        tenantId: config.headers?.["X-Tenant-Id"],
        path: pathname,
        params: config.params,
      });

      if (cachedData) {
        config.adapter = async () => ({
          status: 200,
          statusText: "OK",
          config,
          headers: {
            "x-offline-cache": "1",
          },
          data: cachedData,
        });
        return config;
      }
    }

    if (isMutationRequest(config) && config.offline?.enabled) {
      const queuedResponse = createQueuedAxiosResponse(config, pathname);
      config.adapter = async () => queuedResponse;
      return config;
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const requestPath = resolveRequestPath(response.config);
    if (isGetRequest(response.config) && !response.config?.offline?.skipCache) {
      cacheApiResponse({
        tenantId: response.config?.headers?.["X-Tenant-Id"],
        path: requestPath,
        params: response.config?.params,
        data: response.data,
      });
    }

    if (isBackendUnavailableResponse(response)) {
      markBackendDown(response.config);
    } else if (!isOfflineSyntheticResponse(response)) {
      confirmBackendUp();
    }
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const skipAuthInvalid = error.config?.skipAuthInvalid;
    const message = extractErrorMessage(error);
    const requestPath = resolveRequestPath(error.config);

    // If we received any HTTP response, the backend is reachable again.
    if (status && !isBackendUnavailableResponse(error.response)) {
      confirmBackendUp();
    }

    if (status === 401 && !skipAuthInvalid) {
      const shouldProbeSession = !AUTH_PUBLIC_401_PATHS.has(requestPath);

      if (shouldProbeSession) {
        const sessionActive = await hasActiveSession();
        if (!sessionActive) {
          if (!isPlatformPathname(typeof window !== "undefined" ? window.location.pathname : "")) {
            dispatchWindowEvent(new Event("kf-auth-invalid"));
            redirectToLogin();
          }
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

    if (status === 403 && isDemoBlockedMessage(message)) {
      emitDemoAccountBlocked(message || DEMO_ACCOUNT_BLOCKED_MESSAGE);
    }

    if (isBackendUnavailableError(error)) {
      markBackendDown(error.config);
    }

    if (isBackendUnavailableError(error) && isGetRequest(error.config)) {
      const cachedData = getCachedApiResponse({
        tenantId: error.config?.headers?.["X-Tenant-Id"],
        path: requestPath,
        params: error.config?.params,
      });

      if (cachedData) {
        return Promise.resolve({
          status: 200,
          statusText: "OK",
          config: error.config,
          headers: {
            "x-offline-cache": "1",
          },
          data: cachedData,
        });
      }
    }

    if (
      isBackendUnavailableError(error) &&
      isMutationRequest(error.config) &&
      error.config?.offline?.enabled
    ) {
      return Promise.resolve(createQueuedAxiosResponse(error.config, requestPath));
    }

    return Promise.reject(error);
  },
);

export const tenantStorageKey = ACTIVE_TENANT_STORAGE_KEY;
export default apiClient;

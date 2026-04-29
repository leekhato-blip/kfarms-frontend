import axios from "axios";
import { PLATFORM_API_BASE_URL } from "./endpoints";
import { clearPlatformDevSession, isPlatformDevToken } from "../auth/platformDevSession";

export const PLATFORM_TOKEN_KEY = "roots_platform_token";
export const PLATFORM_JWT_FALLBACK_KEY = "jwt";
export const PLATFORM_FLASH_KEY = "roots_platform_flash";
export const PLATFORM_ACTIVE_TENANT_KEY = "roots_platform_active_tenant_id";

const DEFAULT_PLATFORM_ROUTE_MODE = "api";
let preferredPlatformRouteMode = DEFAULT_PLATFORM_ROUTE_MODE;

export function getPlatformToken() {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem(PLATFORM_TOKEN_KEY) ||
    window.localStorage.getItem(PLATFORM_JWT_FALLBACK_KEY) ||
    ""
  );
}

export function getPlatformTenantId() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(PLATFORM_ACTIVE_TENANT_KEY) || "";
}

export function setPlatformTenantId(tenantId) {
  if (typeof window === "undefined") return;

  if (tenantId || tenantId === 0) {
    window.localStorage.setItem(PLATFORM_ACTIVE_TENANT_KEY, String(tenantId));
  } else {
    window.localStorage.removeItem(PLATFORM_ACTIVE_TENANT_KEY);
  }
}

export function setPlatformToken(token) {
  if (typeof window === "undefined") return;

  if (token) {
    window.localStorage.setItem(PLATFORM_TOKEN_KEY, token);
    window.localStorage.removeItem(PLATFORM_JWT_FALLBACK_KEY);
  } else {
    window.localStorage.removeItem(PLATFORM_TOKEN_KEY);
    window.localStorage.removeItem(PLATFORM_JWT_FALLBACK_KEY);
  }
}

export function clearPlatformSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PLATFORM_TOKEN_KEY);
  window.localStorage.removeItem(PLATFORM_JWT_FALLBACK_KEY);
  window.localStorage.removeItem(PLATFORM_ACTIVE_TENANT_KEY);
  clearPlatformDevSession();
}

function setFlashMessage(message) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLATFORM_FLASH_KEY, message);
}

function redirectToPlatformLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/platform/login") return;
  window.history.replaceState(window.history.state, "", "/platform/login");
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function resolveRequestPath(requestUrl) {
  if (!requestUrl) return "";
  if (/^https?:\/\//i.test(requestUrl)) {
    try {
      return new URL(requestUrl).pathname;
    } catch {
      return requestUrl;
    }
  }
  return requestUrl;
}

function normalizePlatformRouteMode(value) {
  return value === "api" || value === "direct" ? value : "";
}

function isApiPlatformPath(pathname) {
  return pathname === "/api/platform" || pathname.startsWith("/api/platform/");
}

function isDirectPlatformPath(pathname) {
  return pathname === "/platform" || pathname.startsWith("/platform/");
}

function isLocalDevProxyHost(windowLike = globalThis?.window) {
  const hostname = String(windowLike?.location?.hostname || "").trim().toLowerCase();
  const port = String(windowLike?.location?.port || "").trim();
  return (
    ["localhost", "127.0.0.1", "::1"].includes(hostname) &&
    ["5173", "5174"].includes(port)
  );
}

export function resolvePlatformAlternateRequestUrl(pathname, windowLike = globalThis?.window) {
  if (!pathname || /^https?:\/\//i.test(pathname)) return pathname;
  if (!isDirectPlatformPath(pathname)) return pathname;
  if (!isLocalDevProxyHost(windowLike)) return pathname;

  const protocol = windowLike?.location?.protocol === "https:" ? "https:" : "http:";
  const hostname = String(windowLike?.location?.hostname || "localhost").trim() || "localhost";
  return `${protocol}//${hostname}:8080${pathname}`;
}

export function getPlatformRouteMode() {
  return preferredPlatformRouteMode;
}

export function setPlatformRouteMode(mode) {
  const normalized = normalizePlatformRouteMode(mode);
  if (!normalized) return;
  preferredPlatformRouteMode = normalized;
}

export function applyPlatformRouteMode(pathname, mode = getPlatformRouteMode()) {
  const normalizedMode = normalizePlatformRouteMode(mode);

  if (!normalizedMode) return pathname;
  if (normalizedMode === "api" && isDirectPlatformPath(pathname)) {
    return `/api${pathname}`;
  }
  if (normalizedMode === "direct" && isApiPlatformPath(pathname)) {
    return pathname.replace(/^\/api/, "");
  }

  return pathname;
}

export function getAlternatePlatformPath(pathname) {
  if (isApiPlatformPath(pathname)) {
    return pathname.replace(/^\/api/, "");
  }
  if (isDirectPlatformPath(pathname)) {
    return `/api${pathname}`;
  }
  return "";
}

function rememberPlatformRouteMode(pathname) {
  if (isApiPlatformPath(pathname)) {
    setPlatformRouteMode("api");
    return;
  }
  if (isDirectPlatformPath(pathname)) {
    setPlatformRouteMode("direct");
  }
}

export function shouldAttachPlatformTenantHeader(pathname) {
  if (!pathname.startsWith("/api/")) return false;
  if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) return false;
  if (pathname === "/api/tenants" || pathname === "/api/tenants/") return false;
  if (pathname === "/api/tenants/my" || pathname === "/api/tenants/invites/accept") return false;
  return true;
}

export function unwrapApiResponse(payload, fallbackMessage = "Request failed") {
  const isWrapped =
    payload && typeof payload === "object" && Object.prototype.hasOwnProperty.call(payload, "success");

  if (!isWrapped) {
    return payload;
  }

  if (payload.success === false) {
    throw new Error(payload.message || fallbackMessage);
  }

  return payload.data;
}

function getNonEmptyMessage(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function getApiErrorMessage(error, fallbackMessage = "Something went wrong") {
  const payload = error?.response?.data;

  const message =
    getNonEmptyMessage(payload?.message) ||
    getNonEmptyMessage(payload?.error) ||
    getNonEmptyMessage(payload) ||
    getNonEmptyMessage(error?.message);

  if (message) return message;

  return fallbackMessage;
}

export function enrichPlatformRequestConfig(config, context = {}) {
  const token =
    Object.prototype.hasOwnProperty.call(context, "token") ? context.token : getPlatformToken();
  const tenantId =
    Object.prototype.hasOwnProperty.call(context, "tenantId")
      ? context.tenantId
      : getPlatformTenantId();
  const requestUrl = String(config?.url || "");
  const normalizedPath = resolveRequestPath(requestUrl);

  config.headers = config.headers || {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (
    shouldAttachPlatformTenantHeader(normalizedPath) &&
    tenantId &&
    !config.headers["X-Tenant-Id"]
  ) {
    config.headers["X-Tenant-Id"] = tenantId;
  }

  return config;
}

const platformAxios = axios.create({
  baseURL: PLATFORM_API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

platformAxios.interceptors.request.use((config) => {
  const nextConfig = enrichPlatformRequestConfig(config);
  const requestPath = resolveRequestPath(String(nextConfig?.url || ""));
  const preferredPath = applyPlatformRouteMode(requestPath);

  if (preferredPath && preferredPath !== requestPath) {
    nextConfig.url = preferredPath;
  }

  return nextConfig;
});

platformAxios.interceptors.response.use(
  (response) => {
    rememberPlatformRouteMode(resolveRequestPath(response?.config?.url || ""));
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const skipAuthHandling = Boolean(error?.config?.skipPlatformAuthHandling);
    const requestPath = resolveRequestPath(String(error?.config?.url || ""));
    const alternatePath = getAlternatePlatformPath(requestPath);
    const hasRouteRetried = Boolean(error?.config?._platformRouteRetried);

    if (
      !hasRouteRetried &&
      alternatePath &&
      [400, 403, 404, 405].includes(Number(status))
    ) {
      setPlatformRouteMode(isApiPlatformPath(alternatePath) ? "api" : "direct");
      const retriedUrl = resolvePlatformAlternateRequestUrl(alternatePath);

      return platformAxios({
        ...error.config,
        url: retriedUrl,
        _platformRouteRetried: true,
      });
    }

    if (status === 401 && !skipAuthHandling && !isPlatformDevToken(getPlatformToken())) {
      clearPlatformSession();
      setFlashMessage("Session expired. Please log in again.");
      redirectToPlatformLogin();
    }

    return Promise.reject(error);
  },
);

export { platformAxios };
export default platformAxios;

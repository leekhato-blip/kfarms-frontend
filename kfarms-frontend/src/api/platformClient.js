import axios from "axios";
import { PLATFORM_API_BASE_URL } from "./endpoints";

export const PLATFORM_TOKEN_KEY = "roots_platform_token";
export const PLATFORM_JWT_FALLBACK_KEY = "jwt";
export const PLATFORM_FLASH_KEY = "roots_platform_flash";
export const PLATFORM_ACTIVE_TENANT_KEY = "activeTenantId";

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

export function setPlatformToken(token) {
  if (typeof window === "undefined") return;

  if (token) {
    window.localStorage.setItem(PLATFORM_TOKEN_KEY, token);
    window.localStorage.setItem(PLATFORM_JWT_FALLBACK_KEY, token);
  } else {
    window.localStorage.removeItem(PLATFORM_TOKEN_KEY);
    window.localStorage.removeItem(PLATFORM_JWT_FALLBACK_KEY);
  }
}

export function clearPlatformSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PLATFORM_TOKEN_KEY);
  window.localStorage.removeItem(PLATFORM_JWT_FALLBACK_KEY);
}

function setFlashMessage(message) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLATFORM_FLASH_KEY, message);
}

function redirectToPlatformLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/platform/login") return;
  window.location.assign("/platform/login");
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

export function getApiErrorMessage(error, fallbackMessage = "Something went wrong") {
  const payload = error?.response?.data;

  if (typeof payload?.message === "string") return payload.message;
  if (typeof payload?.error === "string") return payload.error;
  if (typeof payload === "string") return payload;
  if (typeof error?.message === "string") return error.message;

  return fallbackMessage;
}

const platformAxios = axios.create({
  baseURL: PLATFORM_API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

platformAxios.interceptors.request.use((config) => {
  const token = getPlatformToken();
  const tenantId = getPlatformTenantId();
  const requestUrl = String(config?.url || "");
  const isAuthRoute = requestUrl.includes("/auth/");
  const normalizedPath = (() => {
    if (!requestUrl) return "";
    if (/^https?:\/\//i.test(requestUrl)) {
      try {
        return new URL(requestUrl).pathname;
      } catch {
        return requestUrl;
      }
    }
    return requestUrl;
  })();
  const isPlatformRoute = normalizedPath.startsWith("/platform/");

  config.headers = config.headers || {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (!isAuthRoute && !isPlatformRoute && tenantId && !config.headers["X-Tenant-Id"]) {
    config.headers["X-Tenant-Id"] = tenantId;
  }

  return config;
});

platformAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const skipAuthHandling = Boolean(error?.config?.skipPlatformAuthHandling);

    if (status === 401 && !skipAuthHandling) {
      clearPlatformSession();
      setFlashMessage("Session expired. Please log in again.");
      redirectToPlatformLogin();
    }

    return Promise.reject(error);
  },
);

export { platformAxios };
export default platformAxios;

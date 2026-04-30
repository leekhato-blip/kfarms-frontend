import { resolveApiBaseUrl } from "./apiBaseUrl";

const rawBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");
export const PLATFORM_API_BASE_URL = API_BASE_URL.replace(/\/api$/i, "");

const platformBaseHasApiSuffix = /\/api$/i.test(PLATFORM_API_BASE_URL);

function normalizeAuthEndpoint(endpoint) {
  if (!endpoint || /^https?:\/\//i.test(endpoint)) return endpoint;

  // Prevent double "/api/api/*" when baseURL already ends in "/api".
  if (platformBaseHasApiSuffix && endpoint.startsWith("/api/")) {
    return endpoint.replace(/^\/api/, "");
  }

  return endpoint;
}

export const HAS_CUSTOM_AUTH_LOGIN_URL = Boolean(import.meta.env.VITE_PLATFORM_AUTH_LOGIN_URL);
export const AUTH_LOGIN_URL = normalizeAuthEndpoint(import.meta.env.VITE_PLATFORM_AUTH_LOGIN_URL || "/api/auth/login");
export const AUTH_LOGIN_FALLBACK_URL = normalizeAuthEndpoint("/auth/login");
export const AUTH_LOGIN_IDENTIFIER_KEY =
  import.meta.env.VITE_PLATFORM_LOGIN_IDENTIFIER_KEY || "emailOrUsername";

export const PLATFORM_ENDPOINTS = {
  overview: "/api/platform/dashboard/overview",
  apps: "/api/platform/apps",
  announcements: "/api/platform/announcements",
  supportTickets: "/api/platform/support/tickets",
  supportTicketMessages: (ticketId) => `/api/platform/support/tickets/${ticketId}/messages`,
  supportTicketStatus: (ticketId) => `/api/platform/support/tickets/${ticketId}`,
  tenants: "/api/platform/tenants",
  tenantDetails: (tenantId) => `/api/platform/tenants/${tenantId}`,
  tenantPlan: (tenantId) => `/api/platform/tenants/${tenantId}/plan`,
  tenantStatus: (tenantId) => `/api/platform/tenants/${tenantId}/status`,
  users: "/api/platform/users",
  userInvites: "/api/platform/users/invites",
  userPlatformAdmin: (userId) => `/api/platform/users/${userId}/platform-admin`,
  userEnabled: (userId) => `/api/platform/users/${userId}/enabled`,
  platformInviteResolve: "/api/auth/platform-invites/resolve",
  platformInviteAccept: "/api/auth/platform-invites/accept",
};

export function cleanQueryParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== undefined && value !== null),
  );
}

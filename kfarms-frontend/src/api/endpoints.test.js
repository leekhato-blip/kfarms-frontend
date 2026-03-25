import { describe, expect, it } from "vitest";
import {
  AUTH_LOGIN_FALLBACK_URL,
  AUTH_LOGIN_URL,
  PLATFORM_API_BASE_URL,
  PLATFORM_ENDPOINTS,
  cleanQueryParams,
} from "./endpoints";

describe("platform endpoints", () => {
  it("targets the api platform controllers by default", () => {
    expect(PLATFORM_API_BASE_URL).not.toMatch(/\/api$/i);
    expect(PLATFORM_ENDPOINTS.overview).toBe("/api/platform/dashboard/overview");
    expect(PLATFORM_ENDPOINTS.apps).toBe("/api/platform/apps");
    expect(PLATFORM_ENDPOINTS.tenants).toBe("/api/platform/tenants");
    expect(PLATFORM_ENDPOINTS.users).toBe("/api/platform/users");
    expect(PLATFORM_ENDPOINTS.tenantDetails(42)).toBe("/api/platform/tenants/42");
    expect(PLATFORM_ENDPOINTS.userEnabled(7)).toBe("/api/platform/users/7/enabled");
  });

  it("normalizes login endpoints so they do not double-prefix api", () => {
    expect(AUTH_LOGIN_URL).toBe("/api/auth/login");
    expect(AUTH_LOGIN_FALLBACK_URL).toBe("/auth/login");
  });

  it("drops empty query params but preserves falsey values that matter", () => {
    expect(
      cleanQueryParams({
        search: "",
        tenantId: 12,
        enabled: false,
        page: 0,
        status: null,
        role: undefined,
      }),
    ).toEqual({
      tenantId: 12,
      enabled: false,
      page: 0,
    });
  });
});

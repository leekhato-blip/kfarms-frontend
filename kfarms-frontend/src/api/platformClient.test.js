import { describe, expect, it } from "vitest";
import {
  applyPlatformRouteMode,
  enrichPlatformRequestConfig,
  getAlternatePlatformPath,
  getApiErrorMessage,
  resolvePlatformAlternateRequestUrl,
  shouldAttachPlatformTenantHeader,
} from "./platformClient";

describe("platformClient", () => {
  it("does not attach the tenant header for direct global platform routes", () => {
    const config = enrichPlatformRequestConfig(
      {
        url: "/platform/dashboard/overview",
        headers: {},
      },
      {
        token: "platform-token",
        tenantId: "17",
      },
    );

    expect(config.headers.Authorization).toBe("Bearer platform-token");
    expect(config.headers["X-Tenant-Id"]).toBeUndefined();
  });

  it("keeps the tenant header enabled for api platform routes", () => {
    expect(shouldAttachPlatformTenantHeader("/api/platform/dashboard/overview")).toBe(true);
  });

  it("does not attach the tenant header on auth routes", () => {
    const config = enrichPlatformRequestConfig(
      {
        url: "/api/auth/login",
        headers: {},
      },
      {
        token: "",
        tenantId: "17",
      },
    );

    expect(config.headers["X-Tenant-Id"]).toBeUndefined();
  });

  it("does not attach the tenant header while discovering available tenants", () => {
    const config = enrichPlatformRequestConfig(
      {
        url: "/api/tenants/my",
        headers: {},
      },
      {
        token: "platform-token",
        tenantId: "17",
      },
    );

    expect(config.headers.Authorization).toBe("Bearer platform-token");
    expect(config.headers["X-Tenant-Id"]).toBeUndefined();
  });

  it("preserves an explicit tenant header when one is already set", () => {
    const config = enrichPlatformRequestConfig(
      {
        url: "/api/support/tickets",
        headers: {
          "X-Tenant-Id": "99",
        },
      },
      {
        token: "",
        tenantId: "17",
      },
    );

    expect(config.headers["X-Tenant-Id"]).toBe("99");
  });

  it("can switch platform routes between api and direct controller layouts", () => {
    expect(applyPlatformRouteMode("/platform/apps", "api")).toBe("/api/platform/apps");
    expect(applyPlatformRouteMode("/api/platform/apps", "direct")).toBe("/platform/apps");
    expect(getAlternatePlatformPath("/api/platform/users")).toBe("/platform/users");
    expect(getAlternatePlatformPath("/platform/users")).toBe("/api/platform/users");
  });

  it("rewrites direct fallback requests to the backend origin on local proxy hosts", () => {
    expect(
      resolvePlatformAlternateRequestUrl("/platform/users", {
        location: {
          protocol: "http:",
          hostname: "localhost",
          port: "5174",
        },
      }),
    ).toBe("http://localhost:8080/platform/users");
  });

  it("leaves direct fallback requests alone outside local proxy hosts", () => {
    expect(
      resolvePlatformAlternateRequestUrl("/platform/users", {
        location: {
          protocol: "https:",
          hostname: "kfarms-app.onrender.com",
          port: "",
        },
      }),
    ).toBe("/platform/users");
  });

  it("falls back when the backend returns an empty error message", () => {
    const message = getApiErrorMessage(
      {
        response: {
          data: {
            message: "   ",
          },
        },
      },
      "Unable to sign in to ROOTS.",
    );

    expect(message).toBe("Unable to sign in to ROOTS.");
  });
});

import { describe, expect, it } from "vitest";
import { resolveWorkspaceRedirect } from "./workspaceRedirect";
import { FARM_MODULES } from "../tenant/tenantModules";

describe("resolveWorkspaceRedirect", () => {
  it("returns loading while auth is still loading", () => {
    const target = resolveWorkspaceRedirect({
      isAuthenticated: false,
      loading: true,
      tenantBootstrapDone: false,
      activeTenantId: null,
    });

    expect(target).toBe("loading");
  });

  it("returns login for unauthenticated users", () => {
    const target = resolveWorkspaceRedirect({
      isAuthenticated: false,
      loading: false,
      tenantBootstrapDone: false,
      activeTenantId: null,
    });

    expect(target).toBe("/auth/login");
  });

  it("returns dashboard for authenticated users with an active tenant", () => {
    const target = resolveWorkspaceRedirect({
      isAuthenticated: true,
      loading: false,
      tenantBootstrapDone: true,
      activeTenantId: 17,
    });

    expect(target).toBe("/dashboard");
  });

  it("returns the saved landing page for authenticated users with an active tenant", () => {
    const target = resolveWorkspaceRedirect({
      isAuthenticated: true,
      loading: false,
      tenantBootstrapDone: true,
      activeTenantId: 17,
      activeTenant: {
        modules: [FARM_MODULES.POULTRY, FARM_MODULES.FISH_FARMING],
      },
      landingPage: "/inventory",
    });

    expect(target).toBe("/inventory");
  });

  it("falls back to dashboard when the saved landing page is not enabled for the tenant", () => {
    const target = resolveWorkspaceRedirect({
      isAuthenticated: true,
      loading: false,
      tenantBootstrapDone: true,
      activeTenantId: 17,
      activeTenant: {
        modules: [FARM_MODULES.FISH_FARMING],
      },
      landingPage: "/poultry",
    });

    expect(target).toBe("/dashboard");
  });

  it("returns create-tenant for authenticated users without a tenant", () => {
    const target = resolveWorkspaceRedirect({
      isAuthenticated: true,
      loading: false,
      tenantBootstrapDone: true,
      activeTenantId: null,
    });

    expect(target).toBe("/onboarding/create-tenant");
  });
});

import { describe, expect, it } from "vitest";
import { KFARMS_ROUTE_REGISTRY } from "../apps/kfarms/paths";
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

  it("returns the KFarms dashboard path for authenticated users with an active tenant", () => {
    const target = resolveWorkspaceRedirect({
      isAuthenticated: true,
      loading: false,
      tenantBootstrapDone: true,
      activeTenantId: 17,
    });

    expect(target).toBe(KFARMS_ROUTE_REGISTRY.dashboard.appPath);
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

    expect(target).toBe(KFARMS_ROUTE_REGISTRY.inventory.appPath);
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

    expect(target).toBe(KFARMS_ROUTE_REGISTRY.dashboard.appPath);
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

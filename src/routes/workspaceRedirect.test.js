import { describe, expect, it } from "vitest";
<<<<<<< HEAD
import { KFARMS_ROUTE_REGISTRY } from "../apps/kfarms/paths";
=======
>>>>>>> 0babf4d (Update frontend application)
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

<<<<<<< HEAD
  it("returns the KFarms dashboard path for authenticated users with an active tenant", () => {
=======
  it("returns dashboard for authenticated users with an active tenant", () => {
>>>>>>> 0babf4d (Update frontend application)
    const target = resolveWorkspaceRedirect({
      isAuthenticated: true,
      loading: false,
      tenantBootstrapDone: true,
      activeTenantId: 17,
    });

<<<<<<< HEAD
    expect(target).toBe(KFARMS_ROUTE_REGISTRY.dashboard.appPath);
=======
    expect(target).toBe("/dashboard");
>>>>>>> 0babf4d (Update frontend application)
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

<<<<<<< HEAD
    expect(target).toBe(KFARMS_ROUTE_REGISTRY.inventory.appPath);
=======
    expect(target).toBe("/inventory");
>>>>>>> 0babf4d (Update frontend application)
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

<<<<<<< HEAD
    expect(target).toBe(KFARMS_ROUTE_REGISTRY.dashboard.appPath);
=======
    expect(target).toBe("/dashboard");
>>>>>>> 0babf4d (Update frontend application)
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

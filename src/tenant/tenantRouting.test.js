import { describe, expect, it } from "vitest";
import {
  TENANT_SCOPED_PATHS,
  isTenantOnboardingPath,
  isTenantScopedPath,
} from "./tenantRouting";
import {
  KFARMS_BASE_PATH,
  KFARMS_ROUTE_REGISTRY,
} from "../apps/kfarms/paths";
    expect(isTenantScopedPath("/platform/tenants")).toBe(false);
    expect(isTenantScopedPath("")).toBe(false);
  });

  it("contains the expected tenant route registry", () => {
    expect(TENANT_SCOPED_PATHS).toEqual(
      expect.arrayContaining([
        "/dashboard",
        "/sales",
        "/supplies",
        "/fish-ponds",
        "/poultry",
        "/livestock",
        "/feeds",
        "/productions",
        "/inventory",
        "/billing",
        "/search",
        "/support",
        "/users",
        "/settings",
        KFARMS_BASE_PATH,
        KFARMS_ROUTE_REGISTRY.dashboard.appPath,
        KFARMS_ROUTE_REGISTRY.billing.appPath,
      ]),
    );
  });
});

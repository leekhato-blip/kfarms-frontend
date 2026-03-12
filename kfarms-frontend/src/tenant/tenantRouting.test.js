import { describe, expect, it } from "vitest";
import {
  TENANT_SCOPED_PATHS,
  isTenantOnboardingPath,
  isTenantScopedPath,
} from "./tenantRouting";

describe("tenantRouting", () => {
  it("detects onboarding routes", () => {
    expect(isTenantOnboardingPath("/onboarding/create-tenant")).toBe(true);
    expect(isTenantOnboardingPath("/onboarding/accept-invite")).toBe(true);
    expect(isTenantOnboardingPath("/dashboard")).toBe(false);
  });

  it("detects tenant-scoped paths and nested routes", () => {
    expect(isTenantScopedPath("/dashboard")).toBe(true);
    expect(isTenantScopedPath("/sales/123")).toBe(true);
    expect(isTenantScopedPath("/productions")).toBe(true);
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
        "/settings",
      ]),
    );
  });
});

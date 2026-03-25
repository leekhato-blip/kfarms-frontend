import { describe, expect, it } from "vitest";
import { resolvePlatformProtectedRedirect } from "./platformRouteGuards";

describe("resolvePlatformProtectedRedirect", () => {
  it("keeps platform guests inside the platform login flow", () => {
    expect(
      resolvePlatformProtectedRedirect({
        publicOnly: false,
        isAuthenticated: false,
        canAccessPlatform: false,
        profileLoading: false,
      }),
    ).toBe("/platform/login");
  });

  it("sends signed-in accounts without platform access back to platform login", () => {
    expect(
      resolvePlatformProtectedRedirect({
        publicOnly: false,
        isAuthenticated: true,
        canAccessPlatform: false,
        profileLoading: false,
      }),
    ).toBe("/platform/login");
  });

  it("lets verified platform-access users enter the control plane", () => {
    expect(
      resolvePlatformProtectedRedirect({
        publicOnly: false,
        isAuthenticated: true,
        canAccessPlatform: true,
        profileLoading: false,
      }),
    ).toBeNull();
  });
});

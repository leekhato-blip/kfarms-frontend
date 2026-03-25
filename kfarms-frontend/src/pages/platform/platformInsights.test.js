import { describe, expect, it } from "vitest";
import {
  filterPlatformUsers,
  hasPlatformAccess,
  isPlatformOwner,
  resolvePlatformAccessTier,
} from "./platformInsights";

describe("platformInsights platform access filters", () => {
  it("keeps platform-access users even when they are not platform admins", () => {
    expect(
      hasPlatformAccess({
        role: "USER",
        platformAccess: true,
      }),
    ).toBe(true);
  });

  it("filters out tenant users without platform access", () => {
    expect(
      filterPlatformUsers([
        { id: 1, role: "PLATFORM_ADMIN" },
        { id: 2, role: "USER", platformAccess: true },
        { id: 3, role: "USER" },
      ]).map((user) => user.id),
    ).toEqual([1, 2]);
  });

  it("marks leekhato@gmail.com as the platform owner", () => {
    expect(isPlatformOwner({ email: "leekhato@gmail.com" })).toBe(true);
    expect(
      resolvePlatformAccessTier({
        email: "leekhato@gmail.com",
        role: "PLATFORM_ADMIN",
        platformAccess: true,
      }),
    ).toBe("PLATFORM_OWNER");
  });
});

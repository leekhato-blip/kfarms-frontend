import { describe, expect, it } from "vitest";
import {
  canAssignPlatformFunction,
  canManagePlatformRole,
  filterPlatformUsers,
  hasPlatformAccess,
  isPlatformOwner,
  isPlatformOpsIdentity,
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

  it("treats roots.ops as ROOTS Ops instead of ROOTS admin", () => {
    expect(
      resolvePlatformAccessTier({
        username: "roots.ops",
        email: "platform.ops@demo.kfarms.local",
        role: "PLATFORM_ADMIN",
        platformAccess: true,
      }),
    ).toBe("PLATFORM_STAFF");
    expect(isPlatformOpsIdentity({ username: "roots.ops" })).toBe(true);
  });

  it("prevents lower tiers from managing higher ROOTS lanes", () => {
    const owner = { username: "kato", email: "leekhato@gmail.com", platformOwner: true };
    const admin = { username: "roots.admin", role: "PLATFORM_ADMIN", platformAccess: true };
    const ops = { username: "roots.ops", role: "PLATFORM_ADMIN", platformAccess: true };
    const staff = { username: "roots.support", role: "USER", platformAccess: true };

    expect(canManagePlatformRole(owner, admin)).toBe(true);
    expect(canManagePlatformRole(admin, owner)).toBe(false);
    expect(canManagePlatformRole(admin, ops)).toBe(true);
    expect(canManagePlatformRole(ops, admin)).toBe(false);
    expect(canAssignPlatformFunction(ops, admin)).toBe(false);
    expect(canAssignPlatformFunction(ops, staff)).toBe(true);
  });
});

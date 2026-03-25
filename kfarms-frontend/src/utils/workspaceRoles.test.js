import { describe, expect, it } from "vitest";

import {
  canAssignWorkspaceRole,
  canManageWorkspaceMember,
  getManageableWorkspaceRoleOptions,
  getWorkspaceRoleRank,
} from "./workspaceRoles";

describe("workspace hierarchy", () => {
  it("orders roles from staff to owner", () => {
    expect(getWorkspaceRoleRank("STAFF")).toBeLessThan(getWorkspaceRoleRank("MANAGER"));
    expect(getWorkspaceRoleRank("MANAGER")).toBeLessThan(getWorkspaceRoleRank("ADMIN"));
    expect(getWorkspaceRoleRank("ADMIN")).toBeLessThan(getWorkspaceRoleRank("OWNER"));
  });

  it("allows managing only lower roles", () => {
    expect(canManageWorkspaceMember("OWNER", "ADMIN")).toBe(true);
    expect(canManageWorkspaceMember("ADMIN", "MANAGER")).toBe(true);
    expect(canManageWorkspaceMember("MANAGER", "STAFF")).toBe(true);
    expect(canManageWorkspaceMember("ADMIN", "ADMIN")).toBe(false);
    expect(canManageWorkspaceMember("ADMIN", "OWNER")).toBe(false);
  });

  it("limits assignable roles to those below the actor", () => {
    expect(canAssignWorkspaceRole("OWNER", "ADMIN")).toBe(true);
    expect(canAssignWorkspaceRole("ADMIN", "ADMIN")).toBe(false);
    expect(canAssignWorkspaceRole("MANAGER", "ADMIN")).toBe(false);
  });

  it("returns manageable role options based on hierarchy", () => {
    expect(getManageableWorkspaceRoleOptions("OWNER").map((option) => option.value)).toEqual([
      "ADMIN",
      "MANAGER",
      "STAFF",
    ]);
    expect(getManageableWorkspaceRoleOptions("ADMIN").map((option) => option.value)).toEqual([
      "MANAGER",
      "STAFF",
    ]);
    expect(getManageableWorkspaceRoleOptions("MANAGER").map((option) => option.value)).toEqual([
      "STAFF",
    ]);
  });
});

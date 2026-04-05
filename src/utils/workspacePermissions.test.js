import { describe, expect, it } from "vitest";
import {
  WORKSPACE_PERMISSIONS,
  normalizeWorkspacePermissions,
  resolveWorkspacePermissions,
} from "./workspacePermissions";

describe("workspacePermissions", () => {
  it("preserves AUDIT_VIEW when normalizing permission lists", () => {
    expect(
      normalizeWorkspacePermissions(["audit_view", "users_manage", "not_real"]),
    ).toEqual([
      WORKSPACE_PERMISSIONS.AUDIT_VIEW,
      WORKSPACE_PERMISSIONS.USERS_MANAGE,
    ]);
  });

  it("includes audit access in the default manager permission bundle", () => {
    expect(resolveWorkspacePermissions({ role: "MANAGER" })).toContain(
      WORKSPACE_PERMISSIONS.AUDIT_VIEW,
    );
  });
});

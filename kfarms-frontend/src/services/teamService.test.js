import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.fn();
const apiPost = vi.fn();
const apiPut = vi.fn();
const apiPatch = vi.fn();
const apiDelete = vi.fn();

vi.mock("../api/apiClient", () => ({
  default: {
    get: apiGet,
    post: apiPost,
    put: apiPut,
    patch: apiPatch,
    delete: apiDelete,
  },
}));

describe("teamService", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiPut.mockReset();
    apiPatch.mockReset();
    apiDelete.mockReset();
  });

  it("normalizes team members", async () => {
    apiGet.mockResolvedValue({
      data: {
        data: [
          {
            memberId: 11,
            userId: 17,
            username: "Grace",
            email: "grace@farm.com",
            role: "user",
            roleLabel: "Operations Controller",
            customRoleName: "Operations Controller",
            permissions: ["users_view", "audit_view"],
            active: true,
            createdBy: "owner@farm.com",
          },
        ],
      },
    });

    const { listTeamMembers } = await import("./teamService");
    const result = await listTeamMembers();

    expect(apiGet).toHaveBeenCalledWith("/tenant/members");
    expect(result).toEqual([
      expect.objectContaining({
        memberId: 11,
        userId: 17,
        username: "Grace",
        email: "grace@farm.com",
        role: "STAFF",
        roleLabel: "Operations Controller",
        customRoleName: "Operations Controller",
        permissions: ["USERS_VIEW", "AUDIT_VIEW"],
        active: true,
        createdBy: "owner@farm.com",
      }),
    ]);
  });

  it("normalizes invitations and builds a share link", async () => {
    apiGet.mockResolvedValue({
      data: {
        data: [
          {
            invitationId: 7,
            email: "invitee@farm.com",
            role: "manager",
            token: "join-token",
            createdBy: "owner@farm.com",
          },
        ],
      },
    });

    const { listPendingInvitations } = await import("./teamService");
    const result = await listPendingInvitations();

    expect(apiGet).toHaveBeenCalledWith("/tenant/invitations");
    expect(result[0]).toMatchObject({
      invitationId: 7,
      email: "invitee@farm.com",
      role: "MANAGER",
      token: "join-token",
      createdBy: "owner@farm.com",
    });
    expect(result[0].inviteLink).toBeTruthy();
    expect(result[0].inviteLink === "join-token" || result[0].inviteLink.includes("token=join-token")).toBe(true);
  });

  it("normalizes paginated audit log responses", async () => {
    apiGet.mockResolvedValue({
      data: {
        data: {
          content: [
            {
              auditId: 7,
              action: "member_role_changed",
              actor: "admin@farm.com",
              targetName: "Grace",
              targetEmail: "grace@farm.com",
              description: "Grace was moved from Staff to Manager.",
              previousValue: "STAFF",
              nextValue: "MANAGER",
              createdAt: "2026-03-11T09:00:00Z",
            },
          ],
          number: 1,
          size: 5,
          totalElements: 12,
          totalPages: 3,
        },
      },
    });

    const { listAuditLogs } = await import("./teamService");
    const result = await listAuditLogs({
      search: "grace",
      action: "MEMBER_ROLE_CHANGED",
      page: 1,
      size: 5,
    });

    expect(apiGet).toHaveBeenCalledWith("/tenant/audit", {
      params: {
        search: "grace",
        action: "MEMBER_ROLE_CHANGED",
        page: 1,
        size: 5,
      },
    });
    expect(result).toMatchObject({
      page: 1,
      totalItems: 12,
      totalPages: 3,
    });
    expect(result.items[0]).toMatchObject({
      auditId: 7,
      action: "MEMBER_ROLE_CHANGED",
      actor: "admin@farm.com",
      targetName: "Grace",
      targetEmail: "grace@farm.com",
      previousValue: "STAFF",
      nextValue: "MANAGER",
    });
  });

  it("creates invitations with normalized roles", async () => {
    apiPost.mockResolvedValue({
      data: {
        data: {
          invitationId: 13,
          email: "new@farm.com",
          role: "staff",
          token: "invite-13",
        },
      },
    });

    const { createInvitation } = await import("./teamService");
    const result = await createInvitation({
      email: "new@farm.com",
      role: "user",
    });

    expect(apiPost).toHaveBeenCalledWith("/tenant/invitations", {
      email: "new@farm.com",
      role: "STAFF",
    });
    expect(result).toMatchObject({
      invitationId: 13,
      email: "new@farm.com",
      role: "STAFF",
    });
  });

  it("updates member roles through the role endpoint", async () => {
    apiPut.mockResolvedValue({
      data: {
        data: {
          memberId: 42,
          email: "member@farm.com",
          role: "manager",
        },
      },
    });

    const { updateMemberRole } = await import("./teamService");
    const result = await updateMemberRole({
      memberId: 42,
      role: "manager",
    });

    expect(apiPut).toHaveBeenCalledWith("/tenant/members/42/role", {
      role: "MANAGER",
    });
    expect(result).toMatchObject({
      memberId: 42,
      role: "MANAGER",
    });
  });

  it("updates advanced permissions with normalized values", async () => {
    apiPut.mockResolvedValue({
      data: {
        data: {
          memberId: 42,
          email: "member@farm.com",
          role: "admin",
          customRoleName: "Ops Lead",
          permissions: ["users_manage", "audit_view"],
        },
      },
    });

    const { updateMemberPermissions } = await import("./teamService");
    const result = await updateMemberPermissions({
      memberId: 42,
      customRoleName: "Ops Lead",
      permissions: ["users_manage", "audit_view"],
    });

    expect(apiPut).toHaveBeenCalledWith("/tenant/members/42/permissions", {
      customRoleName: "Ops Lead",
      permissions: ["USERS_MANAGE", "AUDIT_VIEW"],
    });
    expect(result).toMatchObject({
      memberId: 42,
      customRoleName: "Ops Lead",
      permissions: ["USERS_MANAGE", "AUDIT_VIEW"],
    });
  });

  it("updates member active status", async () => {
    apiPatch.mockResolvedValue({
      data: {
        data: {
          memberId: 42,
          email: "member@farm.com",
          role: "staff",
          active: false,
        },
      },
    });

    const { updateMemberActive } = await import("./teamService");
    const result = await updateMemberActive({
      memberId: 42,
      active: false,
    });

    expect(apiPatch).toHaveBeenCalledWith("/tenant/members/42/active", {
      active: false,
    });
    expect(result).toMatchObject({
      memberId: 42,
      active: false,
    });
  });

  it("removes members from the workspace", async () => {
    apiDelete.mockResolvedValue({ data: { success: true } });

    const { removeMember } = await import("./teamService");
    await removeMember({ memberId: 42 });

    expect(apiDelete).toHaveBeenCalledWith("/tenant/members/42");
  });

  it("revokes pending invitations", async () => {
    apiDelete.mockResolvedValue({ data: { success: true } });

    const { revokeInvitation } = await import("./teamService");
    await revokeInvitation({ invitationId: 13 });

    expect(apiDelete).toHaveBeenCalledWith("/tenant/invitations/13");
  });
});

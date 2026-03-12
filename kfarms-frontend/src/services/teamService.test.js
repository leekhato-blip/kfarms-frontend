import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.fn();

vi.mock("../api/apiClient", () => ({
  default: {
    get: apiGet,
  },
}));

describe("teamService audit logs", () => {
  beforeEach(() => {
    apiGet.mockReset();
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
});

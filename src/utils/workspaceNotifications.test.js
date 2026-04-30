import { beforeEach, describe, expect, it } from "vitest";
import {
  emitWorkspaceNotificationsRead,
  formatWorkspaceAnnouncementTitle,
  getWorkspaceNotificationSnapshot,
  getWorkspaceNotificationTitle,
  isWorkspaceAnnouncement,
  publishWorkspaceNotifications,
} from "./workspaceNotifications";

describe("workspaceNotifications", () => {
  beforeEach(() => {
    publishWorkspaceNotifications({ tenantId: "", notifications: [] });
  });

  it("detects and formats announcement notifications", () => {
    const notification = {
      id: 7,
      type: "SYSTEM",
      title: "Announcement: Poultry week promo",
    };

    expect(isWorkspaceAnnouncement(notification)).toBe(true);
    expect(getWorkspaceNotificationTitle(notification)).toBe("Poultry week promo");
    expect(formatWorkspaceAnnouncementTitle("Platform update")).toBe(
      "Announcement: Platform update",
    );
  });

  it("keeps a shared snapshot and removes read notifications", () => {
    publishWorkspaceNotifications({
      tenantId: "23",
      notifications: [
        { id: 11, title: "Announcement: Promo", type: "SYSTEM" },
        { id: 12, title: "Stock alert", type: "INVENTORY" },
      ],
    });

    emitWorkspaceNotificationsRead([11]);

    expect(getWorkspaceNotificationSnapshot()).toEqual({
      tenantId: "23",
      notifications: [{ id: 12, title: "Stock alert", type: "INVENTORY" }],
    });
  });
});

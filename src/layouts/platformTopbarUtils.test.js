import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildPlatformNotifications,
  buildPlatformSearchResults,
  filterUnreadPlatformNotifications,
  markPlatformNotificationsRead,
  PLATFORM_NOTIFICATION_READ_KEY,
  readPlatformNotificationReadIds,
  writePlatformNotificationReadIds,
} from "./platformTopbarUtils";

describe("platformTopbarUtils", () => {
  beforeEach(() => {
    const storage = {};
    const localStorage = {
      getItem: (key) => (Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null),
      setItem: (key, value) => {
        storage[key] = String(value);
      },
      removeItem: (key) => {
        delete storage[key];
      },
    };

    globalThis.window = { localStorage };
  });

  beforeEach(() => {
    window.localStorage.removeItem(PLATFORM_NOTIFICATION_READ_KEY);
  });

  afterEach(() => {
    delete globalThis.window;
  });

  it("builds search results across pages, apps, tenants, and platform users", () => {
    const results = buildPlatformSearchResults({
      query: "roots",
      apps: [
        {
          id: "roots-support",
          name: "Roots Support",
          category: "Operations",
          lifecycle: "PLANNED",
          capabilities: ["Tickets"],
        },
      ],
      tenants: [
        {
          tenantId: 2,
          name: "Roots Delta Farm",
          slug: "roots-delta",
          plan: "PRO",
        },
      ],
      users: [
        {
          userId: 7,
          username: "roots.ops",
          email: "ops@roots.local",
          role: "PLATFORM_ADMIN",
        },
      ],
    });

    expect(results.map((result) => result.kind)).toEqual(
      expect.arrayContaining(["App", "Tenant", "User"]),
    );
    expect(results[0].title.toLowerCase()).toContain("roots");
    expect(results.find((result) => result.kind === "Tenant")?.target).toContain("/platform/tenants?search=");
    expect(results.find((result) => result.kind === "User")?.target).toContain("/platform/users?search=");

    const pageResults = buildPlatformSearchResults({ query: "settings" });
    expect(pageResults.some((result) => result.kind === "Page")).toBe(true);
  });

  it("builds platform notifications from pressure, access, and planned portfolio signals", () => {
    const notifications = buildPlatformNotifications({
      overview: {
        suspendedTenants: 1,
      },
      portfolio: {
        apps: [
          { id: "kfarms", name: "KFarms", lifecycle: "LIVE" },
          { id: "property", name: "Property", lifecycle: "PLANNED" },
        ],
      },
      tenants: [
        {
          tenantId: 5,
          name: "Delta Farms",
          plan: "PRO",
          memberCount: 11,
          lastActivityAt: "2026-03-14T08:00:00.000Z",
        },
      ],
      users: [
        {
          userId: 1,
          username: "roots.ops",
          email: "ops@demo.kfarms.local",
          role: "PLATFORM_ADMIN",
          enabled: true,
          createdAt: "2026-03-10T08:00:00.000Z",
        },
        {
          userId: 2,
          username: "roots.support",
          email: "support@demo.kfarms.local",
          role: "USER",
          platformAccess: true,
          enabled: false,
          createdAt: "2026-03-12T08:00:00.000Z",
        },
      ],
    });

    expect(notifications.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "tenant-suspensions",
        "tenant-seat-pressure-5",
        "platform-admin-coverage",
        "disabled-platform-users",
        "planned-app-portfolio",
      ]),
    );
    expect(notifications[0].level).toBe("critical");
  });

  it("tracks read notification ids and filters unread items", () => {
    writePlatformNotificationReadIds(["alpha"]);

    const nextIds = markPlatformNotificationsRead(readPlatformNotificationReadIds(), [
      "beta",
      "alpha",
    ]);

    expect(nextIds).toEqual(["alpha", "beta"]);

    const unread = filterUnreadPlatformNotifications(
      [
        { id: "alpha", title: "Read" },
        { id: "beta", title: "Read later" },
        { id: "gamma", title: "Unread" },
      ],
      nextIds,
    );

    expect(unread.map((item) => item.id)).toEqual(["gamma"]);
  });
});

export const WORKSPACE_NOTIFICATIONS_UPDATED_EVENT = "kf-workspace-notifications-updated";
export const WORKSPACE_NOTIFICATIONS_READ_EVENT = "kf-workspace-notifications-read";
export const WORKSPACE_ANNOUNCEMENT_TITLE_PREFIX = "Announcement:";

let workspaceNotificationSnapshot = {
  tenantId: "",
  notifications: [],
};

function toNotificationArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeTitle(value) {
  return String(value || "").trim();
}

export function publishWorkspaceNotifications({ tenantId = "", notifications = [] } = {}) {
  workspaceNotificationSnapshot = {
    tenantId: tenantId == null ? "" : String(tenantId),
    notifications: toNotificationArray(notifications),
  };

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(WORKSPACE_NOTIFICATIONS_UPDATED_EVENT, {
        detail: workspaceNotificationSnapshot,
      }),
    );
  }

  return workspaceNotificationSnapshot;
}

export function getWorkspaceNotificationSnapshot() {
  return workspaceNotificationSnapshot;
}

export function emitWorkspaceNotificationsRead(ids = []) {
  const normalizedIds = [...new Set(
    ids
      .map((value) => (value == null ? "" : String(value).trim()))
      .filter(Boolean),
  )];

  if (normalizedIds.length === 0) {
    return workspaceNotificationSnapshot;
  }

  workspaceNotificationSnapshot = {
    ...workspaceNotificationSnapshot,
    notifications: workspaceNotificationSnapshot.notifications.filter(
      (notification) => !normalizedIds.includes(String(notification?.id ?? "").trim()),
    ),
  };

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(WORKSPACE_NOTIFICATIONS_READ_EVENT, {
        detail: {
          ids: normalizedIds,
          snapshot: workspaceNotificationSnapshot,
        },
      }),
    );
  }

  return workspaceNotificationSnapshot;
}

export function isWorkspaceAnnouncement(notification) {
  const type = String(notification?.type || "").trim().toUpperCase();
  const title = normalizeTitle(notification?.title).toLowerCase();

  return type === "SYSTEM" && title.startsWith(WORKSPACE_ANNOUNCEMENT_TITLE_PREFIX.toLowerCase());
}

export function formatWorkspaceAnnouncementTitle(title) {
  const normalized = normalizeTitle(title);
  if (!normalized) {
    return WORKSPACE_ANNOUNCEMENT_TITLE_PREFIX;
  }

  if (normalized.toLowerCase().startsWith(WORKSPACE_ANNOUNCEMENT_TITLE_PREFIX.toLowerCase())) {
    return normalized;
  }

  return `${WORKSPACE_ANNOUNCEMENT_TITLE_PREFIX} ${normalized}`;
}

export function getWorkspaceNotificationTitle(notification) {
  const title = normalizeTitle(notification?.title);
  if (!title) {
    return "Workspace update";
  }

  if (!isWorkspaceAnnouncement(notification)) {
    return title;
  }

  const stripped = title.replace(/^announcement:\s*/i, "").trim();
  return stripped || "Announcement";
}

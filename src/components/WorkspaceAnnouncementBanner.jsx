import React from "react";
import { Info, X } from "lucide-react";
import api from "../api/apiClient";
import { useTenant } from "../tenant/TenantContext";
import {
  emitWorkspaceNotificationsRead,
  getWorkspaceNotificationSnapshot,
  getWorkspaceNotificationTitle,
  isWorkspaceAnnouncement,
  WORKSPACE_NOTIFICATIONS_READ_EVENT,
  WORKSPACE_NOTIFICATIONS_UPDATED_EVENT,
} from "../utils/workspaceNotifications";

function buildTenantRequestConfig(tenantId, config = {}) {
  if (!tenantId) {
    return config;
  }

  return {
    ...config,
    headers: {
      ...(config.headers || {}),
      "X-Tenant-Id": String(tenantId),
    },
  };
}

function selectAnnouncement(snapshot, activeTenantId, dismissedIds = []) {
  const snapshotTenantId = snapshot?.tenantId == null ? "" : String(snapshot.tenantId);
  const tenantId = activeTenantId == null ? "" : String(activeTenantId);

  if (snapshotTenantId && tenantId && snapshotTenantId !== tenantId) {
    return null;
  }

  const hiddenIds = new Set(dismissedIds.map((value) => String(value)));
  const notifications = Array.isArray(snapshot?.notifications) ? snapshot.notifications : [];

  return (
    notifications.find(
      (notification) =>
        isWorkspaceAnnouncement(notification) &&
        !hiddenIds.has(String(notification?.id ?? "")),
    ) || null
  );
}

export default function WorkspaceAnnouncementBanner() {
  const { activeTenantId } = useTenant();
  const [dismissedIds, setDismissedIds] = React.useState([]);
  const [announcement, setAnnouncement] = React.useState(() =>
    selectAnnouncement(getWorkspaceNotificationSnapshot(), activeTenantId, []),
  );

  React.useEffect(() => {
    setDismissedIds([]);
  }, [activeTenantId]);

  React.useEffect(() => {
    const syncAnnouncement = (snapshot = getWorkspaceNotificationSnapshot()) => {
      setAnnouncement((current) => {
        const next = selectAnnouncement(snapshot, activeTenantId, dismissedIds);
        if (current?.id === next?.id) {
          return current;
        }
        return next;
      });
    };

    syncAnnouncement();

    if (typeof window === "undefined") return undefined;

    const handleNotificationsUpdated = (event) => {
      syncAnnouncement(event?.detail);
    };

    const handleNotificationsRead = (event) => {
      syncAnnouncement(event?.detail?.snapshot);
    };

    window.addEventListener(
      WORKSPACE_NOTIFICATIONS_UPDATED_EVENT,
      handleNotificationsUpdated,
    );
    window.addEventListener(
      WORKSPACE_NOTIFICATIONS_READ_EVENT,
      handleNotificationsRead,
    );

    return () => {
      window.removeEventListener(
        WORKSPACE_NOTIFICATIONS_UPDATED_EVENT,
        handleNotificationsUpdated,
      );
      window.removeEventListener(
        WORKSPACE_NOTIFICATIONS_READ_EVENT,
        handleNotificationsRead,
      );
    };
  }, [activeTenantId, dismissedIds]);

  async function handleDismiss() {
    if (!announcement?.id) {
      setAnnouncement(null);
      return;
    }

    const announcementId = announcement.id;
    setDismissedIds((current) =>
      current.includes(announcementId) ? current : [...current, announcementId],
    );

    try {
      await api.post(
        `/notifications/${announcementId}/read`,
        null,
        buildTenantRequestConfig(activeTenantId),
      );
      emitWorkspaceNotificationsRead([announcementId]);
    } catch (error) {
      console.error("Failed to dismiss workspace announcement", error);
    }
  }

  if (!announcement) {
    return null;
  }

  const title = getWorkspaceNotificationTitle(announcement);
  const message = String(announcement.message || announcement.body || "").trim();

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-blue-200/80 bg-[linear-gradient(135deg,rgba(219,234,254,0.98),rgba(239,246,255,0.98))] shadow-[0_18px_38px_rgba(37,99,235,0.14)] dark:border-blue-400/20 dark:bg-[linear-gradient(135deg,rgba(30,64,175,0.22),rgba(15,23,42,0.88))] dark:shadow-[0_20px_42px_rgba(2,6,23,0.32)]">
      <div className="flex items-start gap-3 px-4 py-3 sm:px-5">
        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-blue-300/60 bg-blue-600 text-white dark:border-blue-300/20 dark:bg-blue-500/85">
          <Info className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-6 text-blue-950 dark:text-blue-50">
            <span className="font-semibold">{title}</span>
            {message ? ` ${message}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-blue-800 transition hover:bg-blue-950/8 dark:text-blue-100 dark:hover:bg-white/10"
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

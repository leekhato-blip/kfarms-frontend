import { normalizePlanId } from "../constants/plans";
import { getUserDisplayName } from "../services/userProfileService";
import {
  filterPlatformUsers,
  getSeatUsageSummary,
  resolvePlatformAccessTier,
  resolvePlatformUserEnabled,
} from "../pages/platform/platformInsights";

export const PLATFORM_NOTIFICATION_READ_KEY = "roots_platform_read_notifications";

const PLATFORM_SEARCH_PAGES = Object.freeze([
  {
    id: "page-hub",
    title: "Hub",
    subtitle: "Platform overview",
    target: "/platform",
    searchText: "hub dashboard home platform overview signals apps tenants users",
  },
  {
    id: "page-apps",
    title: "Apps",
    subtitle: "Live and planned apps",
    target: "/platform/apps",
    searchText: "apps portfolio planned products live apps",
  },
  {
    id: "page-tenants",
    title: "Tenants",
    subtitle: "Workspace operations",
    target: "/platform/tenants",
    searchText: "tenants workspaces plans owners team limit status",
  },
  {
    id: "page-users",
    title: "Users",
    subtitle: "Platform access",
    target: "/platform/users",
    searchText: "users admins operators staff access platform owner",
  },
  {
    id: "page-health",
    title: "Health",
    subtitle: "Signals and posture",
    target: "/platform/health",
    searchText: "health alerts signals risks posture",
  },
  {
    id: "page-settings",
    title: "Settings",
    subtitle: "Platform settings",
    target: "/platform/settings",
    searchText: "settings profile preferences defaults config platform",
  },
]);

function normalizedText(value) {
  return String(value || "").trim().toLowerCase();
}

function scoreMatch(title = "", subtitle = "", extra = "", query = "") {
  const normalizedQuery = normalizedText(query);
  const normalizedTitle = normalizedText(title);
  const normalizedSubtitle = normalizedText(subtitle);
  const normalizedExtra = normalizedText(extra);

  if (!normalizedQuery) return 0;
  if (normalizedTitle === normalizedQuery) return 160;
  if (normalizedTitle.startsWith(normalizedQuery)) return 130;
  if (normalizedTitle.includes(normalizedQuery)) return 100;
  if (normalizedSubtitle.includes(normalizedQuery)) return 70;
  if (normalizedExtra.includes(normalizedQuery)) return 45;
  return 0;
}

function sortByScore(results = []) {
  return [...results].sort((left, right) => {
    const scoreDiff = Number(right?.score || 0) - Number(left?.score || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return String(left?.title || "").localeCompare(String(right?.title || ""), undefined, {
      sensitivity: "base",
    });
  });
}

function toEpoch(value) {
  const epoch = value ? new Date(value).getTime() : 0;
  return Number.isFinite(epoch) ? epoch : 0;
}

function severityRank(level) {
  if (level === "critical") return 0;
  if (level === "warning") return 1;
  return 2;
}

function buildSearchTarget(pathname, searchValue) {
  const normalizedValue = String(searchValue || "").trim();
  if (!normalizedValue) return pathname;
  const params = new URLSearchParams({ search: normalizedValue });
  return `${pathname}?${params.toString()}`;
}

export function buildPlatformSearchResults({
  query,
  apps = [],
  tenants = [],
  users = [],
  limit = 10,
} = {}) {
  const normalizedQuery = normalizedText(query);
  if (normalizedQuery.length < 2) return [];

  const pageResults = PLATFORM_SEARCH_PAGES.map((page) => ({
    ...page,
    kind: "Page",
    score: scoreMatch(page.title, page.subtitle, page.searchText, normalizedQuery),
  })).filter((result) => result.score > 0);

  const appResults = apps
    .map((app) => {
      const extra = [
        app?.category,
        app?.headline,
        app?.description,
        ...(Array.isArray(app?.capabilities) ? app.capabilities : []),
      ].join(" ");
      return {
        id: `app-${app?.id || app?.name}`,
        title: app?.name || "App",
        subtitle: `${app?.lifecycle || "PLANNED"} app`,
        target: buildSearchTarget("/platform/apps", app?.name || app?.id),
        kind: "App",
        score: scoreMatch(app?.name, app?.category, extra, normalizedQuery),
      };
    })
    .filter((result) => result.score > 0);

  const tenantResults = tenants
    .map((tenant) => {
      const extra = [tenant?.slug, tenant?.ownerEmail, tenant?.plan, tenant?.status].join(" ");
      return {
        id: `tenant-${tenant?.tenantId ?? tenant?.id ?? tenant?.slug ?? tenant?.name}`,
        title: tenant?.name || tenant?.slug || "Tenant",
        subtitle: `${normalizePlanId(tenant?.plan, "FREE")} tenant`,
        target: buildSearchTarget("/platform/tenants", tenant?.name || tenant?.slug),
        kind: "Tenant",
        score: scoreMatch(tenant?.name, tenant?.slug, extra, normalizedQuery),
      };
    })
    .filter((result) => result.score > 0);

  const userResults = filterPlatformUsers(users)
    .map((user) => {
      const tier = resolvePlatformAccessTier(user);
      const extra = [user?.email, tier].join(" ");
      const label = getUserDisplayName(user, "Platform user");
      return {
        id: `user-${user?.userId ?? user?.id ?? user?.email ?? user?.username}`,
        title: label,
        subtitle:
          tier === "PLATFORM_OWNER"
            ? "ROOTS prime"
            : tier === "PLATFORM_ADMIN"
              ? "ROOTS admin"
              : "ROOTS ops",
        target: buildSearchTarget("/platform/users", label),
        kind: "User",
        score: scoreMatch(label, user?.email, extra, normalizedQuery),
      };
    })
    .filter((result) => result.score > 0);

  return sortByScore([...pageResults, ...appResults, ...tenantResults, ...userResults]).slice(0, limit);
}

function buildNotification({
  id,
  level = "info",
  category = "Platform",
  title,
  message,
  target = "/platform",
  createdAt,
}) {
  return {
    id,
    level,
    category,
    title,
    message,
    target,
    createdAt,
  };
}

export function buildPlatformNotifications({
  overview = {},
  portfolio = {},
  tenants = [],
  users = [],
} = {}) {
  const notifications = [];
  const platformUsers = filterPlatformUsers(users);
  const enabledUsers = platformUsers.filter((user) => resolvePlatformUserEnabled(user));
  const disabledUsers = platformUsers.filter((user) => !resolvePlatformUserEnabled(user));
  const platformAdmins = platformUsers.filter((user) => {
    const tier = resolvePlatformAccessTier(user);
    return tier === "PLATFORM_OWNER" || tier === "PLATFORM_ADMIN";
  });

  const suspendedTenants = Number(overview?.suspendedTenants ?? 0);
  if (suspendedTenants > 0) {
    notifications.push(
      buildNotification({
        id: "tenant-suspensions",
        level: "critical",
        category: "Tenants",
        title:
          suspendedTenants === 1
            ? "1 workspace is suspended"
            : `${suspendedTenants} workspaces are suspended`,
        message: "Review workspace status and plan pressure in the tenants page.",
        target: "/platform/tenants",
      }),
    );
  }

  const pressuredTenants = tenants
    .map((tenant) => ({ tenant, seatUsage: getSeatUsageSummary(tenant) }))
    .filter(({ seatUsage }) => seatUsage.overLimit || seatUsage.nearLimit)
    .slice(0, 2);

  pressuredTenants.forEach(({ tenant, seatUsage }) => {
    notifications.push(
      buildNotification({
        id: `tenant-seat-pressure-${tenant?.tenantId ?? tenant?.id ?? tenant?.slug ?? tenant?.name}`,
        level: seatUsage.overLimit ? "critical" : "warning",
        category: "Team Limit",
        title: seatUsage.overLimit
          ? `${tenant?.name || "Tenant"} is over its team limit`
          : `${tenant?.name || "Tenant"} is nearing its team limit`,
        message: `Current team usage is ${seatUsage.label}.`,
        target: "/platform/tenants",
        createdAt: tenant?.lastActivityAt || tenant?.updatedAt || tenant?.createdAt,
      }),
    );
  });

  if (platformAdmins.length <= 1) {
    notifications.push(
      buildNotification({
        id: "platform-admin-coverage",
        level: "critical",
        category: "Access",
        title: "ROOTS admin coverage is too thin",
        message: "Keep at least two enabled ROOTS admins available before making more access changes.",
        target: "/platform/users",
      }),
    );
  }

  if (disabledUsers.length > 0) {
    notifications.push(
      buildNotification({
        id: "disabled-platform-users",
        level: "warning",
        category: "Access",
        title:
          disabledUsers.length === 1
            ? "1 platform account is disabled"
            : `${disabledUsers.length} platform accounts are disabled`,
        message: "Review account readiness in the platform users page.",
        target: "/platform/users",
      }),
    );
  }

  const plannedApps = Array.isArray(portfolio?.apps)
    ? portfolio.apps.filter((app) => String(app?.lifecycle || "").toUpperCase() !== "LIVE")
    : [];

  if (plannedApps.length > 0) {
    const names = plannedApps
      .slice(0, 2)
      .map((app) => app?.name)
      .filter(Boolean)
      .join(", ");

    notifications.push(
      buildNotification({
        id: "planned-app-portfolio",
        level: "info",
        category: "Portfolio",
        title:
          plannedApps.length === 1
            ? "1 planned app is ready"
            : `${plannedApps.length} planned apps are ready`,
        message: names ? `Ready in ROOTS: ${names}.` : "Review planned apps in ROOTS.",
        target: "/platform/apps",
      }),
    );
  }

  const latestUser = [...enabledUsers].sort((left, right) => toEpoch(right?.createdAt) - toEpoch(left?.createdAt))[0];
  if (latestUser?.createdAt) {
    notifications.push(
      buildNotification({
        id: `latest-platform-user-${latestUser?.id ?? latestUser?.email ?? latestUser?.username}`,
        level: "info",
        category: "Users",
        title: `${latestUser?.username || "Platform user"} is ready`,
        message: "A ROOTS access account is available for the current admin roster.",
        target: "/platform/users",
        createdAt: latestUser.createdAt,
      }),
    );
  }

  return [...notifications].sort((left, right) => {
    const severityDiff = severityRank(left.level) - severityRank(right.level);
    if (severityDiff !== 0) return severityDiff;
    return toEpoch(right.createdAt) - toEpoch(left.createdAt);
  });
}

export function formatPlatformNotificationAge(createdAt) {
  const stamp = toEpoch(createdAt);
  if (!stamp) return "Just now";

  const diffMs = Date.now() - stamp;
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(stamp));
}

export function readPlatformNotificationReadIds() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(PLATFORM_NOTIFICATION_READ_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function writePlatformNotificationReadIds(ids = []) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    PLATFORM_NOTIFICATION_READ_KEY,
    JSON.stringify(Array.from(new Set(ids.map(String)))),
  );
}

export function filterUnreadPlatformNotifications(notifications = [], readIds = []) {
  const hidden = new Set(readIds.map(String));
  return notifications.filter((notification) => !hidden.has(String(notification?.id)));
}

export function markPlatformNotificationsRead(readIds = [], idsToMark = []) {
  return Array.from(new Set([...readIds.map(String), ...idsToMark.map(String)]));
}

import {
  KFARMS_BASE_PATH,
  KFARMS_ROUTE_LIST,
  KFARMS_ROUTE_REGISTRY,
} from "../apps/kfarms/paths";

function normalizePathname(pathname = "") {
  const normalized = String(pathname || "")
    .split("?")[0]
    .split("#")[0]
    .replace(/\/+$/, "");
  return normalized || "/";
}

function findWorkspaceRoute(pathname = "") {
  const normalized = normalizePathname(pathname);
  if (normalized === KFARMS_BASE_PATH) {
    return KFARMS_ROUTE_REGISTRY.dashboard;
  }
  return (
    KFARMS_ROUTE_LIST.find(
      (route) =>
        normalizePathname(route.appPath) === normalized ||
        normalizePathname(route.legacyPath) === normalized,
    ) || null
  );
}

const WORKSPACE_GREETING_HIDDEN_PATHS = new Set([
  normalizePathname(KFARMS_ROUTE_REGISTRY.billing.appPath),
  normalizePathname(KFARMS_ROUTE_REGISTRY.settings.appPath),
  normalizePathname(KFARMS_ROUTE_REGISTRY.support.appPath),
]);

const WORKSPACE_SUBTITLE_BUILDERS = Object.freeze({
  [normalizePathname(KFARMS_ROUTE_REGISTRY.dashboard.appPath)]: ({ workspaceName }) =>
    `See what needs attention in ${workspaceName} today.`,
  [normalizePathname(KFARMS_ROUTE_REGISTRY.sales.appPath)]: ({ workspaceName }) =>
    `Track sales and payments for ${workspaceName}.`,
  [normalizePathname(KFARMS_ROUTE_REGISTRY.supplies.appPath)]: ({ workspaceName }) =>
    `Manage supplies and restocking for ${workspaceName}.`,
  [normalizePathname(KFARMS_ROUTE_REGISTRY.inventory.appPath)]: ({ workspaceName }) =>
    `Keep stock levels up to date for ${workspaceName}.`,
  [normalizePathname(KFARMS_ROUTE_REGISTRY.fishPonds.appPath)]: ({ workspaceName }) =>
    `Check ponds and stock in ${workspaceName}.`,
  [normalizePathname(KFARMS_ROUTE_REGISTRY.poultry.appPath)]: ({ workspaceName }) =>
    `Review flock activity in ${workspaceName}.`,
  [normalizePathname(KFARMS_ROUTE_REGISTRY.feeds.appPath)]: ({ workspaceName }) =>
    `Track feed use and stock for ${workspaceName}.`,
  [normalizePathname(KFARMS_ROUTE_REGISTRY.productions.appPath)]: ({ workspaceName }) =>
    `Review production for ${workspaceName}.`,
  [normalizePathname(KFARMS_ROUTE_REGISTRY.search.appPath)]: () =>
    "Find pages, records, and recent activity.",
  [normalizePathname(KFARMS_ROUTE_REGISTRY.users.appPath)]: ({ workspaceName }) =>
    `Manage team access for ${workspaceName}.`,
});

const DOCUMENT_TITLE_MAP = Object.freeze({
  "/": "KFarms Product Profile",
  "/product-profile": "KFarms Product Profile",
  "/company-profile": "ROOTS Company Profile",
  "/auth/login": "Login | KFarms",
  "/auth/signup": "Sign Up | KFarms",
  "/auth/verify-contact": "Verify Contact | KFarms",
  "/auth/forgot-password": "Forgot Password | KFarms",
  "/auth/reset-password": "Reset Password | KFarms",
  "/workspace": "Workspace | KFarms",
  "/onboarding/create-tenant": "Create Farm | KFarms",
  "/onboarding/accept-invite": "Accept Invite | KFarms",
  "/accept-invite": "Accept Invite | KFarms",
  "/platform": "Hub | ROOTS Platform",
  "/platform/apps": "Apps | ROOTS Platform",
  "/platform/messages": "Messages | ROOTS Platform",
  "/platform/tenants": "Tenants | ROOTS Platform",
  "/platform/users": "Users | ROOTS Platform",
  "/platform/health": "Health | ROOTS Platform",
  "/platform/settings": "Settings | ROOTS Platform",
  "/platform/login": "Platform Login | ROOTS Platform",
  "/platform/setup": "Platform Setup | ROOTS Platform",
});

export function resolveWorkspaceTopbarMeta(pathname, { workspaceName = "your farm" } = {}) {
  const route = findWorkspaceRoute(pathname);
  const normalizedPath = normalizePathname(route?.appPath || pathname);
  const subtitleBuilder = WORKSPACE_SUBTITLE_BUILDERS[normalizedPath];

  return {
    hideGreeting: WORKSPACE_GREETING_HIDDEN_PATHS.has(normalizedPath),
    subtitle:
      subtitleBuilder?.({ workspaceName, route }) ||
      `Keep ${workspaceName} moving smoothly.`,
  };
}

export function resolveDocumentTitle(pathname = "") {
  const normalized = normalizePathname(pathname);

  if (DOCUMENT_TITLE_MAP[normalized]) {
    return DOCUMENT_TITLE_MAP[normalized];
  }

  const workspaceRoute = findWorkspaceRoute(normalized);
  if (workspaceRoute) {
    return `${workspaceRoute.label} | KFarms`;
  }

  if (normalized.startsWith("/platform")) {
    return "ROOTS Platform";
  }

  return "KFarms";
}

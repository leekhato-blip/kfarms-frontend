import { normalizeAppPortfolio, normalizeAppSummary } from "./appHub";
import { toKfarmsAppPath } from "../../apps/kfarms/paths";

export const PLATFORM_DATA_MODE_STORAGE_KEY = "kf-platform-data-mode";
export const PLATFORM_CUSTOM_APPS_STORAGE_KEY = "kf-platform-custom-apps";

const APP_LIBRARY_BLUEPRINTS = Object.freeze([
  {
    id: "kfarms",
    name: "KFarms",
    category: "Agribusiness Operations",
    lifecycle: "LIVE",
    headline: "Farm operating system for poultry, fish, and mixed agribusiness teams.",
    description: "Farm operations for poultry, fish, and mixed agribusiness teams.",
    consolePath: toKfarmsAppPath("/dashboard"),
    workspacePath: toKfarmsAppPath("/dashboard"),
    sortOrder: 10,
    capabilities: ["Tenant workspaces", "Poultry and fish modules", "Billing and operator controls"],
    source: "catalog",
  },
  {
    id: "property-rent-management",
    name: "Property / Rent Management",
    category: "Property Operations",
    lifecycle: "PLANNED",
    headline: "Rental operations, occupancy, and landlord workflows for managed properties.",
    description: "Rental operations, occupancy, and landlord workflows for managed properties.",
    consolePath: "/platform/apps",
    workspacePath: "",
    sortOrder: 20,
    capabilities: ["Unit inventory", "Rent and lease tracking", "Maintenance workflows"],
    source: "catalog",
  },
  {
    id: "school-management-system",
    name: "School Management System",
    category: "Education Operations",
    lifecycle: "PLANNED",
    headline: "School operations for academics, administration, and parent-facing coordination.",
    description: "School operations for academics, administration, and parent-facing coordination.",
    consolePath: "/platform/apps",
    workspacePath: "",
    sortOrder: 30,
    capabilities: ["Admissions and records", "Attendance and grading", "School finance operations"],
    source: "catalog",
  },
  {
    id: "clinic-hospital-management",
    name: "Clinic / Hospital Management",
    category: "Healthcare Operations",
    lifecycle: "PLANNED",
    headline: "Clinical operations, patient journeys, and facility workflows for care teams.",
    description: "Clinical operations, patient journeys, and facility workflows for care teams.",
    consolePath: "/platform/apps",
    workspacePath: "",
    sortOrder: 40,
    capabilities: ["Patient records", "Appointments and admissions", "Billing and care operations"],
    source: "catalog",
  },
]);

const DEMO_APP_METRICS = Object.freeze({
  kfarms: {
    tenantCount: 5,
    activeTenantCount: 5,
    suspendedTenantCount: 0,
    operatorCount: 38,
    revenueGenerated: 54900000,
  },
  "property-rent-management": {
    tenantCount: 0,
    activeTenantCount: 0,
    suspendedTenantCount: 0,
    operatorCount: 0,
    revenueGenerated: 0,
  },
  "school-management-system": {
    tenantCount: 0,
    activeTenantCount: 0,
    suspendedTenantCount: 0,
    operatorCount: 0,
    revenueGenerated: 0,
  },
  "clinic-hospital-management": {
    tenantCount: 0,
    activeTenantCount: 0,
    suspendedTenantCount: 0,
    operatorCount: 0,
    revenueGenerated: 0,
  },
});

const DEMO_TENANT_BLUEPRINTS = Object.freeze([
  {
    id: 301,
    name: "Isah Farms",
    slug: "isah-farms",
    appName: "KFarms",
    plan: "PRO",
    status: "ACTIVE",
    ownerEmail: "ops@isahfarms.africa",
    memberCount: 9,
    lastActivityHoursAgo: 2,
  },
  {
    id: 302,
    name: "Delta Integrated Farms",
    slug: "delta-integrated-farms",
    appName: "KFarms",
    plan: "PRO",
    status: "ACTIVE",
    ownerEmail: "owner@delta-integrated.africa",
    memberCount: 8,
    lastActivityHoursAgo: 5,
  },
  {
    id: 303,
    name: "Riverbank Poultry",
    slug: "riverbank-poultry",
    appName: "KFarms",
    plan: "ENTERPRISE",
    status: "ACTIVE",
    ownerEmail: "team@riverbankpoultry.africa",
    memberCount: 24,
    lastActivityHoursAgo: 8,
  },
  {
    id: 304,
    name: "Blue Basin Fish",
    slug: "blue-basin-fish",
    appName: "KFarms",
    plan: "PRO",
    status: "ACTIVE",
    ownerEmail: "hello@bluebasinfish.com",
    memberCount: 7,
    lastActivityHoursAgo: 31,
  },
  {
    id: 305,
    name: "Green Basket Foods",
    slug: "green-basket-foods",
    appName: "KFarms",
    plan: "PRO",
    status: "ACTIVE",
    ownerEmail: "team@greenbasket.io",
    memberCount: 9,
    lastActivityHoursAgo: 1,
  },
]);

const DEMO_USER_BLUEPRINTS = Object.freeze([
  {
    id: 801,
    username: "kato",
    email: "leekhato@gmail.com",
    role: "PLATFORM_ADMIN",
    platformOwner: true,
    enabled: true,
    createdHoursAgo: 2600,
  },
  {
    id: 802,
    username: "roots.ops",
    email: "platform.ops@demo.kfarms.local",
    role: "PLATFORM_ADMIN",
    enabled: true,
    createdHoursAgo: 2200,
  },
  {
    id: 803,
    username: "roots.analyst",
    email: "analyst@demo.kfarms.local",
    role: "USER",
    enabled: true,
    createdHoursAgo: 1800,
  },
  {
    id: 804,
    username: "roots.support",
    email: "support@demo.kfarms.local",
    role: "USER",
    enabled: true,
    createdHoursAgo: 1400,
  },
  {
    id: 805,
    username: "roots.billing",
    email: "billing@demo.kfarms.local",
    role: "USER",
    enabled: true,
    createdHoursAgo: 1200,
  },
  {
    id: 806,
    username: "roots.success",
    email: "success@demo.kfarms.local",
    role: "USER",
    enabled: true,
    createdHoursAgo: 1100,
  },
  {
    id: 807,
    username: "roots.compliance",
    email: "compliance@demo.kfarms.local",
    enabled: true,
    role: "USER",
    createdHoursAgo: 860,
  },
  {
    id: 808,
    username: "roots.finance",
    email: "finance@demo.kfarms.local",
    role: "USER",
    enabled: true,
    createdHoursAgo: 720,
  },
  {
    id: 809,
    username: "roots.onboarding",
    email: "onboarding@demo.kfarms.local",
    role: "USER",
    enabled: true,
    createdHoursAgo: 540,
  },
  {
    id: 810,
    username: "roots.growth",
    email: "growth@demo.kfarms.local",
    role: "USER",
    enabled: true,
    createdHoursAgo: 400,
  },
  {
    id: 811,
    username: "roots.logistics",
    email: "logistics@demo.kfarms.local",
    role: "USER",
    enabled: true,
    createdHoursAgo: 260,
  },
]);

const PLATFORM_DEMO_SUMMARY = Object.freeze({
  totalTenants: 5,
  activeTenants: 5,
  suspendedTenants: 0,
  totalUsers: 11,
  platformAdmins: 2,
});

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getAppKey(app = {}) {
  return slugify(app.id || app.name || app.workspacePath || app.consolePath);
}

function getAppAliases(app = {}) {
  return Array.from(
    new Set(
      [
        getAppKey(app),
        slugify(app.id),
        slugify(app.name),
        slugify(app.workspacePath),
        slugify(app.consolePath),
      ].filter(Boolean),
    ),
  );
}

function buildCatalogAliasMap(apps = []) {
  const aliasMap = new Map();

  apps.forEach((app) => {
    getAppAliases(app).forEach((alias) => {
      if (!aliasMap.has(alias)) {
        aliasMap.set(alias, app);
      }
    });
  });

  return aliasMap;
}

function findCatalogAppMatch(app, aliasMap) {
  for (const alias of getAppAliases(app)) {
    const matched = aliasMap.get(alias);
    if (matched) {
      return matched;
    }
  }

  return null;
}

function lifecycleRank(lifecycle) {
  const normalized = String(lifecycle || "").trim().toUpperCase();
  if (normalized === "LIVE") return 0;
  if (normalized === "PILOT") return 1;
  return 2;
}

function sortApps(apps = []) {
  return [...apps].sort((left, right) => {
    const lifecycleDiff = lifecycleRank(left.lifecycle) - lifecycleRank(right.lifecycle);
    if (lifecycleDiff !== 0) return lifecycleDiff;
    const orderDiff = Number(left.sortOrder || 1000) - Number(right.sortOrder || 1000);
    if (orderDiff !== 0) return orderDiff;
    return String(left.name || "").localeCompare(String(right.name || ""), undefined, {
      sensitivity: "base",
    });
  });
}

function buildPortfolioTotals(apps = []) {
  return {
    totalApps: apps.length,
    liveApps: apps.filter((app) => app.lifecycle === "LIVE").length,
    plannedApps: apps.filter((app) => app.lifecycle !== "LIVE").length,
    totalWorkspaces: apps.reduce((sum, app) => sum + Number(app.tenantCount || 0), 0),
    totalOperators: apps.reduce((sum, app) => sum + Number(app.operatorCount || 0), 0),
  };
}

function normalizeCustomApps(payload = []) {
  if (!Array.isArray(payload)) return [];
  return payload.map((app) => normalizeAppSummary({ ...app, source: app?.source || "custom" }));
}

export function readPlatformDataMode() {
  if (!canUseStorage()) return "live";
  const stored = String(window.localStorage.getItem(PLATFORM_DATA_MODE_STORAGE_KEY) || "").trim().toLowerCase();
  return stored === "demo" ? "demo" : "live";
}

export function writePlatformDataMode(mode) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    PLATFORM_DATA_MODE_STORAGE_KEY,
    mode === "demo" ? "demo" : "live",
  );
}

export function readStoredPlatformApps() {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(PLATFORM_CUSTOM_APPS_STORAGE_KEY);
    if (!raw) return [];
    return normalizeCustomApps(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function writeStoredPlatformApps(apps = []) {
  if (!canUseStorage()) return;
  const normalized = normalizeCustomApps(apps);
  window.localStorage.setItem(PLATFORM_CUSTOM_APPS_STORAGE_KEY, JSON.stringify(normalized));
}

export function createStoredPlatformApp(appDraft = {}, existingApps = []) {
  const normalizedName = String(appDraft?.name || "").trim();
  if (!normalizedName) {
    throw new Error("App name is required.");
  }

  const normalizedCategory = String(appDraft?.category || "").trim() || "Suite App";
  const slug = slugify(normalizedName) || `app-${Date.now()}`;
  const keys = new Set(normalizeCustomApps(existingApps).map((item) => getAppKey(item)));
  let nextId = `custom-${slug}`;
  let suffix = 1;

  while (keys.has(slugify(nextId))) {
    suffix += 1;
    nextId = `custom-${slug}-${suffix}`;
  }

  const capabilities = Array.isArray(appDraft?.capabilities)
    ? appDraft.capabilities
    : String(appDraft?.capabilities || "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

  return normalizeAppSummary({
    id: nextId,
    name: normalizedName,
    category: normalizedCategory,
    lifecycle: String(appDraft?.lifecycle || "PLANNED").trim().toUpperCase() || "PLANNED",
    headline: String(appDraft?.headline || "").trim(),
    description: String(appDraft?.description || "").trim(),
    consolePath: String(appDraft?.consolePath || "").trim(),
    workspacePath: String(appDraft?.workspacePath || "").trim(),
    capabilities,
    source: "custom",
  });
}

export function getPlatformCatalogApps(customApps = []) {
  const merged = new Map();

  [...APP_LIBRARY_BLUEPRINTS, ...normalizeCustomApps(customApps)].forEach((app) => {
    const normalized = normalizeAppSummary(app);
    merged.set(getAppKey(normalized), normalized);
  });

  return sortApps(Array.from(merged.values()));
}

export function buildPlatformCatalogPortfolio(customApps = []) {
  const apps = getPlatformCatalogApps(customApps);

  return normalizeAppPortfolio({
    ...buildPortfolioTotals(apps),
    apps,
  });
}

export function mergeLivePlatformPortfolio(payload = {}, customApps = []) {
  const livePortfolio = normalizeAppPortfolio(payload);
  const catalogApps = getPlatformCatalogApps(customApps);
  const catalogAliasMap = buildCatalogAliasMap(catalogApps);
  const liveByCatalogKey = new Map();
  const matchedLiveKeys = new Set();

  livePortfolio.apps.forEach((liveApp) => {
    const matchedCatalogApp = findCatalogAppMatch(liveApp, catalogAliasMap);
    if (!matchedCatalogApp) {
      return;
    }

    liveByCatalogKey.set(getAppKey(matchedCatalogApp), liveApp);
    matchedLiveKeys.add(getAppKey(liveApp));
  });

  const mergedCatalogApps = catalogApps.map((catalogApp) => {
    const key = getAppKey(catalogApp);
    const liveApp = liveByCatalogKey.get(key);

    if (!liveApp) {
      return catalogApp;
    }

    return normalizeAppSummary({
      ...catalogApp,
      ...liveApp,
      lifecycle: liveApp.lifecycle || catalogApp.lifecycle,
      category: liveApp.category || catalogApp.category,
      headline: liveApp.headline || catalogApp.headline,
      description: liveApp.description || catalogApp.description,
      consolePath: liveApp.consolePath || catalogApp.consolePath,
      workspacePath: liveApp.workspacePath || catalogApp.workspacePath,
      sortOrder: catalogApp.sortOrder,
      capabilities: Array.isArray(liveApp.capabilities) && liveApp.capabilities.length > 0
        ? liveApp.capabilities
        : catalogApp.capabilities,
      source: liveApp.source || "live",
    });
  });

  const uncataloguedLiveApps = livePortfolio.apps
    .filter((app) => !matchedLiveKeys.has(getAppKey(app)))
    .map((app) => normalizeAppSummary(app));
  const apps = sortApps([...mergedCatalogApps, ...uncataloguedLiveApps]);

  return normalizeAppPortfolio({
    ...livePortfolio,
    ...buildPortfolioTotals(apps),
    apps,
  });
}

function applyDemoMetrics(app) {
  const metrics = DEMO_APP_METRICS[app.id] || DEMO_APP_METRICS[slugify(app.id)] || null;

  if (metrics) {
    return normalizeAppSummary({
      ...app,
      ...metrics,
      source: app.source === "custom" ? "custom" : "demo",
    });
  }

  const lifecycle = String(app.lifecycle || "PLANNED").toUpperCase();
  if (lifecycle === "LIVE") {
    return normalizeAppSummary({
      ...app,
      tenantCount: 8,
      activeTenantCount: 7,
      suspendedTenantCount: 0,
      operatorCount: 24,
      revenueGenerated: 420000,
      source: app.source === "custom" ? "custom" : "demo",
    });
  }

  if (lifecycle === "PILOT") {
    return normalizeAppSummary({
      ...app,
      tenantCount: 4,
      activeTenantCount: 4,
      suspendedTenantCount: 0,
      operatorCount: 12,
      revenueGenerated: 0,
      source: app.source === "custom" ? "custom" : "demo",
    });
  }

  return normalizeAppSummary({
    ...app,
    source: app.source === "custom" ? "custom" : "demo",
  });
}

function hoursAgoIso(hours) {
  return new Date(Date.now() - Number(hours || 0) * 3_600_000).toISOString();
}

function buildDemoTenants() {
  return DEMO_TENANT_BLUEPRINTS.map((tenant) => ({
    tenantId: tenant.id,
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    appName: tenant.appName,
    plan: tenant.plan,
    status: tenant.status,
    ownerEmail: tenant.ownerEmail,
    memberCount: tenant.memberCount,
    lastActivityAt: hoursAgoIso(tenant.lastActivityHoursAgo),
    createdAt: hoursAgoIso(tenant.lastActivityHoursAgo + 96),
  }));
}

function buildDemoUsers() {
  return DEMO_USER_BLUEPRINTS.map((user) => ({
    userId: user.id,
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    platformAccess: true,
    enabled: user.enabled,
    createdAt: hoursAgoIso(user.createdHoursAgo),
    tenantCount: user.role === "PLATFORM_ADMIN" ? 5 : 2,
  }));
}

export function buildPlatformDemoSnapshot(customApps = []) {
  const apps = getPlatformCatalogApps(customApps).map(applyDemoMetrics);
  const portfolio = normalizeAppPortfolio({
    ...buildPortfolioTotals(apps),
    apps,
  });
  const tenants = buildDemoTenants();
  const users = buildDemoUsers();

  return {
    portfolio,
    tenants,
    users,
    metrics: {
      totalApps: portfolio.totalApps,
      liveApps: portfolio.liveApps,
      plannedApps: portfolio.plannedApps,
      totalTenants: PLATFORM_DEMO_SUMMARY.totalTenants,
      activeTenants: PLATFORM_DEMO_SUMMARY.activeTenants,
      suspendedTenants: PLATFORM_DEMO_SUMMARY.suspendedTenants,
      totalUsers: PLATFORM_DEMO_SUMMARY.totalUsers,
      platformAdmins: PLATFORM_DEMO_SUMMARY.platformAdmins,
    },
  };
}

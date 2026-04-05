export const APP_PORTFOLIO_FALLBACK = Object.freeze({
  totalApps: 0,
  liveApps: 0,
  plannedApps: 0,
  totalWorkspaces: 0,
  totalOperators: 0,
  apps: [],
});

export function normalizeAppPortfolio(payload = {}) {
  const apps = Array.isArray(payload?.apps) ? payload.apps.map(normalizeAppSummary) : [];

  return {
    ...APP_PORTFOLIO_FALLBACK,
    ...(payload || {}),
    totalApps: Number.isFinite(payload?.totalApps) ? payload.totalApps : apps.length,
    liveApps: Number.isFinite(payload?.liveApps)
      ? payload.liveApps
      : apps.filter((app) => app.lifecycle === "LIVE").length,
    plannedApps: Number.isFinite(payload?.plannedApps)
      ? payload.plannedApps
      : apps.filter((app) => app.lifecycle !== "LIVE").length,
    totalWorkspaces: Number.isFinite(payload?.totalWorkspaces) ? payload.totalWorkspaces : 0,
    totalOperators: Number.isFinite(payload?.totalOperators) ? payload.totalOperators : 0,
    apps,
  };
}

export function normalizeAppSummary(app = {}) {
  const revenueGenerated = Number(app.revenueGenerated);
  const sortOrder = Number(app.sortOrder);

  return {
    id: String(app.id ?? "").trim(),
    name: String(app.name ?? "Unnamed App").trim(),
    category: String(app.category ?? "Suite App").trim(),
    lifecycle: String(app.lifecycle ?? "PLANNED").trim().toUpperCase(),
    headline: String(app.headline ?? "").trim(),
    description: String(app.description ?? "").trim(),
    consolePath: String(app.consolePath ?? "").trim(),
    workspacePath: String(app.workspacePath ?? "").trim(),
    tenantCount: Number.isFinite(app.tenantCount) ? app.tenantCount : 0,
    activeTenantCount: Number.isFinite(app.activeTenantCount) ? app.activeTenantCount : 0,
    suspendedTenantCount: Number.isFinite(app.suspendedTenantCount) ? app.suspendedTenantCount : 0,
    operatorCount: Number.isFinite(app.operatorCount) ? app.operatorCount : 0,
    revenueGenerated: Number.isFinite(revenueGenerated) ? revenueGenerated : 0,
    revenueCurrency: String(app.revenueCurrency ?? "NGN").trim().toUpperCase() || "NGN",
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 1000,
    capabilities: Array.isArray(app.capabilities)
      ? app.capabilities.map((capability) => String(capability).trim()).filter(Boolean)
      : [],
    source: String(app.source ?? "catalog").trim().toLowerCase() || "catalog",
  };
}

export function getAppLifecycleTone(lifecycle) {
  const normalized = String(lifecycle ?? "").trim().toUpperCase();
  if (normalized === "LIVE") return "indigo";
  if (normalized === "PILOT") return "violet";
  return "pink";
}

export function getAppLifecycleLabel(lifecycle) {
  const normalized = String(lifecycle ?? "").trim().toUpperCase();
  if (normalized === "LIVE") return "Live";
  if (normalized === "PILOT") return "Pilot";
  return "Planned";
}

export function splitAppsByLifecycle(apps = []) {
  return {
    live: apps.filter((app) => app.lifecycle === "LIVE"),
    upcoming: apps.filter((app) => app.lifecycle !== "LIVE"),
  };
}

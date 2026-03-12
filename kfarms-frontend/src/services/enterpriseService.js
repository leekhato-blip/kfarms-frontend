import apiClient from "../api/apiClient";

const ENTERPRISE_ENDPOINTS = {
  overview: "/enterprise/overview",
  sites: "/enterprise/sites",
  site: (siteId) => `/enterprise/sites/${siteId}`,
};

function extractApiData(response) {
  return response?.data?.data ?? response?.data ?? null;
}

function extractErrorMessage(error, fallback) {
  const payload = error?.response?.data;
  if (typeof payload === "string" && payload.trim()) return payload;
  if (typeof payload?.message === "string" && payload.message.trim()) return payload.message;
  if (typeof payload?.error === "string" && payload.error.trim()) return payload.error;
  return fallback;
}

function normalizeMoney(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeEnterpriseSite(site = {}) {
  return {
    id: Number(site.id) || null,
    name: String(site.name ?? "").trim(),
    code: String(site.code ?? "").trim(),
    location: String(site.location ?? "").trim(),
    managerName: String(site.managerName ?? "").trim(),
    active: site.active !== false,
    poultryEnabled: Boolean(site.poultryEnabled),
    fishEnabled: Boolean(site.fishEnabled),
    poultryHouseCount: normalizeNumber(site.poultryHouseCount),
    pondCount: normalizeNumber(site.pondCount),
    activeBirdCount: normalizeNumber(site.activeBirdCount),
    fishStockCount: normalizeNumber(site.fishStockCount),
    currentMonthRevenue: normalizeMoney(site.currentMonthRevenue),
    currentMonthExpenses: normalizeMoney(site.currentMonthExpenses),
    currentFeedUsageKg: normalizeNumber(site.currentFeedUsageKg),
    projectedEggOutput30d: normalizeNumber(site.projectedEggOutput30d),
    projectedFishHarvestKg: normalizeNumber(site.projectedFishHarvestKg),
    currentMortalityRate: normalizeNumber(site.currentMortalityRate),
    notes: String(site.notes ?? "").trim(),
  };
}

export async function getEnterpriseOverview() {
  try {
    const response = await apiClient.get(ENTERPRISE_ENDPOINTS.overview);
    const payload = extractApiData(response) || {};
    return {
      overview: payload.overview || {},
      forecasts: payload.forecasts || {},
      sitePerformance: Array.isArray(payload.sitePerformance) ? payload.sitePerformance : [],
      modulePerformance: Array.isArray(payload.modulePerformance)
        ? payload.modulePerformance
        : [],
      teamMix: Array.isArray(payload.teamMix) ? payload.teamMix : [],
      poultryBatchHighlights: Array.isArray(payload.poultryBatchHighlights)
        ? payload.poultryBatchHighlights
        : [],
      fishPondHighlights: Array.isArray(payload.fishPondHighlights)
        ? payload.fishPondHighlights
        : [],
      alerts: Array.isArray(payload.alerts) ? payload.alerts : [],
    };
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not load enterprise overview."));
  }
}

export async function listEnterpriseSites() {
  try {
    const response = await apiClient.get(ENTERPRISE_ENDPOINTS.sites);
    const payload = extractApiData(response);
    return Array.isArray(payload) ? payload.map((item) => normalizeEnterpriseSite(item)) : [];
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not load enterprise sites."));
  }
}

export async function createEnterpriseSite(site) {
  try {
    const response = await apiClient.post(ENTERPRISE_ENDPOINTS.sites, site);
    return normalizeEnterpriseSite(extractApiData(response));
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not create the site."));
  }
}

export async function updateEnterpriseSite(siteId, site) {
  try {
    const response = await apiClient.put(ENTERPRISE_ENDPOINTS.site(siteId), site);
    return normalizeEnterpriseSite(extractApiData(response));
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not update the site."));
  }
}

export async function deleteEnterpriseSite(siteId) {
  try {
    await apiClient.delete(ENTERPRISE_ENDPOINTS.site(siteId));
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not remove the site."));
  }
}

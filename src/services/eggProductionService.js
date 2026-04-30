import api from "../api/apiClient";
import { buildOfflineMutationConfig } from "../offline/offlineStore";

const HISTORY_PAGE_SIZE = 200;
const HISTORY_PAGE_LIMIT = 50;

function getMonthKey(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}`;
}

function getMonthlyProductionYearCount(monthlyProduction = {}) {
  return new Set(
    Object.keys(monthlyProduction)
      .map((key) => Number(String(key).split("-")[0]))
      .filter((year) => Number.isFinite(year)),
  ).size;
}

function hasPositiveMonthlyProduction(monthlyProduction = {}) {
  return Object.values(monthlyProduction).some((value) => Number(value) > 0);
}

function mergeMonthlyProductionSeries(historicalMonthlyProduction = {}, monthlyProduction = {}) {
  const merged = { ...historicalMonthlyProduction };

  Object.entries(monthlyProduction).forEach(([monthKey, quantity]) => {
    const normalizedQuantity = Number(quantity);

    if (Number.isFinite(normalizedQuantity) && normalizedQuantity > 0) {
      merged[monthKey] = normalizedQuantity;
      return;
    }

    if (!(monthKey in merged)) {
      merged[monthKey] = Number.isFinite(normalizedQuantity) ? normalizedQuantity : 0;
    }
  });

  return merged;
}

export function buildMonthlyProductionFromRecords(records = []) {
  return (Array.isArray(records) ? records : []).reduce((acc, item) => {
    const monthKey = getMonthKey(item?.collectionDate);
    if (!monthKey) return acc;

    acc[monthKey] = (acc[monthKey] || 0) + (Number(item?.goodEggs) || 0);
    return acc;
  }, {});
}

export async function getHistoricalMonthlyProduction(options = {}) {
  const requestedPageSize = Number(options.pageSize);
  const requestedMaxPages = Number(options.maxPages);
  const pageSize =
    Number.isFinite(requestedPageSize) && requestedPageSize > 0
      ? Math.floor(requestedPageSize)
      : HISTORY_PAGE_SIZE;
  const maxPages =
    Number.isFinite(requestedMaxPages) && requestedMaxPages > 0
      ? Math.floor(requestedMaxPages)
      : HISTORY_PAGE_LIMIT;

  const monthlyProduction = {};

  for (let page = 0; page < maxPages; page += 1) {
    const data = await getEggRecords({ page, size: pageSize });
    const pageTotals = buildMonthlyProductionFromRecords(data?.items || []);

    Object.entries(pageTotals).forEach(([monthKey, quantity]) => {
      monthlyProduction[monthKey] = (monthlyProduction[monthKey] || 0) + quantity;
    });

    if (!data?.hasNext) {
      break;
    }
  }

  return monthlyProduction;
}

export async function enrichEggProductionSummary(summary, options = {}) {
  const normalizedSummary =
    summary && typeof summary === "object" && !Array.isArray(summary) ? summary : {};
  const monthlyProduction =
    normalizedSummary.monthlyProduction &&
    typeof normalizedSummary.monthlyProduction === "object" &&
    !Array.isArray(normalizedSummary.monthlyProduction)
      ? normalizedSummary.monthlyProduction
      : {};

  const shouldLoadHistoricalProduction =
    options.forceHistoricalMonthlyProduction ||
    getMonthlyProductionYearCount(monthlyProduction) <= 1 ||
    !hasPositiveMonthlyProduction(monthlyProduction);

  if (!shouldLoadHistoricalProduction) {
    return normalizedSummary;
  }

  try {
    const historicalMonthlyProduction = await getHistoricalMonthlyProduction(options);
    if (Object.keys(historicalMonthlyProduction).length === 0) {
      return normalizedSummary;
    }

    return {
      ...normalizedSummary,
      monthlyProduction: mergeMonthlyProductionSeries(
        historicalMonthlyProduction,
        monthlyProduction,
      ),
    };
  } catch (error) {
    console.error("Failed to rebuild egg production history", error);
    return normalizedSummary;
  }
}

export async function getEggRecords(params = {}) {
  const {
    page = 0,
    size = 10,
    livestockId,
    collectionDate,
    deleted = false,
  } = params;

  const res = await api.get("/eggs", {
    params: {
      page,
      size,
      livestockId: livestockId || undefined,
      collectionDate: collectionDate || undefined,
      deleted: deleted || undefined,
    },
  });

  return res.data.data;
}

export async function getEggSummary(options = {}) {
  const { includeHistoricalMonthlyProduction = true, ...historyOptions } = options;
  const res = await api.get("/eggs/summary");
  const summary = res.data.data;

  if (!includeHistoricalMonthlyProduction) {
    return summary;
  }

  return enrichEggProductionSummary(summary, historyOptions);
}

export async function createEggRecord(payload, options = {}) {
  const res = await api.post(
    "/eggs",
    payload,
    buildOfflineMutationConfig({
      resource: "eggs",
      action: "create",
      context: options.context,
    }),
  );
  return res.data.data;
}

export async function updateEggRecord(id, payload, options = {}) {
  const res = await api.put(
    `/eggs/${id}`,
    payload,
    buildOfflineMutationConfig({
      resource: "eggs",
      action: "update",
      baseRecord: options.baseRecord,
      context: options.context,
    }),
  );
  return res.data.data;
}

export async function deleteEggRecord(id) {
  const res = await api.delete(`/eggs/${id}`);
  return res.data.data;
}

export async function getDeletedEggRecords(params = {}) {
  return getEggRecords({
    ...params,
    deleted: true,
  });
}

export async function restoreEggRecord(id) {
  const res = await api.put(`/eggs/${id}/restore`);
  return res.data.data;
}

export async function permanentDeleteEggRecord(id) {
  const res = await api.delete(`/eggs/${id}/permanent`);
  return res.data.data;
}

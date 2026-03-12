import api from "../api/apiClient";

const EXPORT_TYPE_ALIASES = {
  csv: "csv",
  xlsx: "xlsx",
  excel: "xlsx",
  pdf: "pdf",
};

const EXPORT_CATEGORY_ALIASES = {
  sale: "sales",
  sales: "sales",
  supply: "supplies",
  supplies: "supplies",
  purchase: "supplies",
  purchases: "supplies",
  feed: "feeds",
  feeds: "feeds",
  feed_usage: "feeds",
  feedusage: "feeds",
  egg: "eggs",
  eggs: "eggs",
  production: "eggs",
  productions: "eggs",
  poultry: "livestock",
  livestock: "livestock",
  inventory: "inventory",
  stock: "inventory",
  fish: "fish",
  pond: "fish",
  ponds: "fish",
  fishpond: "fish",
  "fish-ponds": "fish",
  fish_pond: "fish",
  hatch: "hatches",
  hatches: "hatches",
  fishhatches: "hatches",
  "fish-hatches": "hatches",
  fish_hatches: "hatches",
};

function getFilenameFromHeaders(headers, fallback = "report.csv") {
  const disposition = headers?.["content-disposition"] || headers?.get?.("content-disposition");
  if (!disposition) return fallback;
  const match = /filename="?([^"]+)"?/.exec(disposition);
  return match?.[1] || fallback;
}

export function normalizeExportType(type = "csv") {
  const normalized = String(type || "csv").trim().toLowerCase();
  return EXPORT_TYPE_ALIASES[normalized] || "csv";
}

export function normalizeExportCategory(category = "sales") {
  const normalized = String(category || "sales").trim().toLowerCase();
  return EXPORT_CATEGORY_ALIASES[normalized] || normalized || "sales";
}

export async function exportReport({ type = "csv", category, start, end } = {}) {
  const normalizedType = normalizeExportType(type);
  const normalizedCategory = normalizeExportCategory(category);
  const response = await api.get("/reports/export", {
    params: {
      type: normalizedType,
      category: normalizedCategory,
      start: start || undefined,
      end: end || undefined,
    },
    responseType: "blob",
  });

  const filename = getFilenameFromHeaders(
    response.headers,
    `${normalizedCategory || "report"}.${normalizedType}`,
  );
  return { blob: response.data, filename };
}

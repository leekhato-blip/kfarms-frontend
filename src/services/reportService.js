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

export const EXPORT_TYPE_META = {
  csv: {
    label: "CSV",
    description: "Best for spreadsheet cleanup, quick edits, and bulk analysis.",
  },
  xlsx: {
    label: "XLSX",
    description: "Keeps workbook formatting for Excel, Sheets, and finance sharing.",
  },
  pdf: {
    label: "PDF",
    description: "Locks the layout for printing, review packs, and stakeholder sharing.",
  },
};

export const EXPORT_CATEGORY_META = {
  sales: {
    label: "Sales",
    description: "Revenue, buyers, quantities, pricing, and notes for each sale.",
    fields: ["Date", "Item", "Category", "Quantity", "Unit Price", "Total Price", "Buyer", "Note"],
  },
  supplies: {
    label: "Supplies",
    description: "Purchases, vendors, quantities, pricing, and stock support notes.",
    fields: ["Date", "Item", "Category", "Quantity", "Unit Price", "Total Price", "Supplier", "Note"],
  },
  feeds: {
    label: "Feeds",
    description: "Feed usage by batch, quantity consumed, and cost notes.",
    fields: ["Date", "Batch Type", "Feed Name", "Quantity Used", "Unit Cost", "Note"],
  },
  eggs: {
    label: "Egg Production",
    description: "Daily collection totals by flock with cracked count and crates.",
    fields: ["Date", "Batch", "Good Eggs", "Cracked Eggs", "Crates", "Note"],
  },
  livestock: {
    label: "Poultry",
    description: "Flock status, live count, source, and startup details.",
    fields: ["Flock", "Type", "Alive", "Start Date", "Source", "Starting Age (Weeks)", "Mortality"],
  },
  inventory: {
    label: "Inventory",
    description: "Store room balances with units, update date, and notes.",
    fields: ["Item", "Category", "Quantity", "Unit", "Updated", "Note"],
  },
  fish: {
    label: "Fish Ponds",
    description: "Pond stock, capacity, water-change schedule, and location details.",
    fields: [
      "Pond",
      "Type",
      "Current Stock",
      "Capacity",
      "Mortality",
      "Feeding Schedule",
      "Status",
      "Location",
      "Date Stocked",
      "Last Water Change",
      "Next Water Change",
      "Note",
    ],
  },
  hatches: {
    label: "Fish Hatches",
    description: "Hatch records with pond, rate, gender split, and notes.",
    fields: ["Hatch Date", "Pond", "Quantity Hatched", "Hatch Rate", "Male Count", "Female Count", "Note"],
  },
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

export function getExportTypeMeta(type = "csv") {
  const normalized = normalizeExportType(type);
  return EXPORT_TYPE_META[normalized] || EXPORT_TYPE_META.csv;
}

export function getExportCategoryMeta(category = "sales") {
  const normalized = normalizeExportCategory(category);
  return (
    EXPORT_CATEGORY_META[normalized] || {
      label: normalized,
      description: "Export the selected section data in the chosen format.",
      fields: [],
    }
  );
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

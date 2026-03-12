export const INVENTORY_CATEGORIES = [
  "FEED",
  "MEDICINE",
  "FISH",
  "LAYER",
  "NOILER",
  "TOOLS",
  "EQUIPMENT",
  "MANURE",
  "OTHER",
];

export function formatInventoryCategoryLabel(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return "Other";

  return normalized
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

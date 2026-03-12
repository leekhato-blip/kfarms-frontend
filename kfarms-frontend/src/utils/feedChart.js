const COLORS = {
  starter: "#7C3AED",
  grower: "#0F766E",
  finisher: "#EA580C",
  layer: "#D7A86E",
  poultry: "#D7A86E",
  broiler: "#B45309",
  noiler: "#475569",
  fish: "#1565C0",
  turkey: "#DC2626",
  fowl: "#0891B2",
  duck: "#2E7D32",
  ducks: "#2E7D32",
  other: "#9CA3AF",
  others: "#9CA3AF",
};

export function resolveFeedColor(label = "") {
  const normalized = String(label).toLowerCase();
  if (
    /\b\d+(\.\d+)?mm\b/.test(normalized) ||
    normalized.includes("floating") ||
    normalized.includes("sinking")
  ) {
    return COLORS.fish;
  }
  if (normalized.includes("starter")) return COLORS.starter;
  if (normalized.includes("grower")) return COLORS.grower;
  if (normalized.includes("finisher")) return COLORS.finisher;
  if (normalized.includes("layer") || normalized.includes("poul")) return COLORS.layer;
  if (normalized.includes("broiler")) return COLORS.broiler;
  if (normalized.includes("noiler")) return COLORS.noiler;
  if (normalized.includes("fish")) return COLORS.fish;
  if (normalized.includes("turkey")) return COLORS.turkey;
  if (normalized.includes("fowl")) return COLORS.fowl;
  if (normalized.includes("duck")) return COLORS.duck;
  return COLORS.other;
}

export function formatFeedLabel(label = "") {
  const value = String(label || "").trim();
  if (!value) return "Other";

  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

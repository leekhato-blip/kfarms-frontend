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

<<<<<<< HEAD
export const INVENTORY_UNITS = [
  { value: "units", label: "Units" },
  { value: "bags", label: "Bags" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "g", label: "Grams (g)" },
  { value: "litres", label: "Litres" },
  { value: "ml", label: "Millilitres (ml)" },
  { value: "crates", label: "Crates" },
  { value: "cartons", label: "Cartons" },
  { value: "packs", label: "Packs" },
  { value: "bottles", label: "Bottles" },
  { value: "sacks", label: "Sacks" },
  { value: "trays", label: "Trays" },
];

=======
>>>>>>> 0babf4d (Update frontend application)
export function formatInventoryCategoryLabel(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return "Other";

  return normalized
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

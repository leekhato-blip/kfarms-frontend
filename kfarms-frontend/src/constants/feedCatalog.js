export const FEED_BATCH_OPTIONS = Object.freeze([
  {
    value: "LAYER",
    label: "Layer",
    items: ["Layers Mash", "Layers Pellet", "Pre-Lay Mash"],
  },
  {
    value: "BROILER",
    label: "Broiler",
    items: ["Broiler Starter", "Broiler Grower", "Broiler Finisher"],
  },
  {
    value: "NOILER",
    label: "Noiler",
    items: ["Noiler Starter", "Noiler Grower", "Noiler Finisher"],
  },
  {
    value: "FISH",
    label: "Fish",
    items: [
      "9mm Floating Feed",
      "6mm Floating Feed",
      "4.5mm Floating Feed",
      "3mm Floating Feed",
      "2mm Floating Feed",
      "1.5mm Crumble Feed",
    ],
  },
  {
    value: "DUCK",
    label: "Duck",
    items: ["Duck Starter", "Duck Grower", "Duck Breeder"],
  },
  {
    value: "FOWL",
    label: "Fowl",
    items: ["Grower Mash", "Breeder Mash", "Local Fowl Mix"],
  },
  {
    value: "TURKEY",
    label: "Turkey",
    items: ["Turkey Starter", "Turkey Grower", "Turkey Finisher"],
  },
  {
    value: "OTHER",
    label: "Other",
    items: [],
  },
]);

const BATCH_LABELS = FEED_BATCH_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const FEED_ITEMS_BY_BATCH = FEED_BATCH_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.items;
  return acc;
}, {});

function normalize(value) {
  return String(value ?? "").trim().toUpperCase();
}

export function getFeedBatchLabel(value) {
  const normalized = normalize(value);
  return BATCH_LABELS[normalized] || (normalized ? normalized : "Other");
}

export function getFeedItemsForBatch(value) {
  return FEED_ITEMS_BY_BATCH[normalize(value)] || [];
}

export function getFeedDisplayName(item) {
  const explicitName = String(
    item?.feedName ?? item?.itemName ?? item?.name ?? item?.label ?? "",
  ).trim();

  if (explicitName) return explicitName;
  return getFeedBatchLabel(item?.batchType ?? item?.type);
}

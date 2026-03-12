export function getInventoryItemName(item) {
  return item?.itemName ?? item?.name ?? "Feed item";
}

export function getInventoryQuantity(item) {
  return Number(item?.quantity ?? item?.remaining ?? item?.onHand ?? 0) || 0;
}

export function getInventoryThreshold(item) {
  return Number(item?.minThreshold ?? item?.threshold ?? item?.reorderLevel ?? 0) || 0;
}

export function getInventoryUnit(item) {
  return item?.unit || "kg";
}

export function getInventoryStatusKey(item) {
  const quantity = getInventoryQuantity(item);
  const threshold = getInventoryThreshold(item);

  if (quantity <= 0) return "out";
  if (quantity <= threshold) return "low";
  return "healthy";
}

export function getInventoryShortage(item) {
  return Math.max(getInventoryThreshold(item) - getInventoryQuantity(item), 0);
}

export function getRecommendedRestockQuantity(item) {
  const quantity = getInventoryQuantity(item);
  const threshold = getInventoryThreshold(item);

  if (threshold > 0) {
    const buffer = Math.max(Math.ceil(threshold * 0.1), 1);
    const targetQuantity = threshold + buffer;
    return Math.max(targetQuantity - quantity, 1);
  }

  return Math.max(10 - quantity, 1);
}

export function sortInventoryRestockPriority(left, right) {
  const rank = {
    out: 0,
    low: 1,
    healthy: 2,
  };

  const leftStatus = getInventoryStatusKey(left);
  const rightStatus = getInventoryStatusKey(right);
  const leftRank = rank[leftStatus] ?? 99;
  const rightRank = rank[rightStatus] ?? 99;

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  const shortageDelta = getInventoryShortage(right) - getInventoryShortage(left);
  if (shortageDelta !== 0) {
    return shortageDelta;
  }

  const quantityDelta = getInventoryQuantity(left) - getInventoryQuantity(right);
  if (quantityDelta !== 0) {
    return quantityDelta;
  }

  return getInventoryItemName(left).localeCompare(getInventoryItemName(right));
}

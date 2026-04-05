import api from "../api/apiClient";
import { hasDemoAccountHint } from "../auth/demoMode";
import {
  getInventoryItemName,
  getInventoryQuantity,
  getInventoryThreshold,
  sortInventoryRestockPriority,
} from "../utils/inventoryStock";
import { enrichEggProductionSummary } from "./eggProductionService";
import { getAllInventory } from "./inventoryService";

const WATCHLIST_FILL_TARGET = 4;

function isFeedInventoryItem(item) {
  return String(item?.category || "").toUpperCase() === "FEED";
}

function getFeedWatchlistKey(item) {
  if (item?.id != null && item?.id !== "") return `id:${item.id}`;
  return `name:${String(getInventoryItemName(item)).trim().toLowerCase()}`;
}

function mergeUniqueFeedItems(...collections) {
  const next = [];
  const seen = new Set();

  collections.flat().forEach((item) => {
    if (!item) return;
    const key = getFeedWatchlistKey(item);
    if (seen.has(key)) return;
    seen.add(key);
    next.push(item);
  });

  return next.sort(sortInventoryRestockPriority);
}

function appendUniqueFeedItems(primary = [], secondary = []) {
  const existing = new Set((Array.isArray(primary) ? primary : []).map(getFeedWatchlistKey));
  const additions = (Array.isArray(secondary) ? secondary : []).filter((item) => {
    const key = getFeedWatchlistKey(item);
    if (existing.has(key)) return false;
    existing.add(key);
    return true;
  });

  return [...(Array.isArray(primary) ? primary : []), ...additions];
}

function isNearFeedThreshold(item) {
  const quantity = getInventoryQuantity(item);
  const threshold = getInventoryThreshold(item);

  if (quantity <= 0) return true;
  if (threshold <= 0) return false;

  return quantity <= Math.max(threshold * 1.35, threshold + 4);
}

function buildNearThresholdFeedItems(items = []) {
  return (Array.isArray(items) ? items : [])
    .filter(isFeedInventoryItem)
    .filter(isNearFeedThreshold)
    .sort(sortInventoryRestockPriority);
}

function buildDemoFeedWatchlist() {
  return [
    {
      id: "demo-feed-starter-crumbs",
      itemName: "Starter Crumbs",
      category: "FEED",
      quantity: 0,
      minThreshold: 6,
      unit: "bags",
      readOnly: true,
      source: "demo",
    },
    {
      id: "demo-feed-layer-mash",
      itemName: "Layer Mash",
      category: "FEED",
      quantity: 3,
      minThreshold: 10,
      unit: "bags",
      readOnly: true,
      source: "demo",
    },
    {
      id: "demo-feed-fish-2mm",
      itemName: "Fish Feed 2mm",
      category: "FEED",
      quantity: 2,
      minThreshold: 8,
      unit: "bags",
      readOnly: true,
      source: "demo",
    },
    {
      id: "demo-feed-grower-mash",
      itemName: "Grower Mash",
      category: "FEED",
      quantity: 5,
      minThreshold: 12,
      unit: "bags",
      readOnly: true,
      source: "demo",
    },
  ];
}

/**
 * Fetches all summary data for the dashboard.
 * Backend route: GET /dashboard/summary
 * Returns: { success, message, data }
 */
export async function getDashboardSummary(options = {}) {
    const res = await api.get("/dashboard/summary");
    const summary = await enrichEggProductionSummary(res.data?.data, options);

    return {
      ...res.data,
      data: summary,
    };
}

/**
 * Fetches finance summary for the Revenue & Expenses chart.
 * Backend: GET /dashboard/finance-summary
 * Expected: { monthlyFinance: [ {month, revenue, expense}, ... ] }
 */
export async function getFinanceSummary() {
    const res = await api.get("/dashboard/finance-summary");
    return res.data.data;
}

/**
 * Fetches low-stock feed items using the inventory summary so the watchlist
 * stays aligned with reorder thresholds and offline inventory adjustments.
 */
export async function getFeedWatchlist() {
    const res = await api.get("/inventory/summary");
    const lowStockItems = Array.isArray(res.data?.data?.lowStockItems)
      ? res.data.data.lowStockItems
      : [];
    const demoMode = hasDemoAccountHint();

    let watchlist = lowStockItems
      .filter((item) => String(item?.category || "").toUpperCase() === "FEED")
      .sort(sortInventoryRestockPriority);

    if (demoMode && watchlist.length < WATCHLIST_FILL_TARGET) {
      try {
        const inventory = await getAllInventory({
          page: 0,
          size: 40,
          category: "FEED",
        });
        watchlist = mergeUniqueFeedItems(
          watchlist,
          buildNearThresholdFeedItems(inventory?.items || []),
        ).slice(0, WATCHLIST_FILL_TARGET);
      } catch {
        // Keep the summary-based watchlist if inventory fallback is unavailable.
      }
    }

    if (demoMode && watchlist.length < WATCHLIST_FILL_TARGET) {
      watchlist = appendUniqueFeedItems(watchlist, buildDemoFeedWatchlist()).slice(
        0,
        WATCHLIST_FILL_TARGET,
      );
    }

    return watchlist;
}

export async function getRecentActivities() {
    const res = await api.get("/dashboard/recent-activities");
    return res.data;
}

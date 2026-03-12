import React, { useState } from "react";
import { Box, AlertTriangle, Plus, RefreshCw } from "lucide-react";
import {
  getInventoryItemName,
  getInventoryQuantity,
  getInventoryStatusKey,
  getInventoryThreshold,
  getInventoryUnit,
  getRecommendedRestockQuantity,
} from "../utils/inventoryStock";

export default function FeedWatchlistPanel({
  feeds = [],
  onRestock,
  onRefresh,
  restockingId = null,
}) {
  const [refreshing, setRefreshing] = useState(false);
  const LIST_LIMIT = 4;

  const pct = (remaining, threshold) => {
    if (!threshold || threshold <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((remaining / threshold) * 100)));
  };

  const pillColor = (remaining, threshold) => {
    const p = pct(remaining, threshold);
    if (remaining <= 0 || p <= 25)
      return "bg-rose-50 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300";
    if (p <= 60)
      return "bg-amber-50 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300";
    return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    try {
      setRefreshing(true);
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center gap-4 py-8 text-center font-body">
      <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
        <Box className="w-10 h-10 text-slate-500 dark:text-slate-300" />
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xs">
        All feeds are healthy. Items below threshold will appear here.
      </p>
      <button
        onClick={() => onRefresh?.()}
        title="Refresh feed stock status"
        aria-label="Refresh feed stock status"
        className="inline-flex items-center justify-center rounded-md border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <div className="bg-white dark:bg-darkCard shadow-neo dark:shadow-dark p-4 rounded-xl animate-fadeIn font-body">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-gradient-to-br from-lightPrimary to-lightSecondary dark:from-darkPrimary dark:to-darkSecondary">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold font-header">
              Feed Watchlist
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Low or critical feed levels
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          title="Refresh feed stock status"
          disabled={refreshing}
          className={`inline-flex items-center justify-center rounded-md border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 ${
            refreshing ? "cursor-not-allowed opacity-70" : ""
          }`}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* List */}
      {feeds.length === 0 ? (
        renderEmpty()
      ) : (
        <ul className="space-y-3">
          {feeds.slice(0, LIST_LIMIT).map((f) => {
            const name = getInventoryItemName(f);
            const threshold = getInventoryThreshold(f);
            const remaining = getInventoryQuantity(f);
            const unit = getInventoryUnit(f);
            const statusKey = getInventoryStatusKey(f);
            const isPreviewOnly = Boolean(f?.readOnly);
            const canRestock = typeof onRestock === "function" && !isPreviewOnly;
            const recommendedQuantity = getRecommendedRestockQuantity(f);
            const isRestocking = restockingId != null && String(restockingId) === String(f?.id);
            const thresholdLabel =
              threshold > 0
                ? `Reorder at ${threshold} ${unit}`
                : "No reorder level set";
            const statusLabel =
              statusKey === "out"
                ? "Out of stock"
                : statusKey === "low"
                  ? "Low stock"
                  : "Healthy";

            return (
              <li
                key={f.id}
                className="rounded-lg border border-slate-100 dark:border-slate-700 p-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Left */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium font-header truncate">
                        {name}
                      </div>
                      {isPreviewOnly ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                          Demo
                        </span>
                      ) : null}
                    </div>
                    <div
                      className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${pillColor(
                        remaining,
                        threshold
                      )}`}
                    >
                      {remaining} {unit} left
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {statusLabel} • {thresholdLabel}
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">
                        Remaining
                      </div>
                      <div className="text-lg font-semibold font-header leading-none">
                        {remaining} {unit}
                      </div>
                    </div>

                    {/* Mobile: icon only | Desktop: text */}
                    <button
                      onClick={() => onRestock?.(f)}
                      disabled={!canRestock || isRestocking}
                      title={
                        isPreviewOnly
                          ? "Demo suggestion only"
                          : canRestock
                          ? `Restock ${name} by ${recommendedQuantity} ${unit}`
                          : "Restock action unavailable"
                      }
                      className="h-9 w-9 sm:w-auto sm:px-3 rounded-md bg-accent-primary text-white shadow-soft flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isRestocking ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline text-sm">
                        {isRestocking ? "Restocking..." : "Restock"}
                      </span>
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 text-xs text-slate-400">
        Only poultry and fish feed items are shown.
      </div>
    </div>
  );
}

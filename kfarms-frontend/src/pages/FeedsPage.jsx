import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import SummaryCard from "../components/SummaryCard";
import FarmerGuideCard from "../components/FarmerGuideCard";
import FilteredResultsHint from "../components/FilteredResultsHint";
import FeedPie from "../components/FeedPie";
import FeedFormModal from "../components/FeedFormModal";
import ConfirmModal from "../components/ConfirmModal";
import GlassToast from "../components/GlassToast";
import TrashModal from "../components/TrashModal";
import ItemDetailsModal from "../components/ItemDetailsModal";
import ExportModal from "../components/ExportModal";
import { useTenant } from "../tenant/TenantContext";
import { formatFeedLabel, resolveFeedColor } from "../utils/feedChart";
import { isOfflinePendingRecord } from "../offline/offlineResources";
import { useOfflineSyncRefresh } from "../offline/useOfflineSyncRefresh";
import {
  getFeedSummary,
  getAllFeeds,
  deleteFeed,
  permanentDeleteFeed,
  restoreFeed,
  getDeletedFeeds,
} from "../services/feedService";
import { exportReport } from "../services/reportService";
import useQuickCreateModal from "../hooks/useQuickCreateModal";
import {
  Wheat,
  Wallet,
  AlertTriangle,
  Package,
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
} from "lucide-react";

const emptyFeedData = {
  usedThisMonth: 0,
  stockByCategory: {},
  topFeedsByUsage: [],
  totalQuantityUsed: 0,
  avgUnitCost: 0.0,
  monthlySpend: 0.0,
  reorderCount: 0,
  feedBreakdown: [],
  recentFeedTransactions: [],
  unit: "kg",
  countByType: {},
  lowStockCount: 0,
  totalStockOnHand: 0,
  totalFeeds: 0,
  lastFeedDate: null,
};

const formatCount = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  return numeric.toLocaleString();
};

const formatCurrency = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric === 0) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(numeric);
};

const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const EDITOR_ROLES = new Set(["OWNER", "ADMIN", "MANAGER"]);
const ADMIN_ROLES = new Set(["OWNER", "ADMIN"]);

function normalizeRole(value) {
  return String(value || "").trim().toUpperCase();
}

function getFeedQuantity(item) {
  return Number(item?.quantity ?? item?.quantityUsed ?? 0) || 0;
}

function FeedSectionEmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  compact = false,
  className = "",
}) {
  const EmptyStateIcon = icon || Wheat;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-dashed border-slate-200/70 bg-white/50 text-center shadow-soft dark:border-white/10 dark:bg-white/[0.04] ${compact ? "p-4" : "p-6"} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_42%)] dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_42%)]" />

      <div className="relative flex h-full flex-col items-center justify-center gap-3">
        <span
          className={`inline-flex items-center justify-center rounded-2xl border border-white/60 bg-white/80 text-accent-primary shadow-soft dark:border-white/10 dark:bg-white/10 dark:text-emerald-200 ${compact ? "h-12 w-12" : "h-14 w-14"}`}
          aria-hidden="true"
        >
          <EmptyStateIcon className={compact ? "h-5 w-5" : "h-6 w-6"} />
        </span>

        <div className="space-y-1">
          <h4 className={`font-header font-semibold text-slate-800 dark:text-slate-100 ${compact ? "text-sm" : "text-base"}`}>
            {title}
          </h4>
          <p className={`mx-auto max-w-md leading-relaxed text-slate-500 dark:text-slate-400 ${compact ? "text-xs" : "text-sm"}`}>
            {message}
          </p>
        </div>

        {actionLabel && typeof onAction === "function" ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center justify-center rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function FeedsPage() {
  const { activeTenant } = useTenant();
  const [loading, setLoading] = useState(true);
  const [feedData, setFeedData] = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [feeds, setFeeds] = useState([]);
  const [meta, setMeta] = useState({
    page: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [filters, setFilters] = useState({ batchType: "", date: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [trashOpen, setTrashOpen] = useState(false);

  const fetchFeedSummary = async () => {
    try {
      const res = await getFeedSummary();
      const summary =
        res?.data?.summary ??
        res?.data ??
        res?.summary ??
        res;
      setFeedData(summary || emptyFeedData);
    } catch (err) {
      console.error("Failed to fetch feed summary", err);
      setFeedData(emptyFeedData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedSummary();
  }, []);

  const tenantRole = normalizeRole(activeTenant?.myRole);
  const canCreateOrEdit = EDITOR_ROLES.has(tenantRole);
  const canDeleteOrRestore = ADMIN_ROLES.has(tenantRole);

  const fetchFeeds = async (page = 0) => {
    setListLoading(true);
    try {
      const res = await getAllFeeds({
        page,
        size: 10,
        batchType: filters.batchType || undefined,
        date: filters.date || undefined,
      });

      const payload = res?.data ?? res;
      setFeeds(payload?.items || payload?.content || payload?.records || []);
      setMeta({
        page: payload?.page ?? payload?.number ?? 0,
        totalPages: payload?.totalPages ?? payload?.total_pages ?? 0,
        hasNext:
          payload?.hasNext ??
          (typeof payload?.last === "boolean" ? !payload.last : false),
        hasPrevious:
          payload?.hasPrevious ??
          (typeof payload?.first === "boolean" ? !payload.first : false),
      });
    } catch (err) {
      console.error("Failed to fetch feeds", err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.batchType, filters.date]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([
        fetchFeedSummary(),
        fetchFeeds(meta.page),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const refreshPageData = React.useCallback(async () => {
    await Promise.all([fetchFeedSummary(), fetchFeeds(meta.page ?? 0)]);
  }, [fetchFeeds, fetchFeedSummary, meta.page]);

  useOfflineSyncRefresh(refreshPageData);

  const clearFeedFilters = () => {
    setFilters({ batchType: "", date: "" });
  };

  const data = feedData || emptyFeedData;

  const stockByCategory = useMemo(() => {
    const entries = Object.entries(data?.stockByCategory || {});
    const total = entries.reduce(
      (sum, [, value]) => sum + (Number(value) || 0),
      0
    );

    return entries
      .map(([label, value]) => {
        const numericValue = Number(value) || 0;
        return {
          label,
          displayLabel: formatFeedLabel(label),
          value: numericValue,
          share: total > 0 ? Math.round((numericValue / total) * 100) : 0,
          color: resolveFeedColor(label),
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const feedBreakdown = useMemo(() => {
    const items = (Array.isArray(data?.feedBreakdown) ? data.feedBreakdown : [])
      .map((item) => ({
        label: formatFeedLabel(item?.label || "Other"),
        value: Number(item?.value) || 0,
        color: resolveFeedColor(item?.label || "Other"),
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    const total = items.reduce((sum, item) => sum + item.value, 0);
    return items.map((item) => ({
      ...item,
      share: total > 0 ? Math.round((item.value / total) * 100) : 0,
    }));
  }, [data]);

  const feedBreakdownSummary = useMemo(() => {
    const lead = feedBreakdown[0] || null;
    const runnerUp = feedBreakdown[1] || null;
    const featured = feedBreakdown.slice(0, 3);

    return {
      lead,
      runnerUp,
      featured,
      topTwoShare: featured.slice(0, 2).reduce((sum, item) => sum + item.share, 0),
      remainingCount: Math.max(feedBreakdown.length - featured.length, 0),
    };
  }, [feedBreakdown]);

  const topFeeds = useMemo(() => {
    const list = Array.isArray(data?.topFeedsByUsage)
      ? data.topFeedsByUsage
      : [];
    return list.slice(0, 6);
  }, [data]);

  const recentTransactions = useMemo(() => {
    const list = Array.isArray(data?.recentFeedTransactions)
      ? data.recentFeedTransactions
      : [];
    return list.slice(0, 7);
  }, [data]);

  const hasFeedBreakdown = feedBreakdown.length > 0;
  const hasFeedData = feeds.length > 0;
  const hasStockData = stockByCategory.some((item) => item.value > 0);
  const hasTopFeedUsage = topFeeds.length > 0;
  const hasRecentTransactions = recentTransactions.length > 0;
  const hasActiveFilters = Boolean(filters.batchType || filters.date);
  const summaryCards = [
    {
      title: "Stock on Hand",
      value: `${formatCount(data?.totalStockOnHand)} ${data?.unit || ""}`.trim(),
      subtitle: "Current inventory",
      icon: <Package />,
      hasData: Number(data?.totalStockOnHand) > 0,
    },
    {
      title: "Used This Month",
      value: `${formatCount(data?.usedThisMonth)} ${data?.unit || ""}`.trim(),
      subtitle: "Month-to-date",
      icon: <TrendingDown />,
      hasData: Number(data?.usedThisMonth ?? data?.totalQuantityUsed) > 0,
    },
    {
      title: "Monthly Spend",
      value: formatCurrency(data?.monthlySpend),
      subtitle: "Feed expenses",
      icon: <Wallet />,
      hasData: Number(data?.monthlySpend) > 0,
    },
    {
      title: "Low Stock",
      value: formatCount(data?.lowStockCount ?? data?.reorderCount),
      subtitle: "Needs restock",
      icon: <AlertTriangle />,
      hasData: Number(data?.lowStockCount ?? data?.reorderCount) > 0,
    },
  ];
  const hasSummaryMetrics = summaryCards.some((card) => card.hasData);
  const hasFeedOverviewData =
    hasSummaryMetrics ||
    hasFeedBreakdown ||
    hasStockData ||
    hasTopFeedUsage ||
    hasRecentTransactions ||
    Number(data?.totalFeeds) > 0 ||
    hasFeedData;
  const firstFeedCtaLabel = canCreateOrEdit ? "Record first feed entry" : null;
  const firstFeedMessage = canCreateOrEdit
    ? "Record your first feed entry to unlock stock levels, usage trends, cost insights, and recent activity across this page."
    : "Feed insights will appear here after someone records the first feed entry.";
  const listEmptyTitle = hasActiveFilters
    ? "No feed records match what you selected"
    : "No feed records yet";
  const listEmptyMessage = hasActiveFilters
    ? "The top boxes above still show all feed activity. Show everything to see the full list again."
    : canCreateOrEdit
      ? "Add the first feed record to start building your feed history."
      : "Feed records will appear here after someone on the farm logs activity.";
  const detailFields = detailItem
    ? (() => {
        const quantity = getFeedQuantity(detailItem);
        const unitCost = Number(detailItem.unitCost || 0);
        const total = quantity * unitCost;
        const type = detailItem.batchType || detailItem.type || "—";
        const date = detailItem.date || detailItem.feedDate || detailItem.createdAt;
        const unitLabel = data?.unit || "";
        return [
          { label: "Date", value: formatDate(date) },
          { label: "Batch Type", value: type },
          {
            label: "Quantity",
            value: `${formatCount(quantity)} ${unitLabel}`.trim(),
          },
          {
            label: "Unit Cost",
            value: unitCost ? formatCurrency(unitCost) : "—",
          },
          {
            label: "Total",
            value: unitCost ? formatCurrency(total) : "—",
          },
          { label: "Note", value: detailItem.note || "—", span: 2 },
        ];
      })()
    : [];

  function getFeedStatus(item) {
    const logged = Boolean(item?.date || item?.feedDate || item?.createdAt);
    return {
      label: logged ? "Logged" : "Pending",
      color: logged ? "#22c55e" : "#f59e0b",
    };
  }

  const openCreate = () => {
    if (!canCreateOrEdit) return;
    setEditing(null);
    setModalOpen(true);
  };

  useQuickCreateModal(() => {
    openCreate();
  });

  const openEdit = (item) => {
    if (!canCreateOrEdit) return;
    setEditing(item);
    setModalOpen(true);
  };

  const handleExport = async ({ type, category, start, end }) => {
    if (exporting) return;
    setExporting(true);
    try {
      const { blob, filename } = await exportReport({
        type,
        category,
        start: start || undefined,
        end: end || undefined,
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `${category || "feeds"}.${type || "csv"}`;
      link.click();
      window.URL.revokeObjectURL(url);
      setToast({ message: "Feeds export ready", type: "success" });
    } catch (error) {
      console.error("Export failed: ", error);
      setToast({ message: "Export failed", type: "error" });
    } finally {
      setExporting(false);
      setExportOpen(false);
    }
  };

  const openDetails = (item) => {
    setDetailItem(item);
  };

  const closeDetails = () => {
    setDetailItem(null);
  };

  const askDelete = (item) => {
    if (!canDeleteOrRestore) return;
    setDeleteTarget(item);
    setConfirmOpen(true);
  };

  const confirmDelete = async (item) => {
    if (!item?.id) return;
    setDeleting(true);
    try {
      await deleteFeed(item.id);
      setToast({
        message: "Feed record deleted successfully",
        type: "success",
      });
      await Promise.all([fetchFeeds(meta.page), fetchFeedSummary()]);
    } catch (err) {
      console.error("Delete feed failed", err);
      setToast({
        message:
          err?.response?.status === 403
            ? "You do not have permission to delete feed records"
            : "Failed to delete feed record",
        type: "error",
      });
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="font-body animate-fadeIn space-y-5 sm:space-y-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="relative isolate overflow-hidden rounded-2xl border border-sky-200/70 bg-slate-50/85 p-5 shadow-neo dark:border-sky-500/20 dark:bg-[#061024]/90 dark:shadow-[0_22px_40px_rgba(2,8,24,0.45)] md:p-6">
            <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(108deg,rgba(37,99,235,0.17)_0%,rgba(14,116,144,0.14)_48%,rgba(16,185,129,0.12)_100%),radial-gradient(circle_at_12%_22%,rgba(56,189,248,0.13),transparent_43%),radial-gradient(circle_at_90%_22%,rgba(16,185,129,0.14),transparent_38%)] dark:bg-[linear-gradient(108deg,rgba(6,19,43,0.96)_0%,rgba(7,32,63,0.9)_48%,rgba(6,58,55,0.84)_100%),radial-gradient(circle_at_12%_22%,rgba(56,189,248,0.16),transparent_43%),radial-gradient(circle_at_90%_22%,rgba(16,185,129,0.18),transparent_38%)]" />

            <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-accent-primary/35 bg-accent-primary/12 px-3 py-1 text-sm font-semibold text-accent-primary dark:border-blue-300/35 dark:bg-blue-500/20 dark:text-blue-100">
                  <Wheat className="h-3.5 w-3.5" />
                  Feed records
                </span>
                <h1 className="mt-3 text-3xl font-semibold font-header tracking-tight text-slate-900 dark:text-slate-50">
                  Feeds
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:text-base font-body">
                  Record what feed was used, how much is left, and how much feed is
                  costing the farm.
                </p>
              </div>

              <div className="grid w-full grid-cols-2 auto-rows-fr items-center gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-start lg:justify-end">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh feeds"
                  aria-label="Refresh feeds"
                  className={`order-2 inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white/45 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 disabled:opacity-60 sm:order-none sm:h-auto sm:min-h-0 sm:w-auto sm:px-4 dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20 ${
                    refreshing ? "cursor-not-allowed opacity-70" : ""
                  }`}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                {canCreateOrEdit && (
                  <button
                    onClick={openCreate}
                    className="order-1 col-span-2 inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent-primary px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 sm:order-none sm:col-span-1 sm:h-auto sm:min-h-0 sm:w-auto sm:px-4"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                    Record feed
                  </button>
                )}
                <button
                  onClick={() => setExportOpen(true)}
                  disabled={exporting}
                  className="order-3 inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white/45 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 disabled:opacity-60 sm:order-none sm:h-auto sm:min-h-0 sm:w-auto sm:px-4 dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20"
                  title="Download feed report"
                >
                  <Download className="h-4 w-4" />
                  {exporting ? "Downloading..." : "Download"}
                </button>
              </div>
            </div>

            <div className="relative z-10 mt-3 text-left text-[11px] font-medium text-slate-600 dark:text-slate-200/80 sm:text-right">
              Updated {formatDate(data?.lastFeedDate)}
            </div>
          </div>

          <FarmerGuideCard
            icon={Wheat}
            title="How to use feeds"
            description="Use this page to keep feed records simple and easy to follow."
            storageKey="feeds-guide"
            steps={[
              "Record each feed entry when feed is given or used.",
              "Look at the top cards to see stock, usage, and cost quickly.",
              "Use the find boxes only when you want to find one entry.",
            ]}
            tip="The top boxes show all feed activity. The table below may show fewer rows when the find boxes are in use."
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={`feed-summary-skel-${idx}`}
                  className="min-h-[92px] rounded-2xl bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-5"
                  aria-hidden="true"
                >
                  <div className="skeleton-glass w-14 h-14 rounded-xl" />
                  <div className="mt-4 space-y-2">
                    <div className="skeleton-glass h-4 w-24 rounded" />
                    <div className="skeleton-glass h-3 w-16 rounded" />
                  </div>
                </div>
              ))
            : hasSummaryMetrics
              ? summaryCards.map((card) => (
                <SummaryCard
                  key={card.title}
                  icon={card.icon}
                  title={card.title}
                  value={card.value}
                  subtitle={card.subtitle}
                  titleClass="font-header"
                  valueClass="font-body"
                  className="min-h-[92px]"
                />
              ))
              : (
                <div className="col-span-full">
                  <FeedSectionEmptyState
                    title="No feed activity yet"
                    message={firstFeedMessage}
                    actionLabel={firstFeedCtaLabel}
                    onAction={canCreateOrEdit ? openCreate : undefined}
                    className="min-h-[172px]"
                  />
                </div>
              )}
        </div>

        {/* Mobile compact insights (collapsible) */}
        <div className="sm:hidden rounded-2xl border border-white/10 bg-white/10 p-4 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
          <details className="group">
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700 dark:text-slate-100">
              More Feed Insights
            </summary>
            {!loading && !hasFeedOverviewData ? (
              <div className="mt-3">
                <FeedSectionEmptyState
                  compact
                  title="Feed insights will appear here"
                  message={firstFeedMessage}
                  actionLabel={firstFeedCtaLabel}
                  onAction={canCreateOrEdit ? openCreate : undefined}
                />
              </div>
            ) : (
              <div className="mt-3 grid gap-4">
                <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 dark:bg-white/5">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Total Used</div>
                  <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {formatCount(data?.totalQuantityUsed)} {data?.unit || ""}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold font-header mb-2">Stock by Category</h3>
                  {loading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <div key={`mobile-stock-skel-${idx}`} className="space-y-2">
                          <div className="skeleton-glass h-3 w-24 rounded" />
                          <div className="skeleton-glass h-2 w-full rounded" />
                        </div>
                      ))}
                    </div>
                  ) : !hasStockData ? (
                    <FeedSectionEmptyState
                      icon={Package}
                      compact
                      title="No stock split yet"
                      message="Feed inventory categories will appear here after the first stock entry is recorded."
                      actionLabel={firstFeedCtaLabel}
                      onAction={canCreateOrEdit ? openCreate : undefined}
                    />
                  ) : (
                    <div className="space-y-3">
                      {stockByCategory.map((item) => {
                        return (
                          <div key={`mobile-stock-${item.label}`} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: item.color }}
                                />
                                {item.displayLabel}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400">{item.value} {data?.unit || ""}</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${item.share}%`,
                                  backgroundColor: item.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold font-header mb-2">Top Feeds by Usage</h3>
                  {loading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <div key={`mobile-top-feed-skel-${idx}`} className="skeleton-glass h-9 rounded" />
                      ))}
                    </div>
                  ) : !hasTopFeedUsage ? (
                    <FeedSectionEmptyState
                      icon={TrendingDown}
                      compact
                      title="No usage ranking yet"
                      message="Most-used feed types will show up here once feed usage starts coming in."
                      actionLabel={firstFeedCtaLabel}
                      onAction={canCreateOrEdit ? openCreate : undefined}
                    />
                  ) : (
                    <ul className="space-y-2">
                      {topFeeds.slice(0, 4).map((feed, idx) => (
                        <li
                          key={`mobile-top-feed-${feed.label}-${idx}`}
                          className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-700"
                        >
                          <span className="text-xs text-slate-700 dark:text-slate-200">{feed.label}</span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            {feed.value} {data?.unit || ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </details>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold font-header">
                  Feed Breakdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Share of feed usage by poultry category.
                </p>
              </div>
              <div className="text-xs text-slate-400">
                {hasFeedBreakdown ? "" : "No data yet"}
              </div>
            </div>
            {loading ? (
              <div className="skeleton-glass h-[260px] sm:h-[300px] rounded-xl" />
            ) : (
              hasFeedBreakdown ? (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
                  <FeedPie breakdown={data?.feedBreakdown || []} />

                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Usage Snapshot
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Quick highlights from the current feed mix.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-slate-200/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Lead Category
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                          {feedBreakdownSummary.lead?.label || "—"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {feedBreakdownSummary.lead ? `${feedBreakdownSummary.lead.share}% of usage` : "No usage yet"}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Top Two Mix
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                          {feedBreakdownSummary.topTwoShare}%
                        </div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Combined share of the two strongest categories
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Top Mix
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {feedBreakdownSummary.featured.map((item) => (
                          <span
                            key={`breakdown-chip-${item.label}`}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-100"
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            {item.label}
                            <span className="text-slate-500 dark:text-slate-300">
                              {item.share}%
                            </span>
                          </span>
                        ))}
                      </div>
                      {feedBreakdownSummary.remainingCount > 0 && (
                        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                          +{feedBreakdownSummary.remainingCount} other categories in the mix
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <FeedPie
                  breakdown={data?.feedBreakdown || []}
                  emptyTitle="No feed mix yet"
                  emptyMessage={
                    canCreateOrEdit
                      ? "Record feed usage to unlock category mix insights and usage snapshots."
                      : "Feed usage mix will appear here after someone on the farm logs activity."
                  }
                  emptyActionLabel={firstFeedCtaLabel}
                  onEmptyAction={canCreateOrEdit ? openCreate : undefined}
                />
              )
            )}
          </div>

          <div className="hidden sm:block rounded-2xl border border-white/10 bg-white/10 p-4 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
            <h3 className="text-lg font-semibold font-header mb-2">
              Stock by Category
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Current feed stock split by category.
            </p>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={`stock-skel-${idx}`} className="space-y-2">
                    <div className="skeleton-glass h-3 w-24 rounded" />
                    <div className="skeleton-glass h-2 w-full rounded" />
                  </div>
                ))}
              </div>
            ) : !hasStockData ? (
              <FeedSectionEmptyState
                icon={Package}
                compact
                title="No stock categories yet"
                message="Current stock split will appear here once feed stock is available."
                actionLabel={firstFeedCtaLabel}
                onAction={canCreateOrEdit ? openCreate : undefined}
                className="min-h-[240px]"
              />
            ) : (
              <div className="space-y-3">
                {stockByCategory.map((item) => {
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.displayLabel}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {item.value} {data?.unit || ""}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${item.share}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Lower Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="hidden sm:block rounded-2xl border border-white/10 bg-white/10 p-4 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
            <h3 className="text-lg font-semibold font-header mb-2">
              Top Feeds by Usage
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Most used feed items this month.
            </p>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={`top-feed-skel-${idx}`} className="skeleton-glass h-10 rounded" />
                ))}
              </div>
            ) : !hasTopFeedUsage ? (
              <FeedSectionEmptyState
                icon={TrendingDown}
                compact
                title="No usage data yet"
                message="Top feed items will appear here after feed usage has been recorded."
                actionLabel={firstFeedCtaLabel}
                onAction={canCreateOrEdit ? openCreate : undefined}
                className="min-h-[240px]"
              />
            ) : (
              <ul className="space-y-2">
                {topFeeds.map((feed, idx) => (
                  <li
                    key={`${feed.label}-${idx}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-700 px-3 py-2"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-200">
                      {feed.label}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {feed.value} {data?.unit || ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold font-header">
                  Recent Feed Transactions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Latest feed usage logs and adjustments.
                </p>
              </div>
              <div className="text-xs text-slate-400">
                Showing {recentTransactions.length} entries
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={`tx-skel-${idx}`} className="skeleton-glass h-10 rounded" />
                ))}
              </div>
            ) : !hasRecentTransactions ? (
              <FeedSectionEmptyState
                icon={Wheat}
                compact
                title="No recent feed records"
                message="Feed logs and stock adjustments will appear here after the first entry is recorded."
                actionLabel={firstFeedCtaLabel}
                onAction={canCreateOrEdit ? openCreate : undefined}
                className="min-h-[260px]"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2">Date</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Quantity</th>
                      <th className="py-2">Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b border-slate-100 dark:border-slate-800"
                      >
                        <td className="py-2 text-slate-600 dark:text-slate-300">
                          {formatDate(tx.date)}
                        </td>
                        <td className="py-2 text-slate-700 dark:text-slate-200">
                          {tx.batchType || tx.type || "—"}
                        </td>
                        <td className="py-2 text-slate-700 dark:text-slate-200">
                          {formatCount(getFeedQuantity(tx))} {data?.unit || ""}
                        </td>
                        <td className="py-2 text-slate-500 dark:text-slate-400">
                          {tx.unitCost == null ? "—" : formatCurrency(tx.unitCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* FILTERS */}
        <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 dark:shadow-dark shadow-neo p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-body">
            Use these find boxes only when you want to narrow the list to one feed type or one day.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <select
              value={filters.batchType}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, batchType: e.target.value }))
              }
              className="px-3 py-2 rounded-md bg-transparent bg-lightCard dark:bg-darkCard border dark:border-white/10"
            >
              <option value="">All Types</option>
              <option value="LAYER">Layer</option>
              <option value="BROILER">Broiler</option>
              <option value="NOILER">Noiler</option>
              <option value="DUCK">Duck</option>
              <option value="FISH">Fish</option>
              <option value="FOWL">Fowl</option>
              <option value="TURKEY">Turkey</option>
              <option value="OTHER">Other</option>
            </select>
            <input
              type="date"
              value={filters.date}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, date: e.target.value }))
              }
              className="px-3 py-2 rounded-md bg-transparent border border-white/10"
            />
          </div>
        </div>

        {!listLoading && (hasActiveFilters || (Number(data?.totalFeeds) > 0 && !hasFeedData)) && (
          <FilteredResultsHint
            summaryLabel="feed records"
            tableLabel="feed records table"
            hasFilters={hasActiveFilters}
            onClear={clearFeedFilters}
          />
        )}

        {/* TABLE CARD */}
        <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 border border-white/10 dark:shadow-dark shadow-neo p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="space-y-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
                Each row below is one feed record you can review, edit, or delete.
              </p>
              <span className="inline-flex items-center rounded-full border border-accent-primary/30 bg-accent-primary/10 px-2.5 py-1 text-[11px] font-semibold text-accent-primary dark:border-blue-300/35 dark:bg-blue-500/20 dark:text-blue-100">
                Total records: {formatCount(data?.totalFeeds)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFeedFilters}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-accent-primary"
                >
                  Show everything
                </button>
              )}
              {canDeleteOrRestore && (
                <button
                  onClick={() => setTrashOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-body">Deleted Records</span>
                </button>
              )}
            </div>
          </div>

          {listLoading ? (
            <div className="overflow-x-auto">
              <div className="space-y-3" aria-hidden="true">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={`feeds-row-skeleton-${idx}`}
                    className="skeleton-glass h-10 rounded-md"
                  />
                ))}
              </div>
            </div>
          ) : hasFeedData ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px] border-separate border-spacing-y-2 [&_th]:px-4 [&_th]:pb-2 [&_td]:px-4 [&_td]:py-3 [&_td:first-child]:rounded-l-xl [&_td:last-child]:rounded-r-xl [&_tbody_tr]:bg-white/5 dark:[&_tbody_tr]:bg-darkCard/60 [&_tbody_tr]:shadow-soft [&_tbody_tr:hover]:shadow-neo [&_tbody_tr]:transition">
                <thead className="text-lightText dark:text-darkText font-body">
                  <tr className="font-header text-[11px] uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
                    <th className="py-3 text-left whitespace-nowrap">Date</th>
                    <th className="text-left whitespace-nowrap">Batch Type</th>
                    <th className="text-right whitespace-nowrap">Quantity</th>
                    <th className="text-right whitespace-nowrap">Unit Cost</th>
                    <th className="text-right whitespace-nowrap">Total</th>
                    <th className="text-center whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feeds.map((item) => {
                    const quantity = getFeedQuantity(item);
                    const unitCost = Number(item.unitCost || 0);
                    const total = quantity * unitCost;
                    const type = item.batchType || item.type || "—";
                    const date = item.date || item.feedDate || item.createdAt;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => openDetails(item)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openDetails(item);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`View details for ${type}`}
                        className="border-b font-body dark:border-white/10 hover:bg-accent-primary/25 dark:hover:bg-white/5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                      >
                        <td className="text-left whitespace-nowrap">
                          {formatDate(date)}
                        </td>
                        <td className="text-left whitespace-nowrap">
                          {type}
                        </td>
                        <td className="text-right whitespace-nowrap">
                          {formatCount(quantity)} {data?.unit || ""}
                        </td>
                        <td className="text-right whitespace-nowrap">
                          {unitCost ? formatCurrency(unitCost) : "—"}
                        </td>
                        <td className="text-right whitespace-nowrap">
                          {total ? formatCurrency(total) : "—"}
                        </td>
                        <td className="text-center">
                          {canCreateOrEdit || canDeleteOrRestore ? (
                            <div className="flex gap-2 justify-center">
                              {canCreateOrEdit && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEdit(item);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-accent-primary"
                                  title="Edit feed record"
                                >
                                  <Edit className="w-6 h-6" />
                                  <span className="text-xs font-semibold">Edit</span>
                                </button>
                              )}
                              {canDeleteOrRestore && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    askDelete(item);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-status-danger"
                                  title="Delete feed record"
                                >
                                  <Trash2 className="w-6 h-6" />
                                  <span className="text-xs font-semibold">Delete</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">View only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <FeedSectionEmptyState
              icon={hasActiveFilters ? AlertTriangle : Wheat}
              title={listEmptyTitle}
              message={listEmptyMessage}
              actionLabel={
                hasActiveFilters
                  ? "Show everything"
                  : firstFeedCtaLabel
              }
              onAction={
                hasActiveFilters
                  ? clearFeedFilters
                  : canCreateOrEdit
                    ? openCreate
                    : undefined
              }
              className={hasFeedOverviewData ? "py-10 sm:py-14" : "py-12 sm:py-16"}
            />
          )}

          {hasFeedData && !listLoading && (
            <div className="sticky bottom-0 mt-4 w-full">
              <div className="flex items-center gap-4 justify-center sm:justify-end px-2 sm:px-0">
                <button
                  disabled={!meta.hasPrevious}
                  onClick={() => fetchFeeds(meta.page - 1)}
                  title="Previous page"
                  className="disabled:opacity-40 flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="font-semibold">Prev</span>
                </button>

                <span className="flex items-center whitespace-nowrap">
                  Page {meta.page + 1} / {meta.totalPages}
                </span>

                <button
                  disabled={!meta.hasNext}
                  onClick={() => fetchFeeds(meta.page + 1)}
                  title="Next page"
                  className="disabled:opacity-40 flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5"
                >
                  <span className="font-semibold">Next</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      <FeedFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        initialData={editing}
        onSuccess={(saved) => {
          setModalOpen(false);
          setEditing(null);
          const pendingOffline = isOfflinePendingRecord(saved);

          setFeeds((current) => {
            if (editing) {
              return current.map((record) => (record.id === saved.id ? saved : record));
            }
            return [saved, ...current];
          });

          setToast({
            message: pendingOffline
              ? "Feed record saved offline. It will sync automatically."
              : `Feed record ${editing ? "updated" : "created"} successfully`,
            type: pendingOffline ? "info" : "success",
          });
          if (!pendingOffline) {
            Promise.all([fetchFeeds(meta.page), fetchFeedSummary()]);
          }
        }}
      />

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onSubmit={handleExport}
        exporting={exporting}
        defaultCategory="feeds"
        defaultType="csv"
        defaultStart={filters.date || ""}
        defaultEnd={filters.date || ""}
      />

      <ItemDetailsModal
        open={Boolean(detailItem)}
        title="Feed Record"
        subtitle={detailItem?.id ? `Feed ID #${detailItem.id}` : undefined}
        status={detailItem ? getFeedStatus(detailItem) : undefined}
        fields={detailFields}
        onClose={closeDetails}
        onEdit={
          detailItem && canCreateOrEdit
            ? () => {
                closeDetails();
                openEdit(detailItem);
              }
            : undefined
        }
        onDelete={
          detailItem && canDeleteOrRestore
            ? () => {
                closeDetails();
                askDelete(detailItem);
              }
            : undefined
        }
      />

      <ConfirmModal
        open={confirmOpen}
        title="Delete Feed"
        message="Are you sure you want to delete this feed record?"
        confirmText="Delete"
        loading={deleting}
        onCancel={() => {
          setConfirmOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={() => confirmDelete(deleteTarget)}
      />

      <GlassToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />

      <TrashModal
        open={trashOpen}
        onClose={() => setTrashOpen(false)}
        title="Deleted Feeds"
        fetchData={async ({ page = 0, size = 10 }) => {
          const res = await getDeletedFeeds({ page, size });
          const items = (res.items || []).map((item) => ({
            ...item,
            itemName:
              item.itemName ??
              item.name ??
              item.batchType ??
              item.type ??
              "Feed",
          }));
          return { ...res, items };
        }}
        onRestore={async (item) => {
          await restoreFeed(item.id);
          await Promise.all([fetchFeeds(meta.page), fetchFeedSummary()]);
          setToast({
            message: "Feed record restored successfully",
            type: "success",
          });
        }}
        onPermanentDelete={async (item) => {
          try {
            await permanentDeleteFeed(item.id);
            await Promise.all([fetchFeeds(meta.page), fetchFeedSummary()]);
            setToast({
              message: `"${item.itemName}" deleted permanently`,
              type: "success",
            });
          } catch (err) {
            console.error("Permanent delete failed:", err);
            setToast({
              message: "Failed to delete permanently",
              type: "error",
            });
            throw err;
          }
        }}
        columns={[
          { key: "date", label: "Date" },
          { key: "batchType", label: "Batch Type" },
          { key: "quantity", label: "Quantity", align: "right" },
          { key: "unitCost", label: "Unit Cost", align: "right" },
        ]}
        formatCell={(item, key) => {
          if (key === "date") return formatDate(item.date || item.feedDate);
          if (key === "quantity")
            return `${formatCount(getFeedQuantity(item))} ${data?.unit || ""}`;
          if (key === "unitCost")
            return item.unitCost ? formatCurrency(item.unitCost) : "—";
          return item[key] ?? "—";
        }}
      />
    </DashboardLayout>
  );
}

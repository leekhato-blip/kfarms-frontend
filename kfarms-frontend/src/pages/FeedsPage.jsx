import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import SummaryCard from "../components/SummaryCard";
import FeedPie from "../components/FeedPie";
import FeedWatchlistPanel from "../components/FeedWatchlistPanel";
import FeedFormModal from "../components/FeedFormModal";
import ConfirmModal from "../components/ConfirmModal";
import GlassToast from "../components/GlassToast";
import TrashModal from "../components/TrashModal";
import ItemDetailsModal from "../components/ItemDetailsModal";
import ExportModal from "../components/ExportModal";
import {
  getFeedSummary,
  getAllFeeds,
  deleteFeed,
  restoreFeed,
  getDeletedFeeds,
} from "../services/feedService";
import { getFeedWatchlist } from "../services/dashboardService";
import { exportReport } from "../services/reportService";
import {
  Wheat,
  Scale,
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
} from "lucide-react";

const fallbackFeedData = {
  usedThisMonth: 0,
  stockByCategory: {
    starter: 5,
    grower: 22,
    finisher: 8,
    layer: 20,
    broiler: 0,
    fish: 0,
    other: 45,
  },
  topFeedsByUsage: [
    { label: "Layers Mash", value: 20 },
    { label: "Growers Mash", value: 15 },
    { label: "Floating Pellets", value: 12 },
    { label: "6mm aqua feed", value: 10 },
    { label: "6mm bluestock", value: 10 },
  ],
  totalQuantityUsed: 100,
  avgUnitCost: 0.0,
  monthlySpend: 0.0,
  reorderCount: 0,
  feedBreakdown: [
    { label: "others", value: 10 },
    { label: "Fish", value: 30 },
    { label: "others", value: 15 },
    { label: "others", value: 45 },
  ],
  recentFeedTransactions: [
    { date: "2025-12-06", quantity: 5, unitCost: null, id: 662, type: "OTHER" },
    { date: "2025-12-06", quantity: 5, unitCost: null, id: 661, type: "OTHER" },
    { date: "2025-12-06", quantity: 8, unitCost: null, id: 660, type: "DUCK" },
    { date: "2025-12-06", quantity: 7, unitCost: null, id: 659, type: "DUCK" },
    { date: "2025-12-06", quantity: 10, unitCost: null, id: 658, type: "FISH" },
    { date: "2025-12-06", quantity: 8, unitCost: null, id: 657, type: "FISH" },
  ],
  unit: "kg",
  countByType: {
    OTHER: 2,
    FISH: 3,
    DUCK: 2,
    LAYER: 3,
  },
  lowStockCount: 0,
  totalStockOnHand: 0,
  totalFeeds: 10,
  lastFeedDate: "2025-12-06 21:30:43",
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

export default function FeedsPage() {
  const [loading, setLoading] = useState(true);
  const [feedData, setFeedData] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [showHeaderSubtitle, setShowHeaderSubtitle] = useState(true);
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
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [trashOpen, setTrashOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowHeaderSubtitle(false);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getFeedSummary();
        const data = res?.data ?? res?.data?.data ?? res?.data?.summary ?? res?.data;
        setFeedData(data || fallbackFeedData);
      } catch (err) {
        console.error("Failed to fetch feed summary", err);
        setFeedData(fallbackFeedData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchFeeds = async (page = 0) => {
    setListLoading(true);
    try {
      const res = await getAllFeeds({
        page,
        size: 10,
        batchType: filters.batchType || undefined,
        date: filters.date || undefined,
      });

      setFeeds(res.items || res.content || []);
      setMeta({
        page: res.page ?? 0,
        totalPages: res.totalPages ?? 0,
        hasNext: res.hasNext ?? false,
        hasPrevious: res.hasPrevious ?? false,
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

  const refreshWatchlist = async () => {
    try {
      const data = await getFeedWatchlist();
      setWatchlist(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to refresh feed watchlist", err);
    }
  };

  useEffect(() => {
    refreshWatchlist();
  }, []);

  const data = feedData || fallbackFeedData;

  const stockByCategory = useMemo(() => {
    const entries = Object.entries(data?.stockByCategory || {});
    return entries
      .map(([label, value]) => ({ label, value: Number(value) || 0 }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

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

  const hasFeedBreakdown =
    Array.isArray(data?.feedBreakdown) && data.feedBreakdown.length > 0;

  const hasFeedData = feeds.length > 0;
  const hasActiveFilters = Boolean(filters.batchType || filters.date);
  const detailFields = detailItem
    ? (() => {
        const quantity = Number(detailItem.quantity || 0);
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
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
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
      fetchFeeds(meta.page);
    } catch (err) {
      console.error("Delete feed failed", err);
      setToast({ message: "Failed to delete feed record", type: "error" });
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="font-body animate-fadeIn space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-h2 font-semibold font-header">
              Feeds
            </h1>
            <div
              className={`overflow-hidden transition-all duration-500 ${
                showHeaderSubtitle ? "max-h-10 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
                Track feed inventory, usage, and cost trends at a glance.
              </p>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 sm:hidden mt-1">
              Last updated: {formatDate(data?.lastFeedDate)}
            </div>
          </div>

          <div className="flex flex-row gap-2 items-center justify-between w-full sm:w-auto">
            <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Last updated: {formatDate(data?.lastFeedDate)}
            </div>
            <button
              onClick={openCreate}
              className="w-auto justify-center flex items-center gap-2 bg-accent-primary text-darkText px-4 py-2 rounded-lg hover:bg-primary/30 transition font-body"
            >
              <Plus className="w-4 h-4 font-body" strokeWidth={2.5} />
              <span>New Feed</span>
            </button>
            <button
              onClick={() => setExportOpen(true)}
              disabled={exporting}
              className="ml-auto w-auto justify-center flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-darkText dark:hover:bg-white/20 transition font-medium disabled:opacity-50"
              title="Export feeds"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-body">
                {exporting ? "Exporting..." : "Export"}
              </span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, idx) => (
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
            : [
                {
                  title: "Total Feeds",
                  value: formatCount(data?.totalFeeds),
                  subtitle: "All feed items",
                  icon: <Wheat />,
                },
                {
                  title: "Stock on Hand",
                  value: `${formatCount(data?.totalStockOnHand)} ${data?.unit || ""}`.trim(),
                  subtitle: "Current inventory",
                  icon: <Package />,
                },
                {
                  title: "Used This Month",
                  value: `${formatCount(data?.usedThisMonth)} ${data?.unit || ""}`.trim(),
                  subtitle: "Month-to-date",
                  icon: <TrendingDown />,
                },
                {
                  title: "Total Used",
                  value: `${formatCount(data?.totalQuantityUsed)} ${data?.unit || ""}`.trim(),
                  subtitle: "All time usage",
                  icon: <Scale />,
                },
                {
                  title: "Monthly Spend",
                  value: formatCurrency(data?.monthlySpend),
                  subtitle: "Feed expenses",
                  icon: <Wallet />,
                },
                {
                  title: "Low Stock",
                  value: formatCount(data?.lowStockCount ?? data?.reorderCount),
                  subtitle: "Needs restock",
                  icon: <AlertTriangle />,
                },
              ].map((card) => (
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
              ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white dark:bg-darkCard shadow-neo dark:shadow-dark p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold font-header">
                  Feed Breakdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Share of feed usage by livestock category.
                </p>
              </div>
              <div className="text-xs text-slate-400">
                {hasFeedBreakdown ? "" : "No data yet"}
              </div>
            </div>
            {loading ? (
              <div className="skeleton-glass h-[260px] sm:h-[300px] rounded-xl" />
            ) : (
              <FeedPie breakdown={data?.feedBreakdown || []} />
            )}
          </div>

          <div className="bg-white dark:bg-darkCard shadow-neo dark:shadow-dark p-4 rounded-xl">
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
            ) : stockByCategory.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                No stock categories recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {stockByCategory.map((item) => {
                  const total = stockByCategory.reduce(
                    (sum, entry) => sum + entry.value,
                    0
                  );
                  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;

                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize text-slate-700 dark:text-slate-200">
                          {item.label}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {item.value} {data?.unit || ""}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-2 rounded-full bg-accent-primary"
                          style={{ width: `${pct}%` }}
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
          <div className="bg-white dark:bg-darkCard shadow-neo dark:shadow-dark p-4 rounded-xl">
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
            ) : topFeeds.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                No usage data available yet.
              </div>
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

          <div className="xl:col-span-2 bg-white dark:bg-darkCard shadow-neo dark:shadow-dark p-4 rounded-xl">
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
            ) : recentTransactions.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                No feed transactions recorded yet.
              </div>
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
                          {tx.type || "—"}
                        </td>
                        <td className="py-2 text-slate-700 dark:text-slate-200">
                          {formatCount(tx.quantity)} {data?.unit || ""}
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
            Filter feed records by batch type or date.
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

        {/* TABLE CARD */}
        <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 border border-white/10 dark:shadow-dark shadow-neo p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
              Detailed feed records with edit and delete actions.
            </p>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={() => setFilters({ batchType: "", date: "" })}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-accent-primary"
                >
                  Clear filters
                </button>
              )}
              <button
                onClick={() => setTrashOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition font-medium"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-body">Trash</span>
              </button>
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
                    const quantity = Number(item.quantity || 0);
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
                          <div className="flex gap-2 justify-center">
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
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              className="w-full flex items-center justify-center py-12 sm:py-16"
              role="status"
              aria-live="polite"
            >
              <div className="flex flex-col items-center text-center gap-3 w-full max-w-sm">
                <div
                  className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 shadow-sm"
                  aria-hidden="true"
                >
                  <Wheat className="w-9 h-9 text-emerald-600 dark:text-emerald-200" />
                </div>
                <h4 className="text-sm font-semibold font-header text-slate-700 dark:text-slate-100">
                  {hasActiveFilters
                    ? "No feed records match these filters"
                    : "No feed records yet"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {hasActiveFilters
                    ? "Clear the filters to view more results."
                    : "Record feed usage to see entries appear here."}
                </p>
                <button
                  className="mt-2 w-full sm:w-auto px-5 py-2 bg-accent-primary text-white rounded-lg transition hover:opacity-90 active:scale-[0.98]"
                  onClick={
                    hasActiveFilters
                      ? () => setFilters({ batchType: "", date: "" })
                      : openCreate
                  }
                >
                  {hasActiveFilters ? "Clear Filters" : "Record Feed"}
                </button>
              </div>
            </div>
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

        <FeedWatchlistPanel
          feeds={watchlist}
          onRefresh={refreshWatchlist}
          onRestock={() => {}}
        />
      </div>

      <FeedFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        initialData={editing}
        onSuccess={() => {
          setModalOpen(false);
          setEditing(null);
          setToast({
            message: `Feed record ${editing ? "updated" : "created"} successfully`,
            type: "success",
          });
          fetchFeeds(meta.page);
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
          detailItem
            ? () => {
                closeDetails();
                openEdit(detailItem);
              }
            : undefined
        }
        onDelete={
          detailItem
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
          fetchFeeds(meta.page);
          setToast({
            message: "Feed record restored successfully",
            type: "success",
          });
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
            return `${formatCount(item.quantity)} ${data?.unit || ""}`;
          if (key === "unitCost")
            return item.unitCost ? formatCurrency(item.unitCost) : "—";
          return item[key] ?? "—";
        }}
      />
    </DashboardLayout>
  );
}

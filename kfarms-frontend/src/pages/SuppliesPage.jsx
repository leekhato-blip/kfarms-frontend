import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import SuppliesFormModal from "../components/SuppliesFormModal";
import FarmerGuideCard from "../components/FarmerGuideCard";
import FilteredResultsHint from "../components/FilteredResultsHint";
import GlassToast from "../components/GlassToast";
import ConfirmModal from "../components/ConfirmModal";
import TrashModal from "../components/TrashModal";
import ItemDetailsModal from "../components/ItemDetailsModal";
import ExportModal from "../components/ExportModal";
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, Download, RefreshCw } from "lucide-react";

import {
  getAllSupplies,
  deleteSupply,
  getSuppliesSummary,
  getDeletedSupplies,
  restoreSupply,
  permanentDeleteSupply,
} from "../services/suppliesService";
import { exportReport } from "../services/reportService";
import { isOfflinePendingRecord } from "../offline/offlineResources";
import { useOfflineSyncRefresh } from "../offline/useOfflineSyncRefresh";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import SummaryCard from "../components/SummaryCard";
import { FileText, CalendarCheck, CalendarDays, Truck, Wallet } from "lucide-react";

/* -------------------- Chart.js setup -------------------- */
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const neonShadowPlugin = {
  id: "neonShadow",
  beforeDatasetsDraw(chart, args, options) {
    if (chart.config.type !== "line") return;
    const ctx = chart.ctx;
    ctx.save();
    ctx.shadowColor = options.colorFallback || "rgba(127,90,240,0.9)";
    ctx.shadowBlur = typeof options.blur === "number" ? options.blur : 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  },
  afterDatasetsDraw(chart) {
    if (chart.config.type !== "line") return;
    chart.ctx.restore();
  },
};
ChartJS.register(neonShadowPlugin);

export default function SuppliesPage() {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const updateTheme = () =>
      setIsDark(document.documentElement.classList.contains("dark"));

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const axisTextColor = isDark ? "#E5EDFF" : "#334155";
  const gridColor = isDark ? "rgba(127,90,240,0.08)" : "rgba(15,23,42,0.08)";

  const [items, setItems] = useState([]);
  const hasSuppliesData = items.length > 0;
  const [meta, setMeta] = useState({
    page: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    itemName: "",
    category: "",
    date: "",
  });
  const hasActiveFilters = Boolean(
    filters.itemName || filters.category || filters.date,
  );

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
  const tableRef = useRef(null);

  /* -------------------- SUMMARY -------------------- */
  const [summary, setSummary] = useState({
    records: 0,
    todaySpent: 0,
    monthSpent: 0,
    totalAmountSpent: 0,
  });
  const hasSummaryData = summary.records > 0;
  const detailFields = detailItem
    ? [
        { label: "Item", value: detailItem.itemName },
        { label: "Category", value: detailItem.category },
        { label: "Quantity", value: detailItem.quantity },
        { label: "Unit Price", value: formatNaira(detailItem.unitPrice) },
        {
          label: "Total",
          value: formatNaira(
            detailItem.totalPrice ??
              Number(detailItem.quantity || 0) *
                Number(detailItem.unitPrice || 0),
          ),
        },
        { label: "Supplier", value: detailItem.supplierName || "—" },
        { label: "Date", value: detailItem.supplyDate || "—" },
        { label: "Note", value: detailItem.note || "—", span: 2 },
      ]
    : [];

  const fetchSummary = useCallback(async () => {
    try {
      const res = await getSuppliesSummary();
      setSummary({
        records: res.totalSupplies ?? res.records ?? 0,
        todaySpent: res.spentToday ?? res.totalAmountSpentToday ?? 0,
        monthSpent: res.spentThisMonth ?? res.totalAmountSpentThisMonth ?? 0,
        totalAmountSpent: res.totalAmountSpent ?? res.totalCost ?? 0,
      });
    } catch (err) {
      console.error("Failed to fetch supplies summary", err);
    }
  }, []);

  /* -------------------- FETCH LIST -------------------- */
  const fetchSupplies = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      const res = await getAllSupplies({
        page,
        size: 10,
        itemName: filters.itemName || undefined,
        category: filters.category || undefined,
        date: filters.date || undefined,
      });

      setItems(res.items || []);
      setMeta({
        page: res.page ?? 0,
        totalPages: res.totalPages ?? 0,
        hasNext: res.hasNext ?? false,
        hasPrevious: res.hasPrevious ?? false,
      });
    } catch (err) {
      console.error("Failed to fetch supplies", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  function focusTable() {
    if (!tableRef.current) return;
    requestAnimationFrame(() => {
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handlePageChange(nextPage) {
    fetchSupplies(nextPage);
    focusTable();
  }

  useEffect(() => {
    fetchSupplies(0);
    fetchSummary();
  }, [fetchSupplies, fetchSummary]);

  const refreshPageData = useCallback(async () => {
    await Promise.all([fetchSupplies(meta.page ?? 0), fetchSummary()]);
  }, [fetchSupplies, fetchSummary, meta.page]);

  useOfflineSyncRefresh(refreshPageData);

  function clearFilters() {
    setFilters({ itemName: "", category: "", date: "" });
  }

  function formatNaira(value) {
    if (value === null || value === undefined || value === "") return "—";
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "—";
    return `₦${numeric.toLocaleString()}`;
  }

  function getSupplyStatus(item) {
    const delivered = Boolean(item?.supplyDate);
    return {
      label: delivered ? "Delivered" : "Pending",
      color: delivered ? "#22c55e" : "#f59e0b",
    };
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  async function handleExport({ type, category, start, end }) {
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
      link.download = filename || `${category || "supplies"}.${type || "csv"}`;
      link.click();
      window.URL.revokeObjectURL(url);
      setToast({ message: "Supplies export ready", type: "success" });
    } catch (error) {
      console.error("Export failed: ", error);
      setToast({ message: "Export failed", type: "error" });
    } finally {
      setExporting(false);
      setExportOpen(false);
    }
  }

  function openEdit(supply) {
    setEditing(supply);
    setModalOpen(true);
  }

  function openDetails(supply) {
    setDetailItem(supply);
  }

  function closeDetails() {
    setDetailItem(null);
  }

  function askDelete(supply) {
    setDeleteTarget(supply);
    setConfirmOpen(true);
  }

  async function confirmDelete(target) {
    if (!target?.id) {
      return;
    }

    try {
      setDeleting(true);

      // IMPORTANT: ensure it's a number if backend expects Long
      const id = typeof target.id === "string" ? Number(target.id) : target.id;

      await deleteSupply(id);

      // Optimistic UI remove
      setItems((prev) => prev.filter((i) => i.id !== target.id));

      await fetchSummary();
      await fetchSupplies(meta.page);

      setToast({
        message: `"${target.itemName}" deleted successfully`,
        type: "success",
      });
    } catch (err) {
      console.error("Delete failed:", err);
      setToast({ message: "Failed to delete supply", type: "error" });
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  }

  function formatDateLabel(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  }

  /* -------------------- CHART -------------------- */
  const chartData = useMemo(() => {
    const dateMap = {};
    items.forEach((i) => {
      const date = i.supplyDate ? String(i.supplyDate).slice(0, 10) : "Unknown";
      if (!dateMap[date]) dateMap[date] = 0;
      dateMap[date] += Number(i.totalPrice || 0);
    });

    const rawLabels = Object.keys(dateMap).sort();
    const data = rawLabels.map((d) => dateMap[d]);
    const labels = rawLabels.map(formatDateLabel);

    // Spending color theme (amber/orange) to feel “expenses”
    const lineColor = isDark ? "rgba(245, 158, 11, 1)" : "rgba(217, 119, 6, 1)";
    const fillColor = isDark
      ? "rgba(245, 158, 11, 0.14)"
      : "rgba(217, 119, 6, 0.10)";
    const pointBg = isDark ? "rgba(15, 23, 42, 1)" : "#fff";

    return {
      labels,
      datasets: [
        {
          label: "Spent (₦)",
          data,
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          borderColor: lineColor,
          backgroundColor: fillColor,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: pointBg,
          pointBorderColor: lineColor,
          pointBorderWidth: 2,
        },
      ],
    };
  }, [items, isDark]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      hover: { mode: "index", intersect: false },
      plugins: {
        neonShadow: { blur: 18, colorFallback: "rgba(245, 158, 11, 0.9)" },
        legend: { labels: { color: axisTextColor } },
        title: {
          display: true,
          text: "Supplies Spending Trend",
          color: isDark ? "#DDE6FF" : "#1e293b",
          font: { size: 16, weight: "600" },
        },
        tooltip: {
          displayColors: false,
          backgroundColor: isDark
            ? "rgba(15,23,42,0.95)"
            : "rgba(255,255,255,0.95)",
          borderColor: isDark
            ? "rgba(255,255,255,0.10)"
            : "rgba(15,23,42,0.10)",
          borderWidth: 1,
          titleColor: isDark ? "#E5EDFF" : "#0f172a",
          bodyColor: isDark ? "#E5EDFF" : "#0f172a",
          padding: 10,
          callbacks: {
            label: (ctx) => `₦${Number(ctx.raw ?? 0).toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: axisTextColor,
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10,
          },
          grid: { color: gridColor },
        },
        y: {
          ticks: {
            color: axisTextColor,
            callback: (val) => {
              if (typeof val === "number") {
                if (val >= 1_000_000)
                  return `₦${(val / 1_000_000).toFixed(1)}M`;
                if (val >= 1_000) return `₦${(val / 1_000).toFixed(0)}k`;
                return `₦${val}`;
              }
              return val;
            },
          },
          grid: { color: gridColor },
        },
      },
    }),
    [axisTextColor, gridColor, isDark],
  );

  const [trashOpen, setTrashOpen] = useState(false);

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([fetchSupplies(meta.page), fetchSummary()]);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="font-body space-y-8 animate-fadeIn">
        <div className="space-y-4">
          {/* HEADER */}
          <div className="relative isolate overflow-hidden rounded-2xl border border-sky-200/70 bg-slate-50/85 p-5 shadow-neo dark:border-sky-500/20 dark:bg-[#061024]/90 dark:shadow-[0_22px_40px_rgba(2,8,24,0.45)] md:p-6">
            <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(108deg,rgba(37,99,235,0.17)_0%,rgba(14,116,144,0.14)_48%,rgba(16,185,129,0.12)_100%),radial-gradient(circle_at_12%_22%,rgba(56,189,248,0.13),transparent_43%),radial-gradient(circle_at_90%_22%,rgba(16,185,129,0.14),transparent_38%)] dark:bg-[linear-gradient(108deg,rgba(6,19,43,0.96)_0%,rgba(7,32,63,0.9)_48%,rgba(6,58,55,0.84)_100%),radial-gradient(circle_at_12%_22%,rgba(56,189,248,0.16),transparent_43%),radial-gradient(circle_at_90%_22%,rgba(16,185,129,0.18),transparent_38%)]" />

            <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-accent-primary/35 bg-accent-primary/12 px-3 py-1 text-sm font-semibold text-accent-primary dark:border-blue-300/35 dark:bg-blue-500/20 dark:text-blue-100">
                  <Truck className="h-3.5 w-3.5" />
                  Purchase records
                </span>
                <h1 className="mt-3 text-3xl font-semibold font-header tracking-tight text-slate-900 dark:text-slate-50">
                  Supplies
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:text-base font-body">
                  Record what the farm bought, how much was spent, and which supplier it came from.
                </p>
              </div>

              <div className="grid w-full grid-cols-2 items-center gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-start lg:justify-end">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh supplies"
                  aria-label="Refresh supplies"
                  className={`order-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white/45 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 disabled:opacity-60 sm:order-none sm:w-auto dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20 ${
                    refreshing ? "cursor-not-allowed opacity-70" : ""
                  }`}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                <button
                  onClick={openCreate}
                  title="Record a new supply purchase"
                  className="order-1 col-span-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 sm:order-none sm:col-span-1 sm:w-auto"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  Record purchase
                </button>
                <button
                  onClick={() => setExportOpen(true)}
                  disabled={exporting}
                  className="order-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white/45 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 disabled:opacity-60 sm:order-none sm:w-auto dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20"
                  title="Download purchase report"
                >
                  <Download className="h-4 w-4" />
                  {exporting ? "Downloading..." : "Download"}
                </button>
              </div>
            </div>

            <div className="relative z-10 mt-3 text-left text-[11px] font-medium text-slate-600 dark:text-slate-200/80 sm:text-right">
              Live supply data
            </div>
          </div>

          <FarmerGuideCard
            icon={Truck}
            title="How to use supplies"
            description="This page is for simple purchase records and spending history."
            storageKey="supplies-guide"
            steps={[
              "Use \"Record purchase\" after buying feed, medicine, tools, or other farm inputs.",
              "Check the top cards first to see today's spending and monthly spending.",
              "Use the table below when you want to review or change an old purchase.",
            ]}
            tip="The top boxes show all purchases. The table below may show fewer rows when the find boxes are in use."
          />
        </div>

        {/* SUMMARY CARDS */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`supplies-summary-skeleton-${idx}`}
                className="rounded-2xl bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-5 lg:p-6"
                aria-hidden="true"
              >
                <div className="flex items-center gap-4">
                  <div className="skeleton-glass w-12 h-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton-glass h-4 w-24 rounded" />
                    <div className="skeleton-glass h-6 w-20 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <SummaryCard
              icon={<FileText />}
              title="Records"
              value={hasSummaryData ? summary.records : "—"}
              subtitle="All-time records"
            />
            <SummaryCard
              icon={<CalendarCheck />}
              title="Today Spent"
              value={
                hasSummaryData
                  ? `₦${Number(summary.todaySpent || 0).toLocaleString()}`
                  : "—"
              }
              subtitle="Today"
            />
            <SummaryCard
              icon={<CalendarDays />}
              title="This Month"
              value={
                hasSummaryData
                  ? `₦${Number(summary.monthSpent || 0).toLocaleString()}`
                  : "—"
              }
              subtitle="Month to date"
            />
            <SummaryCard
              icon={<Wallet />}
              title="Total Spent"
              value={
                hasSummaryData
                  ? `₦${Number(summary.totalAmountSpent || 0).toLocaleString()}`
                  : "—"
              }
              subtitle="All time"
            />
          </div>
        )}

        {/* CHART */}
        <div
          className="mt-4 rounded-xl bg-white/6 dark:bg-darkCard/60 p-4 dark:shadow-dark shadow-neo"
          style={{ minHeight: 260 }}
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-body">
            This chart uses the purchases that have been recorded on this page.
          </p>
          <div className="h-[220px] sm:h-[260px] md:h-[300px]">
            {loading ? (
              <div className="skeleton-glass w-full h-full rounded-xl" />
            ) : !hasSuppliesData ? (
              <div
                className="w-full h-full flex items-center justify-center p-4 font-body"
                role="status"
                aria-live="polite"
              >
                <div className="flex flex-col items-center text-center gap-3 w-full max-w-sm">
                  <div
                    className="flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 shadow-sm"
                    aria-hidden="true"
                  >
                    <Wallet className="w-9 h-9 text-amber-600 dark:text-amber-200" />
                  </div>
                  <h4 className="text-sm font-semibold font-header text-slate-700 dark:text-slate-100">
                    {hasActiveFilters
                      ? "No supplies match what you selected"
                      : "No supply purchases recorded yet"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {hasActiveFilters
                      ? "Show everything to see more results."
                      : "Record your first supply purchase to see the trend here."}
                  </p>
                  <button
                    className="mt-2 w-full sm:w-auto px-5 py-2 bg-accent-primary text-white rounded-lg transition hover:opacity-90 active:scale-[0.98]"
                    onClick={hasActiveFilters ? clearFilters : openCreate}
                  >
                    {hasActiveFilters ? "Show everything" : "Record Supply"}
                  </button>
                </div>
              </div>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* FILTERS */}
        <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 dark:shadow-dark shadow-neo p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-body">
            Use these find boxes only when you want to find one purchase or one day.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <input
            placeholder="Item name"
            title="Filter by item name"
            className="px-3 py-2 rounded-md bg-transparent border dark:border-white/10"
            value={filters.itemName}
            onChange={(e) =>
              setFilters({ ...filters, itemName: e.target.value })
            }
          />
          <select
            title="Filter by category"
            className="px-3 py-2 rounded-md bg-transparent bg-lightCard dark:bg-darkCard border dark:border-white/10"
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
          >
            <option value="">All Categories</option>
            <option value="FEED">Feed</option>
            <option value="LIVESTOCK">Poultry</option>
            <option value="FISH">Fish</option>
            <option value="MEDICINE">Medicine</option>
            <option value="EQUIPMENT">Equipment</option>
            <option value="OTHER">Other</option>
          </select>
          <input
            type="date"
            title="Filter by purchase date"
            className="px-3 py-2 rounded-md bg-transparent border border-white/10"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
          </div>
        </div>

        {!loading && (hasActiveFilters || (hasSummaryData && !hasSuppliesData)) ? (
          <FilteredResultsHint
            summaryLabel="purchase records"
            tableLabel="purchase table"
            hasFilters={hasActiveFilters}
            onClear={clearFilters}
          />
        ) : null}

        {/* TABLE CARD */}
        <div
          ref={tableRef}
          id="supplies-table"
          className="rounded-xl bg-white/10 dark:bg-darkCard/70 border border-white/10 dark:shadow-dark shadow-neo p-6"
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
              Each row below is one recorded purchase that you can review, edit, or delete.
            </p>
            <button
              onClick={() => setTrashOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition font-medium"
              title="View deleted supplies and restore items"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-body">Deleted purchases</span>
            </button>
          </div>
          {loading ? (
            <div className="overflow-x-auto">
              <div className="space-y-3" aria-hidden="true">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={`supplies-row-skeleton-${idx}`}
                    className="skeleton-glass h-10 rounded-md"
                  />
                ))}
              </div>
            </div>
          ) : hasSuppliesData ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[950px] border-separate border-spacing-y-2 [&_th]:px-4 [&_th]:pb-2 [&_td]:px-4 [&_td]:py-3 [&_td:first-child]:rounded-l-xl [&_td:last-child]:rounded-r-xl [&_tbody_tr]:bg-white/5 dark:[&_tbody_tr]:bg-darkCard/60 [&_tbody_tr]:shadow-soft [&_tbody_tr:hover]:shadow-neo [&_tbody_tr]:transition">
                <thead className="text-lightText dark:text-darkText font-body">
                  <tr className="font-header text-[11px] uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
                    <th className="py-3 text-left whitespace-nowrap">Item</th>
                    <th className="text-left whitespace-nowrap">Category</th>
                    <th className="text-right whitespace-nowrap">Qty</th>
                    <th className="text-right whitespace-nowrap">Unit</th>
                    <th className="text-right whitespace-nowrap">Total</th>
                    <th className="text-center whitespace-nowrap">Supplier</th>
                    <th className="text-left whitespace-nowrap">Date</th>
                    <th className="text-center whitespace-nowrap">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => openDetails(s)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openDetails(s);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View details for ${s.itemName}`}
                      className="border-b font-body dark:border-white/10 hover:bg-accent-primary/25 dark:hover:bg-white/5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                    >
                      <td className="py-3 text-left">{s.itemName}</td>
                      <td className="text-left">{s.category}</td>
                      <td className="text-right">{s.quantity}</td>
                      <td className="text-right">
                        ₦{Number(s.unitPrice || 0).toLocaleString()}
                      </td>
                      <td className="text-right whitespace-nowrap">
                        ₦{Number(s.totalPrice || 0).toLocaleString()}
                      </td>
                      <td className="text-center">{s.supplierName || "-"}</td>
                      <td className="text-left whitespace-nowrap">
                        {s.supplyDate}
                      </td>

                      <td className="flex gap-2 justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(s);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-accent-primary"
                          title="Edit supply"
                        >
                          <Edit className="w-6 h-6" />
                          <span className="text-xs font-semibold">Edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            askDelete(s);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-status-danger"
                          title="Move supply to trash"
                        >
                          <Trash2 className="w-6 h-6" />
                          <span className="text-xs font-semibold">Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              className="w-full flex items-center justify-center py-12 sm:py-16 font-body"
              role="status"
              aria-live="polite"
            >
              <div className="flex flex-col items-center text-center gap-3 w-full max-w-sm">
                <div
                  className="flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 shadow-sm"
                  aria-hidden="true"
                >
                  <FileText className="w-9 h-9 text-amber-600 dark:text-amber-200" />
                </div>
                <h4 className="text-sm font-semibold font-header text-slate-700 dark:text-slate-100">
                  {hasActiveFilters
                    ? "No supplies match what you selected"
                    : "No supply records yet"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {hasActiveFilters
                    ? "Show everything to see more results."
                    : "Record a supply purchase to see entries appear here."}
                </p>
                <button
                  className="mt-2 w-full sm:w-auto px-5 py-2 bg-accent-primary text-white rounded-lg transition hover:opacity-90 active:scale-[0.98]"
                  onClick={hasActiveFilters ? clearFilters : openCreate}
                >
                  {hasActiveFilters ? "Show everything" : "Record Supply"}
                </button>
              </div>
            </div>
          )}

          {/* PAGINATION */}
          {hasSuppliesData && !loading && (
            <div className="sticky bottom-0 mt-4 w-full">
              <div className="flex items-center gap-4 justify-center sm:justify-end px-2 sm:px-0">
                <button
                  disabled={!meta.hasPrevious}
                  onClick={() => handlePageChange(meta.page - 1)}
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
                  onClick={() => handlePageChange(meta.page + 1)}
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

        <SuppliesFormModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          initialData={editing}
          onSuccess={(supply) => {
            setModalOpen(false);
            setEditing(null);

            const pendingOffline = isOfflinePendingRecord(supply);

            setToast({
              message: pendingOffline
                ? `"${supply.itemName}" saved offline. It will sync automatically.`
                : `"${supply.itemName}" ${editing ? "updated" : "created"} successfully`,
              type: pendingOffline ? "info" : "success",
            });

            if (editing) {
              setItems((prev) =>
                prev.map((i) => (i.id === supply.id ? supply : i)),
              );
            } else {
              setItems((prev) => [supply, ...prev]);
            }

            if (!pendingOffline) {
              fetchSummary();
            }
          }}
        />

        <ItemDetailsModal
          open={Boolean(detailItem)}
          title={detailItem?.itemName || "Supply Details"}
          subtitle={
            detailItem?.id ? `Supply ID #${detailItem.id}` : "Supply Details"
          }
          status={detailItem ? getSupplyStatus(detailItem) : undefined}
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

        <ExportModal
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          onSubmit={handleExport}
          exporting={exporting}
          defaultCategory="supplies"
          defaultType="csv"
          defaultStart={filters.date || ""}
          defaultEnd={filters.date || ""}
        />
      </div>
      <TrashModal
        open={trashOpen}
        onClose={() => setTrashOpen(false)}
        title="Deleted Supplies"
        fetchData={({ page = 0, size = 10 }) =>
          getDeletedSupplies({ page, size })
        }
        onRestore={async (supply) => {
          await restoreSupply(supply.id);
          fetchSupplies(meta.page);
          fetchSummary();

          setToast({
            message: `"${supply.itemName}" restored successfully`,
            type: "success",
          });
        }}
        onPermanentDelete={async (supply) => {
          try {
            await permanentDeleteSupply(supply.id);

            fetchSupplies(meta.page);
            fetchSummary();

            setToast({
              message: `"${supply.itemName}" deleted permanently`,
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
          { key: "itemName", label: "Item" },
          { key: "category", label: "Category" },
          { key: "totalPrice", label: "Total", align: "right" },
          { key: "supplyDate", label: "Date" },
        ]}
        formatCell={(item, key) => {
          if (key === "totalPrice")
            return `₦${Number(item.totalPrice || 0).toLocaleString()}`;

          if (key === "supplyDate")
            return item.supplyDate
              ? new Date(item.supplyDate).toLocaleDateString("en-GB")
              : "-";

          return item[key];
        }}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Delete Supply"
        message={`Are you sure you want to delete "${deleteTarget?.itemName}"?`}
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
    </DashboardLayout>
  );
}

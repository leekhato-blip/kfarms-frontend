import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import SalesFormModal from "../components/SalesFormModal";
import FarmerGuideCard from "../components/FarmerGuideCard";
import FilteredResultsHint from "../components/FilteredResultsHint";
import GlassToast from "../components/GlassToast";
import ConfirmModal from "../components/ConfirmModal";
import TrashModal from "../components/TrashModal";
import ItemDetailsModal from "../components/ItemDetailsModal";
import ExportModal from "../components/ExportModal";
import MobileAccordionCard from "../components/MobileAccordionCard";
import { Plus } from "lucide-react";

import {
  getAllSales,
  deleteSale,
  getSalesSummary,
  getDeletedSales,
  restoreSale,
  permanentDeleteSale,
} from "../services/salesService";
import { exportReport } from "../services/reportService";
import useQuickCreateModal from "../hooks/useQuickCreateModal";
import { SALES_CATEGORY_OPTIONS } from "../constants/formOptions";

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
import { isOfflinePendingRecord } from "../offline/offlineResources";
import { useOfflineSyncRefresh } from "../offline/useOfflineSyncRefresh";
import useIsMobileViewport from "../hooks/useIsMobileViewport";
import {
  FileText,
  CalendarCheck,
  CalendarDays,
  Wallet,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
} from "lucide-react";

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

export default function SalesPage() {
  const isMobileViewport = useIsMobileViewport();
  // Detect if dark mode is active
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    updateTheme(); // run once on mount

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
  const hasSalesData = items.length > 0;
  const tableRef = useRef(null);

  function askDelete(sale) {
    setDeleteTarget(sale);
    setConfirmOpen(true);
  }

  /* Glass Toast */
  const [toast, setToast] = useState({
    message: "",
    type: "info",
  });

  /* -------------------- DASHBOARD SUMMARY -------------------- */
  const [summary, setSummary] = useState({
    records: 0,
    todaySales: 0,
    monthSales: 0,
    totalRevenue: 0,
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
        { label: "Buyer", value: detailItem.buyer || "—" },
        { label: "Date", value: detailItem.salesDate || "—" },
        { label: "Note", value: detailItem.note || "—", span: 2 },
      ]
    : [];

  const fetchSummary = useCallback(async () => {
    try {
      const res = await getSalesSummary();
      setSummary({
        records: res.totalSalesRecords ?? 0,
        todaySales: res.revenueToday ?? 0,
        monthSales: res.revenueThisMonth ?? 0,
        totalRevenue: res.totalRevenue ?? 0,
      });
    } catch (err) {
      console.error("Failed to fetch summary", err);
    }
  }, []);

  /* -------------------- FETCH SALES -------------------- */
  const fetchSales = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      const res = await getAllSales({
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
      console.error("Failed to fetch sales", err);
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
    fetchSales(nextPage);
    focusTable();
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
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `${category || "sales"}.${type || "csv"}`;
      link.click();
      window.URL.revokeObjectURL(url);
      setToast({ message: "Sales export ready", type: "success" });
    } catch (error) {
      console.error("Export failed: ", error);
      setToast({ message: "Export failed", type: "error" });
    } finally {
      setExporting(false);
      setExportOpen(false);
    }
  }

  /* -------------------- EFFECTS -------------------- */
  useEffect(() => {
    fetchSales(0);
    fetchSummary();
  }, [fetchSales, fetchSummary]);

  const refreshPageData = useCallback(async () => {
    await Promise.all([fetchSales(meta.page ?? 0), fetchSummary()]);
  }, [fetchSales, fetchSummary, meta.page]);

  useOfflineSyncRefresh(refreshPageData);

  function formatDateLabel(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }); // "12 Jan"
  }

  // function formatDateLabel(dateStr) {
  //   const d = new Date(dateStr);
  //   if (isNaN(d)) return dateStr;

  //   return d.toLocaleDateString("en-GB", {
  //     day: "2-digit",
  //     month: "short",
  //     year: "numeric",
  //   });
  // }

  /* -------------------- CHART -------------------- */
  const chartData = useMemo(() => {
    const dateMap = {};
    items.forEach((i) => {
      const date = i.salesDate ? String(i.salesDate).slice(0, 10) : "Unknown";
      if (!dateMap[date]) dateMap[date] = 0;
      dateMap[date] += Number(i.totalPrice || 0);
    });

    const rawLabels = Object.keys(dateMap).sort();
    const data = rawLabels.map((d) => dateMap[d]);
    const labels = rawLabels.map(formatDateLabel);

    const lineColor = isDark ? "rgba(16, 185, 129, 1)" : "rgba(4, 120, 87, 1)";
    const fillColor = isDark
      ? "rgba(16, 185, 129, 0.14)"
      : "rgba(4, 120, 87, 0.10)";
    const shadowColor = isDark
      ? "rgba(16, 185, 129, 0.40)"
      : "rgba(4, 120, 87, 0.22)";
    const pointBg = isDark ? "rgba(15, 23, 42, 1)" : "#fff";

    return {
      labels,
      datasets: [
        {
          label: "Revenue (₦)",
          data,
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          borderColor: lineColor,
          backgroundColor: fillColor,
          shadowColor: shadowColor,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: pointBg,
          pointBorderColor: lineColor,
          pointBorderWidth: 2,
        },
      ],
    };
  }, [isDark, items]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      hover: {
        mode: "index",
        intersect: false,
      },

      plugins: {
        neonShadow: {
          blur: 18,
          colorFallback: "rgba(64, 0, 255, 0.9)",
        },
        legend: {
          labels: {
            color: axisTextColor,
          },
        },
        title: {
          display: true,
          text: "Sales over time",
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
          grid: {
            color: gridColor,
          },
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
          grid: {
            color: gridColor,
          },
        },
      },
    }),
    [axisTextColor, gridColor, isDark],
  );

  const latestSale = items[0] || null;
  const mobileSalesSnapshot = [
    {
      label: "Records",
      value: hasSummaryData ? String(summary.records) : "—",
      tone: "text-slate-700 dark:text-slate-100",
    },
    {
      label: "Today",
      value: hasSummaryData ? formatNaira(summary.todaySales) : "—",
      tone: "text-emerald-600 dark:text-emerald-300",
    },
    {
      label: "This Month",
      value: hasSummaryData ? formatNaira(summary.monthSales) : "—",
      tone: "text-sky-600 dark:text-sky-300",
    },
    {
      label: "Latest Sale",
      value: latestSale ? formatNaira(latestSale.totalPrice) : "No sale",
      tone: "text-amber-600 dark:text-amber-300",
    },
  ];

  /* -------------------- CRUD -------------------- */
  function clearFilters() {
    setFilters({ itemName: "", category: "", date: "" });
  }

  function formatNaira(value) {
    if (value === null || value === undefined || value === "") return "—";
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "—";
    return `₦${numeric.toLocaleString()}`;
  }

  function getSaleStatus(item) {
    const completed = Boolean(item?.salesDate);
    return {
      label: completed ? "Completed" : "Pending",
      color: completed ? "#22c55e" : "#f59e0b",
    };
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  useQuickCreateModal(() => {
    openCreate();
  });

  function openEdit(sale) {
    setEditing(sale);
    setModalOpen(true);
  }

  function openDetails(sale) {
    setDetailItem(sale);
  }

  function closeDetails() {
    setDetailItem(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await deleteSale(deleteTarget.id);
      if (detailItem?.id === deleteTarget.id) {
        closeDetails();
      }

      fetchSales(meta.page);
      fetchSummary();

      setToast({
        message: `"${deleteTarget.itemName}" moved to trash successfully`,
        type: "success",
      });
    } catch {
      setToast({
        message: "Failed to delete sale",
        type: "error",
      });
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  }

  const [trashOpen, setTrashOpen] = useState(false);

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([fetchSales(meta.page), fetchSummary()]);
      setToast({ message: "Sales refreshed", type: "success" });
    } catch {
      setToast({ message: "Failed to refresh sales", type: "error" });
    } finally {
      setRefreshing(false);
    }
  }

  /* -------------------- JSX -------------------- */
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
                  <Wallet className="h-3.5 w-3.5" />
                  Sales records
                </span>
                <h1 className="mt-3 text-3xl font-semibold font-header tracking-tight text-slate-900 dark:text-slate-50">
                  Sales
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:text-base font-body">
                  Record what was sold, who bought it, and how much money came in.
                </p>
              </div>

              <div className="grid w-full grid-cols-2 items-center gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-start lg:justify-end">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh sales"
                  aria-label="Refresh sales"
                  className={`order-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white/45 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 disabled:opacity-60 sm:order-none sm:w-auto dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20 ${
                    refreshing ? "cursor-not-allowed opacity-70" : ""
                  }`}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                <button
                  onClick={openCreate}
                  title="Record a new sale"
                  className="order-1 col-span-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 sm:order-none sm:col-span-1 sm:w-auto"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  Record sale
                </button>
                <button
                  onClick={() => setExportOpen(true)}
                  disabled={exporting}
                  className="order-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white/45 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 disabled:opacity-60 sm:order-none sm:w-auto dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20"
                  title="Download sales report"
                >
                  <Download className="h-4 w-4" />
                  {exporting ? "Downloading..." : "Download"}
                </button>
              </div>
            </div>

            <div className="relative z-10 mt-3 text-left text-[11px] font-medium text-slate-600 dark:text-slate-200/80 sm:text-right">
              Live sales data
            </div>
          </div>

          <FarmerGuideCard
            icon={Wallet}
            title="How to use sales"
            description="This page is for simple record keeping after something has been sold."
            storageKey="sales-guide"
            steps={[
              "Use \"Record sale\" after a customer buys something.",
              "Check the top cards to see today's sales, this month, and total revenue.",
              "Use the table below when you want to review or change an old record.",
            ]}
            tip="The top boxes show all sales. The table below may show fewer rows when the find boxes are in use."
          />
        </div>

        {/* SUMMARY CARDS */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`sales-summary-skeleton-${idx}`}
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
              title="Today's Sales"
              value={
                hasSummaryData
                  ? `₦${summary.todaySales.toLocaleString()}`
                  : "—"
              }
              subtitle="Today"
            />
            <SummaryCard
              icon={<CalendarDays />}
              title="This Month"
              value={
                hasSummaryData
                  ? `₦${summary.monthSales.toLocaleString()}`
                  : "—"
              }
              subtitle="Month to date"
            />
            <SummaryCard
              icon={<Wallet />}
              title="Total Revenue"
              value={
                hasSummaryData
                  ? `₦${summary.totalRevenue.toLocaleString()}`
                  : "—"
              }
              subtitle="All time"
            />
          </div>
        )}

        {/* CHART */}
        {isMobileViewport ? (
          <div className="mt-4">
            <MobileAccordionCard
              title="Sales snapshot"
              description="Open this summary when you want a quick mobile view without loading the full chart."
              icon={<Wallet className="h-4 w-4" />}
            >
              <div className="rounded-xl bg-white/6 p-4 dark:bg-darkCard/60">
                {loading ? (
                  <>
                    <div className="skeleton-glass mb-3 h-3 w-40 rounded" />
                    <div className="grid grid-cols-2 gap-3">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <div
                          key={`mobile-sales-snapshot-skeleton-${idx}`}
                          className="skeleton-glass h-20 rounded-xl"
                        />
                      ))}
                    </div>
                  </>
                ) : hasSalesData ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {mobileSalesSnapshot.map((card) => (
                        <div
                          key={card.label}
                          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 dark:bg-white/[0.03]"
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            {card.label}
                          </p>
                          <p className={`mt-2 text-sm font-semibold ${card.tone}`}>
                            {card.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    {latestSale ? (
                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        Latest entry: {latestSale.itemName} on {latestSale.salesDate || "—"}.
                      </p>
                    ) : null}
                  </>
                ) : (
                  <div
                    className="flex min-h-[180px] w-full items-center justify-center p-4 font-body"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
                      <div
                        className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 shadow-sm dark:bg-emerald-900/30"
                        aria-hidden="true"
                      >
                        <Wallet className="h-9 w-9 text-emerald-600 dark:text-emerald-200" />
                      </div>
                      <h4 className="text-sm font-semibold font-header text-slate-700 dark:text-slate-100">
                        {hasActiveFilters
                          ? "No sales match what you selected"
                          : "No sales recorded yet"}
                      </h4>
                      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {hasActiveFilters
                          ? "Show everything to see more results."
                          : "Record your first sale to see the mobile summary here."}
                      </p>
                      <button
                        className="mt-2 w-full rounded-lg bg-accent-primary px-5 py-2 text-white transition hover:opacity-90 active:scale-[0.98]"
                        onClick={hasActiveFilters ? clearFilters : openCreate}
                      >
                        {hasActiveFilters ? "Show everything" : "Record Sale"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </MobileAccordionCard>
          </div>
        ) : (

          <div className="mt-4">
          {loading ? (
            <div className="rounded-xl bg-white/6 p-4 shadow-neo dark:bg-darkCard/60 dark:shadow-dark">
              <div className="skeleton-glass mb-3 h-3 w-56 rounded" />
              <div className="skeleton-glass h-[220px] w-full rounded-xl sm:h-[260px] md:h-[300px]" />
            </div>
          ) : (
            <div
              className="rounded-xl bg-white/6 p-4 shadow-neo dark:bg-darkCard/60 dark:shadow-dark"
              style={{ minHeight: 260 }}
            >
              <p className="mb-3 text-xs text-slate-500 dark:text-slate-400 font-body">
                This chart uses the sales that have been recorded on this page.
              </p>
              <div className="h-[220px] sm:h-[260px] md:h-[300px]">
                {hasSalesData ? (
                  isDark !== null && <Line data={chartData} options={chartOptions} />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center p-4 font-body"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
                      <div
                        className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 shadow-sm dark:bg-emerald-900/30"
                        aria-hidden="true"
                      >
                        <Wallet className="h-9 w-9 text-emerald-600 dark:text-emerald-200" />
                      </div>
                      <h4 className="text-sm font-semibold font-header text-slate-700 dark:text-slate-100">
                        {hasActiveFilters
                          ? "No sales match what you selected"
                          : "No sales recorded yet"}
                      </h4>
                      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {hasActiveFilters
                          ? "Show everything to see more results."
                          : "Record your first sale to see the revenue trend here."}
                      </p>
                      <button
                        className="mt-2 w-full rounded-lg bg-accent-primary px-5 py-2 text-white transition hover:opacity-90 active:scale-[0.98] sm:w-auto"
                        onClick={hasActiveFilters ? clearFilters : openCreate}
                      >
                        {hasActiveFilters ? "Show everything" : "Record Sale"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        )}

        {/* FILTERS */}
        {loading ? (
          <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 dark:shadow-dark shadow-neo p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 flex-wrap gap-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={`sales-filter-skeleton-${idx}`}
                className="skeleton-glass h-10 rounded-md"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 dark:shadow-dark shadow-neo p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-body">
              Use these find boxes only when you want to find one sale or one day.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 flex-wrap gap-4">
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
              {SALES_CATEGORY_OPTIONS.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              title="Filter by sale date"
              className="px-3 py-2 rounded-md bg-transparent border border-white/10"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
            </div>
          </div>
        )}

        {!loading && (hasActiveFilters || (hasSummaryData && !hasSalesData)) ? (
          <FilteredResultsHint
            summaryLabel="sales records"
            tableLabel="sales table"
            hasFilters={hasActiveFilters}
            onClear={clearFilters}
          />
        ) : null}

        {/* TABLE CARD */}
        {loading ? (
          <div
            ref={tableRef}
            id="sales-table"
            className="rounded-xl bg-white/10 dark:bg-darkCard/70 border border-white/10 dark:shadow-dark shadow-neo p-6"
          >
            <div className="skeleton-glass h-3 w-64 rounded mb-4" />
            <div className="space-y-3" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={`sales-row-skeleton-${idx}`}
                  className="skeleton-glass h-10 rounded-md"
                />
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3 justify-center sm:justify-end">
              <div className="skeleton-glass h-8 w-20 rounded" />
              <div className="skeleton-glass h-6 w-24 rounded" />
              <div className="skeleton-glass h-8 w-20 rounded" />
            </div>
          </div>
        ) : (
          <div
            ref={tableRef}
            id="sales-table"
            className="rounded-xl bg-white/10 dark:bg-darkCard/70 border border-white/10 dark:shadow-dark shadow-neo p-6"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
                Each row below is one recorded sale that you can review, edit, or delete.
              </p>
              <button
                onClick={() => setTrashOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition font-medium"
                title="View deleted sales and restore items"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-body">Deleted sales</span>
              </button>
            </div>
            {hasSalesData ? (
              <>
                {isMobileViewport ? (
                  <div className="space-y-3">
                    {items.map((sale) => (
                      <article
                        key={sale.id}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 dark:bg-white/[0.03]"
                      >
                        <button
                          type="button"
                          onClick={() => openDetails(sale)}
                          className="w-full text-left"
                          aria-label={`View details for ${sale.itemName}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {sale.itemName}
                              </div>
                              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {sale.category} • {sale.salesDate || "No date"}
                              </div>
                            </div>
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                              {formatNaira(sale.totalPrice)}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <div>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                Qty:
                              </span>{" "}
                              {sale.quantity}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                Unit:
                              </span>{" "}
                              {formatNaira(sale.unitPrice)}
                            </div>
                            <div className="col-span-2">
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                Buyer:
                              </span>{" "}
                              {sale.buyer || "—"}
                            </div>
                          </div>
                        </button>

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(sale)}
                            title="Edit sale"
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-accent-primary/25 bg-accent-primary/10 px-3 py-2 text-xs font-semibold text-accent-primary"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => askDelete(sale)}
                            title="Move sale to trash"
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[900px] border-separate border-spacing-y-2 [&_th]:px-4 [&_th]:pb-2 [&_td]:px-4 [&_td]:py-3 [&_td:first-child]:rounded-l-xl [&_td:last-child]:rounded-r-xl [&_tbody_tr]:bg-white/5 dark:[&_tbody_tr]:bg-darkCard/60 [&_tbody_tr]:shadow-soft [&_tbody_tr:hover]:shadow-neo [&_tbody_tr]:transition">
                      <thead className="text-lightText dark:text-darkText font-body">
                        <tr className="font-header text-[11px] uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
                          <th className="py-3 text-left whitespace-nowrap">Item</th>
                          <th className="text-left whitespace-nowrap">Category</th>
                          <th className="text-right whitespace-nowrap">Qty</th>
                          <th className="text-right whitespace-nowrap">Unit</th>
                          <th className="text-right whitespace-nowrap">Total</th>
                          <th className="text-center whitespace-nowrap">Buyer</th>
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
                            <td className="text-center">{s.buyer}</td>
                            <td className="text-left whitespace-nowrap">
                              {s.salesDate}
                            </td>
                            <td className="flex gap-2 justify-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(s);
                                }}
                                title="Edit sale"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-accent-primary"
                              >
                                <Edit className="w-6 h-6" />
                                <span className="text-xs font-semibold">Edit</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  askDelete(s);
                                }}
                                title="Move sale to trash"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-status-danger"
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
                )}

                {/* PAGINATION (STATIC & CENTERED ON MOBILE) */}
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
              </>
            ) : (
              <div
                className="w-full flex items-center justify-center py-12 sm:py-16 font-body"
                role="status"
                aria-live="polite"
              >
                <div className="flex flex-col items-center text-center gap-3 w-full max-w-sm">
                  <div
                    className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 shadow-sm"
                    aria-hidden="true"
                  >
                    <FileText className="w-9 h-9 text-emerald-600 dark:text-emerald-200" />
                  </div>
                  <h4 className="text-sm font-semibold font-header text-slate-700 dark:text-slate-100">
                    {hasActiveFilters
                      ? "No sales match what you selected"
                      : "No sales records yet"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {hasActiveFilters
                      ? "Show everything to see more results."
                      : "Record a sale to see entries appear in this table."}
                  </p>
                  <button
                    className="mt-2 w-full sm:w-auto px-5 py-2 bg-accent-primary text-white rounded-lg transition hover:opacity-90 active:scale-[0.98]"
                    onClick={hasActiveFilters ? clearFilters : openCreate}
                  >
                    {hasActiveFilters ? "Show everything" : "Record Sale"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <SalesFormModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          initialData={editing}
          onSuccess={(sale) => {
            // Close modal
            setModalOpen(false);
            setEditing(null);

            const pendingOffline = isOfflinePendingRecord(sale);

            // Toast
            setToast({
              message: pendingOffline
                ? `"${sale.itemName}" saved offline. It will sync automatically.`
                : `"${sale.itemName}" ${editing ? "updated" : "created"} successfully`,
              type: pendingOffline ? "info" : "success",
              actionLabel: pendingOffline ? "" : "View item",
              onAction: pendingOffline ? undefined : () => openDetails(sale),
              duration: pendingOffline ? 3000 : 5200,
            });

            if (editing) {
              // Update existing sale in items
              setItems((prev) =>
                prev.map((i) => (i.id === sale.id ? sale : i)),
              );
            } else {
              // Append new sale to top
              setItems((prev) => [sale, ...prev]);
            }

            if (!pendingOffline) {
              fetchSummary();
            }
          }}
        />

        <ItemDetailsModal
          open={Boolean(detailItem)}
          title={detailItem?.itemName || "Sale Details"}
          subtitle={detailItem?.id ? `Sale ID #${detailItem.id}` : "Sale Details"}
          status={detailItem ? getSaleStatus(detailItem) : undefined}
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
          defaultCategory="sales"
          defaultType="csv"
          defaultStart={filters.date || ""}
          defaultEnd={filters.date || ""}
        />
      </div>
      <ConfirmModal
        open={confirmOpen}
        title="Delete Sale"
        message={`Are you sure you want to delete "${deleteTarget?.itemName}"?`}
        confirmText="Delete"
        loading={deleting}
        onCancel={() => {
          setConfirmOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
      />
      <GlassToast
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        actionLabel={toast.actionLabel}
        onAction={toast.onAction}
        onClose={() => setToast({ message: "", type: "info" })}
      />
      <TrashModal
        open={trashOpen}
        onClose={() => setTrashOpen(false)}
        title="Deleted Sales"
        fetchData={({ page = 0, size = 10 }) => getDeletedSales({ page, size })}
        onRestore={async (sale) => {
          await restoreSale(sale.id);
          fetchSales(meta.page);
          fetchSummary();

          setToast({
            message: `"${sale.itemName}" restored successfully`,
            type: "success",
          });
        }}
        onPermanentDelete={async (sale) => {
          try {
            await permanentDeleteSale(sale.id);

            // refresh main list + summary
            fetchSales(meta.page);
            fetchSummary();

            setToast({
              message: `"${sale.itemName}" deleted permanently`,
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
          { key: "salesDate", label: "Date" },
        ]}
        formatCell={(item, key) => {
          if (key === "totalPrice")
            return `₦${Number(item.totalPrice || 0).toLocaleString()}`;

          if (key === "salesDate")
            return item.salesDate
              ? new Date(item.salesDate).toLocaleDateString("en-GB")
              : "-";

          return item[key];
        }}
      />
    </DashboardLayout>
  );
}

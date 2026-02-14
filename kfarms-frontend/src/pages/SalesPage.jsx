import React, { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import SalesFormModal from "../components/SalesFormModal";
import GlassToast from "../components/GlassToast";
import ConfirmModal from "../components/ConfirmModal";
import TrashModal from "../components/TrashModal";
import ItemDetailsModal from "../components/ItemDetailsModal";
import ExportModal from "../components/ExportModal";
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
  // Detect if dark mode is active
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [showHeaderTooltips, setShowHeaderTooltips] = useState(true);
  const [showHeaderSubtitle, setShowHeaderSubtitle] = useState(true);

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowHeaderSubtitle(false);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setShowHeaderTooltips(true);
      return;
    }
    const timer = setTimeout(() => setShowHeaderTooltips(false), 4000);
    return () => clearTimeout(timer);
  }, [isMobile]);

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

  async function fetchSummary() {
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
  }

  /* -------------------- FETCH SALES -------------------- */
  async function fetchSales(page = 0) {
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
  }

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
      const url = window.URL.createObjectURL(new Blob([blob]));
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
  }, [filters]);

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
  }, [items]);

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
          text: "Sales Revenue Trend",
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
    [items, isDark],
  );

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

      fetchSales(meta.page);
      fetchSummary();

      setToast({
        message: `"${deleteTarget.itemName}" moved to trash successfully`,
        type: "success",
      });
    } catch (err) {
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

  /* -------------------- JSX -------------------- */
  return (
    <DashboardLayout>
      <div className="font-body space-y-8 animate-fadeIn">
        {/* HEADER */}
        <div className="animate-fadeIn flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-h2 font-semibold font-header">
              Sales
            </h1>
            <div
              className={`overflow-hidden transition-all duration-500 ${
                showHeaderSubtitle ? "max-h-10 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
                Track sales records, revenue, and trends over time.
              </p>
            </div>
          </div>

          {/* ACTIONS (right aligned) */}
          <div className="flex flex-row gap-2 items-center w-full sm:justify-end sm:w-auto">
            <button
              onClick={openCreate}
              title={showHeaderTooltips ? "Record a new sale" : undefined}
              className="w-auto justify-center flex items-center gap-2 bg-accent-primary text-darkText px-4 py-2 rounded-lg hover:bg-primary/30 transition font-body"
            >
              <Plus className="w-4 h-4 font-body" strokeWidth={2.5} />
              <span>New Sale</span>
            </button>
            <button
              onClick={() => setExportOpen(true)}
              disabled={exporting}
              className="ml-auto w-auto justify-center flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-darkText dark:hover:bg-white/20 transition font-medium disabled:opacity-50"
              title="Export sales"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-body">
                {exporting ? "Exporting..." : "Export"}
              </span>
            </button>
          </div>
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
        {loading ? (
          <div className="mt-4 rounded-xl bg-white/6 dark:bg-darkCard/60 p-4 dark:shadow-dark shadow-neo">
            <div className="skeleton-glass h-3 w-56 rounded mb-3" />
            <div className="skeleton-glass w-full h-[220px] sm:h-[260px] md:h-[300px] rounded-xl" />
          </div>
        ) : (
          <div
            className="mt-4 rounded-xl bg-white/6 dark:bg-darkCard/60  p-4 dark:shadow-dark shadow-neo"
            style={{ minHeight: 260 }}
          >
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-body">
              Revenue trend based on recorded sales entries.
            </p>
            <div className="h-[220px] sm:h-[260px] md:h-[300px]">
              {hasSalesData ? (
                isDark !== null && <Line data={chartData} options={chartOptions} />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center p-4 font-body"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex flex-col items-center text-center gap-3 w-full max-w-sm">
                    <div
                      className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 shadow-sm"
                      aria-hidden="true"
                    >
                      <Wallet className="w-9 h-9 text-emerald-600 dark:text-emerald-200" />
                    </div>
                    <h4 className="text-sm font-semibold font-header text-slate-700 dark:text-slate-100">
                      {hasActiveFilters
                        ? "No sales match these filters"
                        : "No sales recorded yet"}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {hasActiveFilters
                        ? "Clear the filters to view more results."
                        : "Record your first sale to see the revenue trend here."}
                    </p>
                    <button
                      className="mt-2 w-full sm:w-auto px-5 py-2 bg-accent-primary text-white rounded-lg transition hover:opacity-90 active:scale-[0.98]"
                      onClick={hasActiveFilters ? clearFilters : openCreate}
                    >
                      {hasActiveFilters ? "Clear Filters" : "Record Sale"}
                    </button>
                  </div>
                </div>
              )}
            </div>
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
              Use filters to narrow sales by item, category, or date.
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
              <option value="LAYER">Layer</option>
              <option value="FISH">Fish</option>
              <option value="LIVESTOCK">Livestock</option>
              <option value="OTHER">Other</option>
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
                Detailed sales records with edit and delete actions.
              </p>
              <button
                onClick={() => setTrashOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition font-medium"
                title={
                  showHeaderTooltips
                    ? "View deleted sales and restore items"
                    : undefined
                }
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-body">Trash</span>
              </button>
            </div>
            {hasSalesData ? (
              <>
                {/* TABLE (scrollable only) */}
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
                      ? "No sales match these filters"
                      : "No sales records yet"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {hasActiveFilters
                      ? "Clear the filters to view more results."
                      : "Record a sale to see entries appear in this table."}
                  </p>
                  <button
                    className="mt-2 w-full sm:w-auto px-5 py-2 bg-accent-primary text-white rounded-lg transition hover:opacity-90 active:scale-[0.98]"
                    onClick={hasActiveFilters ? clearFilters : openCreate}
                  >
                    {hasActiveFilters ? "Clear Filters" : "Record Sale"}
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

            // Toast
            setToast({
              message: `"${sale.itemName}" ${
                editing ? "updated" : "created"
              } successfully`,
              type: "success",
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

            // Refresh summary only
            fetchSummary();
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

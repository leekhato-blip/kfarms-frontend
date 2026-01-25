import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import SuppliesFormModal from "../components/SuppliesFormModal";
import GlassToast from "../components/GlassToast";
import ConfirmModal from "../components/ConfirmModal";
import TrashModal from "../components/TrashModal";
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

import {
  getAllSupplies,
  deleteSupply,
  getSuppliesSummary,
  getDeletedSupplies,
  restoreSupply,
  permanentDeleteSupply,
} from "../services/suppliesService";

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
import { FileText, CalendarCheck, CalendarDays, Wallet } from "lucide-react";

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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [showHeaderTooltips, setShowHeaderTooltips] = useState(true);

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

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState({ message: "", type: "info" });

  /* -------------------- SUMMARY -------------------- */
  const [summary, setSummary] = useState({
    records: 0,
    todaySpent: 0,
    monthSpent: 0,
    totalAmountSpent: 0,
  });
  const hasSummaryData = summary.records > 0;

  async function fetchSummary() {
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
  }

  /* -------------------- FETCH LIST -------------------- */
  async function fetchSupplies(page = 0) {
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
  }

  useEffect(() => {
    fetchSupplies(0);
    fetchSummary();
  }, [filters]);

  function clearFilters() {
    setFilters({ itemName: "", category: "", date: "" });
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(supply) {
    setEditing(supply);
    setModalOpen(true);
  }

  function askDelete(supply) {
    setDeleteTarget(supply);
    setConfirmOpen(true);
  }

  async function confirmDelete(target) {
    if (!target?.id) {
      console.log("No target passed to confirmDelete:", target);
      return;
    }

    console.log("Deleting supply:", target);

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

  return (
    <DashboardLayout>
      <div className="font-body space-y-8 animate-fadeIn">
        {/* HEADER */}
        <div className="animate-fadeIn flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-h2 font-semibold font-header">
              Supplies
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
              Track expenses, inventory inputs, and supplier activity.
            </p>
          </div>

          {/* ACTIONS (right aligned) */}
          <div
            className="
                     flex flex-col gap-2 w-[130px]
                     sm:flex-row sm:items-center sm:justify-end sm:w-auto
                   "
          >
            <button
              onClick={openCreate}
              title={
                showHeaderTooltips
                  ? "Record a new supply purchase"
                  : undefined
              }
              className="flex items-center gap-2 bg-accent-primary text-darkText 
                px-4 py-2 rounded-lg hover:bg-primary/30 transition font-body"
            >
              <Plus className="w-4 h-4 font-body" strokeWidth={2.5} />
              <span>New Supply</span>
            </button>

            <button
              onClick={() => setTrashOpen(true)}
              className="
                     flex items-center gap-2 
                     px-4 py-2 rounded-lg
                     bg-red-500/10 text-red-400
                     hover:bg-red-500/20 hover:text-red-300
                     transition
                     font-medium
                   "
              title={
                showHeaderTooltips
                  ? "View deleted supplies and restore items"
                  : undefined
              }
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-md font-body">Trash</span>
            </button>
          </div>
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
            />
            <SummaryCard
              icon={<CalendarCheck />}
              title="Today Spent"
              value={
                hasSummaryData
                  ? `₦${Number(summary.todaySpent || 0).toLocaleString()}`
                  : "—"
              }
            />
            <SummaryCard
              icon={<CalendarDays />}
              title="This Month"
              value={
                hasSummaryData
                  ? `₦${Number(summary.monthSpent || 0).toLocaleString()}`
                  : "—"
              }
            />
            <SummaryCard
              icon={<Wallet />}
              title="Total Spent"
              value={
                hasSummaryData
                  ? `₦${Number(summary.totalAmountSpent || 0).toLocaleString()}`
                  : "—"
              }
            />
          </div>
        )}

        {/* CHART */}
        <div
          className="mt-4 rounded-xl bg-white/6 dark:bg-darkCard/60 p-4 dark:shadow-dark shadow-neo"
          style={{ minHeight: 260 }}
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-body">
            Spend trend based on recorded supply purchases.
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
                      ? "No supplies match these filters"
                      : "No supply purchases recorded yet"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {hasActiveFilters
                      ? "Clear the filters to view more results."
                      : "Record your first supply purchase to see the trend here."}
                  </p>
                  <button
                    className="mt-2 w-full sm:w-auto px-5 py-2 bg-accent-primary text-white rounded-lg transition hover:opacity-90 active:scale-[0.98]"
                    onClick={hasActiveFilters ? clearFilters : openCreate}
                  >
                    {hasActiveFilters ? "Clear Filters" : "Record Supply"}
                  </button>
                </div>
              </div>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* FILTERS */}
        <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 dark:shadow-dark shadow-neo p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
            <option value="LIVESTOCK">Livestock</option>
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

        {/* TABLE CARD */}
        <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 border border-white/10 dark:shadow-dark shadow-neo p-6">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-body">
            Detailed supply records with edit and delete actions.
          </p>
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
              <table className="w-full text-sm min-w-[950px]">
                <thead className="text-lightText dark:text-darkText font-body border-b border-white/10">
                  <tr className="font-header">
                    <th className="py-3 text-left whitespace-nowrap">Item</th>
                    <th className="text-left whitespace-nowrap">Category</th>
                    <th className="text-right whitespace-nowrap">Qty</th>
                    <th className="text-right whitespace-nowrap">Unit</th>
                    <th className="text-right whitespace-nowrap">Total</th>
                    <th className="text-center whitespace-nowrap">Supplier</th>
                    <th className="text-left whitespace-nowrap">Date</th>
                    <th className="w-20" />
                  </tr>
                </thead>

                <tbody>
                  {items.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b font-body dark:border-white/10 hover:bg-accent-primary/25 dark:hover:bg-white/5"
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
                          onClick={() => openEdit(s)}
                          className="p-2 rounded-md hover:bg-white/5 text-accent-primary"
                          title="Edit supply"
                        >
                          <Edit className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => askDelete(s)}
                          className="p-2 rounded-md hover:bg-white/5 text-status-danger"
                          title="Move supply to trash"
                        >
                          <Trash2 className="w-6 h-6" />
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
                    ? "No supplies match these filters"
                    : "No supply records yet"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {hasActiveFilters
                    ? "Clear the filters to view more results."
                    : "Record a supply purchase to see entries appear here."}
                </p>
                <button
                  className="mt-2 w-full sm:w-auto px-5 py-2 bg-accent-primary text-white rounded-lg transition hover:opacity-90 active:scale-[0.98]"
                  onClick={hasActiveFilters ? clearFilters : openCreate}
                >
                  {hasActiveFilters ? "Clear Filters" : "Record Supply"}
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
                  onClick={() => fetchSupplies(meta.page - 1)}
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
                  onClick={() => fetchSupplies(meta.page + 1)}
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

            setToast({
              message: `"${supply.itemName}" ${editing ? "updated" : "created"} successfully`,
              type: "success",
            });

            if (editing) {
              setItems((prev) =>
                prev.map((i) => (i.id === supply.id ? supply : i)),
              );
            } else {
              setItems((prev) => [supply, ...prev]);
            }

            fetchSummary();
          }}
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

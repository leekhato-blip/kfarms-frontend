import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

import DashboardLayout from "../layouts/DashboardLayout";
import GlassToast from "../components/GlassToast";
import ConfirmModal from "../components/ConfirmModal";
import TrashModal from "../components/TrashModal";
import LivestockFormModal from "../components/LivestockFormModal";
import ItemDetailsModal from "../components/ItemDetailsModal";
import ExportModal from "../components/ExportModal";
import {
  getLivestock,
  deleteLivestock,
  getLivestockSummary,
  getLivestockOverview,
  getDeletedLivestock,
  restoreLivestock,
  permanentDeleteLivestock,
} from "../services/livestockService";
import { exportReport } from "../services/reportService";
import {
  Plus,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Feather,
  Calendar,
  AlertTriangle,
  Search,
  ShieldCheck,
  Download,
} from "lucide-react";

const livestockTypes = [
  "LAYER",
  "DUCK",
  "FOWL",
  "TURKEY",
  "NOILER",
  "BROILER",
  "OTHER",
];

const typeLabels = {
  LAYER: "Layer",
  DUCK: "Duck",
  FOWL: "Fowl",
  TURKEY: "Turkey",
  NOILER: "Noiler",
  BROILER: "Broiler",
  OTHER: "Other",
};

export default function LivestockPage() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [meta, setMeta] = useState({
    page: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [filters, setFilters] = useState({
    batchName: "",
    type: "",
    arrivalDate: "",
  });
  const hasActiveFilters = Boolean(
    filters.batchName || filters.type || filters.arrivalDate,
  );
  const activeFilterCount = [filters.batchName, filters.type, filters.arrivalDate]
    .filter(Boolean).length;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [trashOpen, setTrashOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [showHeaderSubtitle, setShowHeaderSubtitle] = useState(true);
  const [showAllMobileGroups, setShowAllMobileGroups] = useState(false);
  const [showAllActiveGroups, setShowAllActiveGroups] = useState(false);

  const hasData = items.length > 0;
  const activeGroupScrollRef = useRef(null);
  const detailFields = detailItem
    ? (() => {
        const mortality = Number(detailItem.mortality || 0);
        const stock = Number(detailItem.currentStock || 0);
        const total = stock + mortality;
        const rate = total > 0 ? mortality / total : 0;
        const status = rate >= 0.08 ? "Attention" : total > 0 ? "Active" : "Idle";
        return [
          { label: "Group", value: detailItem.batchName },
          { label: "Type", value: formatType(detailItem.type) },
          { label: "Current Stock", value: formatNumber(detailItem.currentStock) },
          { label: "Age", value: `${computeAgeWeeks(detailItem)} wk` },
          {
            label: "Starting Age",
            value:
              detailItem.startingAgeInWeeks ??
              detailItem.startingAge ??
              "—",
          },
          { label: "Mortality", value: formatNumber(detailItem.mortality) },
          {
            label: "Source",
            value: detailItem.sourceType?.replace("_", " ") || "—",
          },
          { label: "Arrival Date", value: detailItem.arrivalDate || "—" },
          { label: "Status", value: status },
          { label: "Note", value: detailItem.note || "—", span: 2 },
        ];
      })()
    : [];

  function getLivestockStatus(item) {
    const mortality = Number(item?.mortality || 0);
    const stock = Number(item?.currentStock || 0);
    const total = stock + mortality;
    const rate = total > 0 ? mortality / total : 0;
    if (rate >= 0.08) return { label: "Attention", color: "#f59e0b" };
    if (total > 0) return { label: "Active", color: "#22c55e" };
    return { label: "Idle", color: "#94a3b8" };
  }

  function formatType(value) {
    if (!value) return "—";
    return typeLabels[value] || value;
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString();
  }

  function formatRate(value) {
    if (!value || Number.isNaN(value)) return "0%";
    return `${(value * 100).toFixed(1)}%`;
  }

  function formatPercent(value) {
    if (value == null || Number.isNaN(value)) return "0%";
    return `${Number(value).toFixed(1)}%`;
  }

  function formatDateTime(value) {
    if (!value) return "—";
    const safe = typeof value === "string" ? value.replace(" ", "T") : value;
    const date = new Date(safe);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function typeEmoji(type) {
    switch (type) {
      case "LAYER":
        return "🐔";
      case "TURKEY":
        return "🦃";
      case "DUCK":
        return "🦆";
      case "FOWL":
        return "🐓";
      case "BROILER":
        return "🍗";
      case "NOILER":
        return "🐥";
      default:
        return "🐣";
    }
  }

  function computeAgeWeeks(item) {
    if (typeof item?.ageInWeeks === "number") return item.ageInWeeks;
    const arrival = item?.arrivalDate ? new Date(item.arrivalDate) : null;
    if (!arrival || Number.isNaN(arrival.getTime())) return 0;
    const now = new Date();
    const diffMs = now.getTime() - arrival.getTime();
    const diffWeeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
    const base =
      item?.sourceType === "FARM_BIRTH"
        ? 0
        : Number(item?.startingAgeInWeeks || 0);
    return Math.max(0, base + Math.max(0, diffWeeks));
  }

  const fetchList = useCallback(
    async (page = 0) => {
    setLoading(true);
    try {
      const res = await getLivestock({
        page,
        size: 10,
        batchName: filters.batchName || undefined,
        type: filters.type || undefined,
        arrivalDate: filters.arrivalDate || undefined,
      });
      setItems(res?.items ?? []);
      setMeta({
        page: res?.page ?? 0,
        totalPages: res?.totalPages ?? 1,
        hasNext: res?.hasNext ?? false,
        hasPrevious: res?.hasPrevious ?? false,
      });
    } finally {
      setLoading(false);
    }
    },
    [filters],
  );

  useEffect(() => {
    fetchList(0);
  }, [filters, fetchList]);


  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const [summaryRes, overviewRes] = await Promise.all([
        getLivestockSummary(),
        getLivestockOverview(),
      ]);
      setSummary(summaryRes || null);
      setOverview(overviewRes || null);
    } catch (err) {
      console.error("Failed to load livestock overview", err);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowHeaderSubtitle(false);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  function clearFilters() {
    setFilters({ batchName: "", type: "", arrivalDate: "" });
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
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
      link.download = filename || `${category || "livestock"}.${type || "csv"}`;
      link.click();
      window.URL.revokeObjectURL(url);
      setToast({ message: "Livestock export ready", type: "success" });
    } catch (error) {
      console.error("Export failed: ", error);
      setToast({ message: "Export failed", type: "error" });
    } finally {
      setExporting(false);
      setExportOpen(false);
    }
  }

  function openDetails(item) {
    setDetailItem(item);
  }

  function closeDetails() {
    setDetailItem(null);
  }

  function scrollActiveGroups(direction) {
    const container = activeGroupScrollRef.current;
    if (!container) return;
    const amount = Math.max(240, Math.round(container.clientWidth * 0.9));
    container.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  function askDelete(item) {
    setDeleteTarget(item);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteLivestock(deleteTarget.id);
      setToast({
        message: `"${deleteTarget.batchName}" deleted`,
        type: "success",
      });
      fetchList(meta.page);
      fetchOverview();
    } catch (err) {
      console.error(err);
      setToast({ message: "Delete failed", type: "error" });
    } finally {
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  }

  const overviewTotals = overview?.totals || {};
  const typeCounts = overview?.countByType || summary?.countByType || {};
  const batchCards = overview?.batchCards || [];
  const attentionNeeded = overview?.attentionNeeded || [];
  const recentActivities = overview?.recentActivities || [];
  const metaRangeDays = overview?.meta?.rangeDays;
  const metaLastUpdated = overview?.meta?.lastUpdated;
  const totalAlive =
    overviewTotals.totalAlive ?? summary?.totalQuantityAlive ?? 0;
  const totalLosses =
    overviewTotals.totalLosses ??
    overviewTotals.totalMortality ??
    summary?.totalLosses ??
    summary?.totalMortality ??
    summary?.totalMortalityCount ??
    0;
  const totalGroupes =
    overviewTotals.totalGroupes ??
    overviewTotals.totalGroups ??
    overviewTotals.totalLivestockGroups ??
    summary?.totalLivestockGroupes ??
    summary?.totalLivestockGroups ??
    summary?.totalGroups ??
    0;
  const mortalityRate =
    overviewTotals.mortalityRate != null
      ? overviewTotals.mortalityRate
      : totalAlive + totalLosses > 0
        ? (totalLosses / (totalAlive + totalLosses)) * 100
        : 0;

  const healthCounts = useMemo(() => {
    return batchCards.reduce(
      (acc, batch) => {
        const risk = batch?.risk || "UNKNOWN";
        acc[risk] = (acc[risk] || 0) + 1;
        return acc;
      },
      { HEALTHY: 0, WATCHLIST: 0, CRITICAL: 0, UNKNOWN: 0 },
    );
  }, [batchCards]);

  const filteredGroupCards = useMemo(() => {
    return batchCards.filter((batch) => {
      const matchesName = filters.batchName
        ? (batch.batchName || "")
            .toLowerCase()
            .includes(filters.batchName.toLowerCase())
        : true;
      const matchesType = filters.type ? batch.type === filters.type : true;
      const matchesDate = filters.arrivalDate
        ? (batch.arrivalDate || "").startsWith(filters.arrivalDate)
        : true;
      return matchesName && matchesType && matchesDate;
    });
  }, [batchCards, filters]);

  const attentionFromList = useMemo(() => {
    return items
      .map((item) => {
        const mortality = Number(item.mortality || 0);
        const stock = Number(item.currentStock || 0);
        const total = stock + mortality;
        const rate = total > 0 ? mortality / total : 0;
        return { item, rate };
      })
      .filter((entry) => entry.rate >= 0.08)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);
  }, [items]);

  const typeBreakdown = useMemo(() => {
    return livestockTypes
      .map((type) => ({
        type,
        label: typeLabels[type] || type,
        count: Number(typeCounts?.[type] || 0),
      }))
      .filter((entry) => entry.count > 0);
  }, [typeCounts]);

  const typeDonutData = useMemo(() => {
    const palette = {
      LAYER: ["rgba(16, 185, 129, 0.35)", "rgba(16, 185, 129, 0.85)"],
      BROILER: ["rgba(59, 130, 246, 0.35)", "rgba(59, 130, 246, 0.85)"],
      NOILER: ["rgba(245, 158, 11, 0.35)", "rgba(245, 158, 11, 0.85)"],
      TURKEY: ["rgba(236, 72, 153, 0.35)", "rgba(236, 72, 153, 0.85)"],
      DUCK: ["rgba(14, 165, 233, 0.35)", "rgba(14, 165, 233, 0.85)"],
      FOWL: ["rgba(99, 102, 241, 0.35)", "rgba(99, 102, 241, 0.85)"],
      OTHER: ["rgba(148, 163, 184, 0.35)", "rgba(148, 163, 184, 0.85)"],
    };

    const labels = typeBreakdown.map((t) => t.label);
    const values = typeBreakdown.map((t) => t.count);
    const backgroundColor = typeBreakdown.map((t) => (palette[t.type]?.[0] || "rgba(148, 163, 184, 0.35)"));
    const borderColor = typeBreakdown.map((t) => (palette[t.type]?.[1] || "rgba(148, 163, 184, 0.85)"));

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor,
          borderColor,
          borderWidth: 2,
          hoverOffset: 10,
        },
      ],
    };
  }, [typeBreakdown]);

  const typeDonutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(15,23,42,0.95)",
          borderColor: "rgba(255,255,255,0.10)",
          borderWidth: 1,
          titleColor: "#E5EDFF",
          bodyColor: "#E5EDFF",
          padding: 10,
          displayColors: false,
        },
      },
    }),
    [],
  );



  const ageBuckets = useMemo(() => {
    const buckets = [
      { label: "0-8 weeks", min: 0, max: 8, count: 0 },
      { label: "9-16 weeks", min: 9, max: 16, count: 0 },
      { label: "17-30 weeks", min: 17, max: 30, count: 0 },
      { label: "31+ weeks", min: 31, max: Infinity, count: 0 },
    ];

    items.forEach((item) => {
      const ageWeeks = computeAgeWeeks(item);
      const qty = Number(item.currentStock || 0);
      const bucket = buckets.find((b) => ageWeeks >= b.min && ageWeeks <= b.max);
      if (bucket) bucket.count += qty;
    });

    const total = buckets.reduce((sum, b) => sum + b.count, 0) || 1;
    return buckets.map((b) => ({
      ...b,
      percent: ((b.count / total) * 100).toFixed(1),
    }));
  }, [items]);




  return (
    <DashboardLayout>
      <div className="font-body space-y-8 animate-fadeIn">
        <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-lightMuted dark:text-darkMuted">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Farm Flock Hub
              </div>
              <h1 className="text-xl sm:text-h2 font-semibold font-header mt-2">
                Livestock
              </h1>
              <div
                className={`overflow-hidden transition-all duration-500 ${
                  showHeaderSubtitle ? "max-h-10 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-xs text-lightMuted dark:text-darkMuted font-body">
                  Track stock, health, and group performance in one view.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full lg:w-auto lg:flex-row lg:items-center">
              <div className="relative w-full lg:w-[420px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-lightMuted dark:text-darkMuted" />
                <input
                  type="text"
                  placeholder="Search groups..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-lightCard dark:bg-darkCard/70 border border-white/10 text-lightText dark:text-darkText focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
                  value={filters.batchName}
                  onChange={(e) =>
                    setFilters({ ...filters, batchName: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-row gap-2 items-center justify-start w-full lg:w-auto">
                <button
                  onClick={openCreate}
                  className="w-auto justify-center flex items-center gap-2 bg-accent-primary text-darkText px-4 py-2 rounded-xl hover:opacity-90 transition font-body"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Group</span>
                </button>
                <button
                  onClick={() => setExportOpen(true)}
                  disabled={exporting}
                  className="ml-auto w-auto justify-center flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-darkText dark:hover:bg-white/20 transition font-body disabled:opacity-50"
                  title="Export livestock"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-body">
                    {exporting ? "Exporting..." : "Export"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilters({ ...filters, type: "" })}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer hover:shadow-soft active:scale-95 ${
                  !filters.type
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-400/20 dark:text-emerald-200 dark:border-emerald-400/30"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:text-darkText dark:border-white/10 dark:hover:bg-white/20"
                }`}
              >
                All Types
              </button>
              {livestockTypes.map((type) => (
                <button
                  key={`type-filter-${type}`}
                  onClick={() => setFilters({ ...filters, type })}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer hover:shadow-soft active:scale-95 ${
                    filters.type === type
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-400/20 dark:text-emerald-200 dark:border-emerald-400/30"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:text-darkText dark:border-white/10 dark:hover:bg-white/20"
                  }`}
                >
                  {typeLabels[type] || type}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <span className="text-xs text-lightMuted dark:text-darkMuted">
                  {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                </span>
              )}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-lightText border-white/10 hover:bg-white/20 dark:bg-white/10 dark:text-darkText dark:border-white/10 dark:hover:bg-white/20 transition"
                >
                  Clear Filters
                </button>
              )}
              <span className="text-xs text-lightMuted dark:text-darkMuted">
                Updated {formatDateTime(metaLastUpdated)}
              </span>
            </div>
          </div>
        </div>

        
        
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {overviewLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`overview-skeleton-${idx}`}
                className="min-h-[92px] rounded-2xl bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-5 lg:p-6"
                aria-hidden="true"
              >
                <div className="skeleton-glass h-4 w-24 rounded" />
                <div className="skeleton-glass h-8 w-32 rounded mt-4" />
                <div className="skeleton-glass h-3 w-20 rounded mt-3" />
              </div>
            ))
            ) : (
            <>
              <div className="min-h-[92px] rounded-2xl bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-lightMuted dark:text-darkMuted">Animals in care</div>
                  <Feather className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="mt-3 text-3xl font-semibold">
                  {formatNumber(totalAlive)}
                </div>
                <div className="text-xs text-lightMuted dark:text-darkMuted mt-2">
                  Across all livestock
                </div>
              </div>
              <div className="min-h-[92px] rounded-2xl bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-lightMuted dark:text-darkMuted">Losses</div>
                  <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-yellow-300" />
                </div>
                <div className="mt-3 text-3xl font-semibold">
                  {formatNumber(totalLosses)}
                </div>
                <div className="text-xs text-lightMuted dark:text-darkMuted mt-2">
                  Rate: {formatPercent(mortalityRate)}
                </div>
              </div>
              <div className="min-h-[92px] rounded-2xl bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-lightMuted dark:text-darkMuted">Active groups</div>
                  <Calendar className="w-5 h-5 text-cyan-300" />
                </div>
                <div className="mt-3 text-3xl font-semibold">
                  {formatNumber(totalGroupes)}
                </div>
                <div className="text-xs text-lightMuted dark:text-darkMuted mt-2">
                  {metaRangeDays ? `Last ${metaRangeDays} days` : "All time"}
                </div>
              </div>
              <div className="min-h-[92px] rounded-2xl bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-lightMuted dark:text-darkMuted">Health overview</div>
                  <ShieldCheck className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="text-emerald-700 dark:text-emerald-300">
                    Healthy: {healthCounts.HEALTHY}
                  </span>
                  <span className="text-lightMuted dark:text-darkMuted">|</span>
                  <span className="text-yellow-700 dark:text-yellow-300">
                    Watchlist: {healthCounts.WATCHLIST}
                  </span>
                  <span className="text-lightMuted dark:text-darkMuted">|</span>
                  <span className="text-red-600 dark:text-red-400">
                    Critical: {healthCounts.CRITICAL}
                  </span>
                </div>
                <div className="text-xs text-lightMuted dark:text-darkMuted mt-2">
                  Updated {formatDateTime(metaLastUpdated)}
                </div>
              </div>
            </>
            )}
          </div>
                                        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
            <div className="space-y-4">
              <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-header font-semibold">Active groups</h2>
                    <p className="text-xs text-lightMuted dark:text-darkMuted">
                      Quick look at active groups.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-lightMuted dark:text-darkMuted">
                      {filteredGroupCards.length} groups
                    </span>
                    <div className="hidden md:flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => scrollActiveGroups(-1)}
                        aria-label="Scroll active groups left"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition text-lightText dark:text-darkText disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={filteredGroupCards.length === 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollActiveGroups(1)}
                        aria-label="Scroll active groups right"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition text-lightText dark:text-darkText disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={filteredGroupCards.length === 0}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  {overviewLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <div
                          key={`batch-card-skeleton-${idx}`}
                          className="rounded-xl bg-white/5 dark:bg-darkCard/50 shadow-soft ring-1 ring-white/10 p-4"
                          aria-hidden="true"
                        >
                          <div className="skeleton-glass h-4 w-28 rounded" />
                          <div className="skeleton-glass h-6 w-20 rounded mt-3" />
                          <div className="skeleton-glass h-3 w-24 rounded mt-4" />
                        </div>
                      ))}
                    </div>
                  ) : filteredGroupCards.length === 0 ? (
                    <div className="text-sm text-lightMuted dark:text-darkMuted">
                      No groups match your filters.
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:hidden">
                        {(showAllActiveGroups
                          ? filteredGroupCards
                          : filteredGroupCards.slice(0, 5)
                        ).map((batch) => {
                          const riskColor =
                            batch.risk === "CRITICAL"
                              ? "bg-red-500/20 text-red-700 dark:text-red-300"
                              : batch.risk === "WATCHLIST"
                                ? "bg-yellow-400/20 text-yellow-700 dark:text-yellow-300"
                                : "bg-emerald-400/20 text-emerald-700 dark:text-emerald-300";
                          return (
                            <div
                              key={batch.id}
                              onClick={() => openDetails(batch)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  openDetails(batch);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              aria-label={`View details for ${batch.batchName}`}
                              className="rounded-xl bg-white/5 dark:bg-darkCard/50 shadow-neo dark:shadow-dark border border-white/10 p-4 cursor-pointer hover:bg-accent-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold">
                                    {batch.batchName}
                                  </div>
                                  <div className="text-xs text-lightMuted dark:text-darkMuted mt-1">
                                    {typeEmoji(batch.type)} {formatType(batch.type)} · {batch.ageWeeks} wk
                                  </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${riskColor}`}>
                                  {batch.risk?.toLowerCase() || "unknown"}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-3 mt-4 text-xs text-lightText dark:text-darkText">
                                <div>
                                  <div className="text-lightMuted dark:text-darkMuted">Alive</div>
                                  <div className="text-sm font-semibold">
                                    {formatNumber(batch.alive)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-lightMuted dark:text-darkMuted">Losses</div>
                                  <div className="text-sm font-semibold">
                                    {formatNumber(batch.mortalityTotal)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-lightMuted dark:text-darkMuted">Rate</div>
                                  <div className="text-sm font-semibold">
                                    {formatPercent(batch.mortalityRate)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-lightMuted dark:text-darkMuted">Updated</div>
                                  <div className="text-sm font-semibold">
                                    {formatDateTime(batch.lastUpdated)}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 flex items-center justify-end gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEdit(batch);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-accent-primary"
                                  title="Edit group"
                                >
                                  <Edit className="w-4 h-4" />
                                  <span className="text-xs font-semibold">
                                    Edit
                                  </span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    askDelete(batch);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-status-danger"
                                  title="Delete group"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span className="text-xs font-semibold">
                                    Delete
                                  </span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div
                        ref={activeGroupScrollRef}
                        className="hidden md:flex gap-4 overflow-x-auto pb-2 hide-scrollbar"
                      >
                        {filteredGroupCards.map((batch) => {
                          const riskColor =
                            batch.risk === "CRITICAL"
                              ? "bg-red-500/20 text-red-700 dark:text-red-300"
                              : batch.risk === "WATCHLIST"
                                ? "bg-yellow-400/20 text-yellow-700 dark:text-yellow-300"
                                : "bg-emerald-400/20 text-emerald-700 dark:text-emerald-300";
                          return (
                            <div
                              key={batch.id}
                              onClick={() => openDetails(batch)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  openDetails(batch);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              aria-label={`View details for ${batch.batchName}`}
                              className="min-w-[240px] max-w-[280px] shrink-0 rounded-xl bg-white/5 dark:bg-darkCard/50 shadow-neo dark:shadow-dark border border-white/10 p-4 cursor-pointer hover:bg-accent-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold">
                                    {batch.batchName}
                                  </div>
                                  <div className="text-xs text-lightMuted dark:text-darkMuted mt-1">
                                    {typeEmoji(batch.type)} {formatType(batch.type)} · {batch.ageWeeks} wk
                                  </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${riskColor}`}>
                                  {batch.risk?.toLowerCase() || "unknown"}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-3 mt-4 text-xs text-lightText dark:text-darkText">
                                <div>
                                  <div className="text-lightMuted dark:text-darkMuted">Alive</div>
                                  <div className="text-sm font-semibold">
                                    {formatNumber(batch.alive)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-lightMuted dark:text-darkMuted">Losses</div>
                                  <div className="text-sm font-semibold">
                                    {formatNumber(batch.mortalityTotal)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-lightMuted dark:text-darkMuted">Rate</div>
                                  <div className="text-sm font-semibold">
                                    {formatPercent(batch.mortalityRate)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-lightMuted dark:text-darkMuted">Updated</div>
                                  <div className="text-sm font-semibold">
                                    {formatDateTime(batch.lastUpdated)}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 flex items-center justify-end gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEdit(batch);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-accent-primary"
                                  title="Edit group"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    askDelete(batch);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-status-danger"
                                  title="Delete group"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="hidden md:flex mt-2 items-center justify-end text-xs text-lightMuted dark:text-darkMuted">
                        Scroll → to see more
                      </div>
                    </>
                  )}
                </div>
                {!overviewLoading && filteredGroupCards.length > 5 && (
                  <button
                    onClick={() => setShowAllActiveGroups((prev) => !prev)}
                    className="mt-3 w-full px-4 py-2 rounded-lg bg-white/10 text-lightText dark:text-darkText hover:bg-white/20 dark:hover:bg-white/10 transition font-semibold text-xs md:hidden"
                  >
                    {showAllActiveGroups ? "View Less" : "View All"}
                  </button>
                )}
              </div>

              <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-header font-semibold">Stock by type</h2>
                    <p className="text-xs text-lightMuted dark:text-darkMuted">
                      Live count by animal type.
                    </p>
                  </div>
                  <span className="text-xs text-right text-lightMuted dark:text-darkMuted leading-tight">
                    Updated {formatDateTime(metaLastUpdated)}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 lg:grid-cols-[220px,1fr] gap-3 items-center">
                  <div className="h-[180px] w-full">
                    {typeBreakdown.length === 0 ? (
                      <div className="w-full h-full flex items-center justify-center text-sm text-lightMuted dark:text-darkMuted">
                        No type breakdown data yet.
                      </div>
                    ) : (
                      <Doughnut data={typeDonutData} options={typeDonutOptions} />
                    )}
                  </div>
                  <div className="flex flex-nowrap gap-3 min-w-0 overflow-x-auto pb-1 hide-scrollbar">
                    {typeBreakdown.map((entry) => (
                      <div
                        key={entry.type}
                        className="shrink-0 max-w-[200px] min-w-[160px] px-3.5 py-2.5 rounded-xl bg-white/10 dark:bg-darkCard/70 shadow-soft border border-white/10 flex items-center gap-2"
                      >
                        <span className="text-lg">{typeEmoji(entry.type)}</span>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-lightText dark:text-darkText leading-tight">
                            {entry.label}
                          </div>
                          <div className="text-xs text-lightMuted dark:text-darkMuted leading-tight">
                            {formatNumber(entry.count)} birds
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="font-header font-semibold">Group list</h2>
                    <p className="text-xs text-lightMuted dark:text-darkMuted">
                      Manage livestock groups with filters and pagination.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                    <select
                      className="w-full sm:w-40 px-3 py-2 rounded-md bg-transparent bg-lightCard dark:bg-darkCard border dark:border-white/10"
                      value={filters.type}
                      onChange={(e) =>
                        setFilters({ ...filters, type: e.target.value })
                      }
                    >
                      <option value="">All Types</option>
                      {livestockTypes.map((t) => (
                        <option key={t} value={t}>
                          {typeLabels[t] || t}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      className="w-full sm:w-40 px-3 py-2 rounded-md bg-transparent border dark:border-white/10"
                      value={filters.arrivalDate}
                      onChange={(e) =>
                        setFilters({ ...filters, arrivalDate: e.target.value })
                      }
                    />
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="w-full sm:w-auto px-3 py-2 rounded-md bg-white/10 text-lightText border-white/10 hover:bg-white/20 dark:bg-white/10 dark:text-darkText dark:border-white/10 dark:hover:bg-white/20 transition"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => setTrashOpen(true)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200 transition font-body"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Trash</span>
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="overflow-x-auto md:overflow-visible hide-scrollbar mt-4">
                    <div className="space-y-3" aria-hidden="true">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <div
                          key={`livestock-row-skeleton-${idx}`}
                          className="skeleton-glass h-10 rounded-md"
                        />
                      ))}
                    </div>
                  </div>
                ) : hasData ? (
                  <>
                    <div className="md:hidden mt-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[520px] border-separate border-spacing-y-2 [&_th]:px-3 [&_th]:pb-2 [&_td]:px-3 [&_td]:py-2 [&_td:first-child]:rounded-l-lg [&_td:last-child]:rounded-r-lg [&_tbody_tr]:bg-white/5 dark:[&_tbody_tr]:bg-darkCard/60 [&_tbody_tr]:shadow-soft [&_tbody_tr:hover]:shadow-neo [&_tbody_tr]:transition">
                          <thead className="text-lightText dark:text-darkText font-body">
                            <tr className="font-header text-[10px] uppercase tracking-[0.2em] text-lightText dark:text-darkText">
                              <th className="text-left whitespace-nowrap">Group</th>
                              <th className="text-left whitespace-nowrap">Type</th>
                              <th className="text-right whitespace-nowrap">Qty</th>
                              <th className="text-left whitespace-nowrap">Status</th>
                              <th className="text-center whitespace-nowrap">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(showAllMobileGroups ? items : items.slice(0, 4)).map((item) => {
                              const mortality = Number(item.mortality || 0);
                              const stock = Number(item.currentStock || 0);
                              const total = stock + mortality;
                              const rate = total > 0 ? mortality / total : 0;
                              const status =
                                rate >= 0.08 ? "Attention" : total > 0 ? "Active" : "Idle";
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
                                  aria-label={`View details for ${item.batchName}`}
                                  className="font-body cursor-pointer hover:bg-accent-primary/25 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                                >
                                  <td className="text-left font-semibold">
                                    {item.batchName}
                                  </td>
                                  <td className="text-left whitespace-nowrap">
                                    {formatType(item.type)}
                                  </td>
                                  <td className="text-right font-semibold">
                                    {formatNumber(item.currentStock)}
                                  </td>
                                  <td className="text-left">
                                    <span
                                      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                                        status === "Attention"
                                          ? "bg-yellow-400/20 text-yellow-800 dark:text-yellow-300"
                                          : status === "Active"
                                            ? "bg-green-400/20 text-emerald-800 dark:text-green-300"
                                            : "bg-lightbg text-slate-700 dark:bg-slate-400/20 dark:text-slate-300"
                                      }`}
                                    >
                                      {status}
                                    </span>
                                  </td>
                                  <td className="text-center">
                                    <div className="inline-flex items-center gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEdit(item);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/5 text-accent-primary"
                                        title="Edit batch"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          askDelete(item);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/5 text-status-danger"
                                        title="Delete batch"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {items.length > 4 && (
                        <button
                          onClick={() => setShowAllMobileGroups((prev) => !prev)}
                          className="w-full mt-2 px-4 py-2 rounded-lg bg-white/10 text-lightText dark:text-darkText hover:bg-white/20 dark:hover:bg-white/10 transition font-semibold text-xs"
                        >
                          {showAllMobileGroups ? "View Less" : "View All"}
                        </button>
                      )}
                    </div>

                    <div className="hidden md:block overflow-x-auto md:overflow-visible hide-scrollbar mt-4">
                      <table className="w-full text-sm min-w-[900px] border-separate border-spacing-y-2 [&_th]:px-4 [&_th]:pb-2 [&_td]:px-4 [&_td]:py-3 [&_td:first-child]:rounded-l-xl [&_td:last-child]:rounded-r-xl [&_tbody_tr]:bg-white/5 dark:[&_tbody_tr]:bg-darkCard/60 [&_tbody_tr]:shadow-soft [&_tbody_tr:hover]:shadow-neo [&_tbody_tr]:transition">
                        <thead className="text-lightText dark:text-darkText font-body">
                          <tr className="font-header text-[11px] uppercase tracking-[0.2em] text-lightText dark:text-darkText">
                            <th className="text-left whitespace-nowrap">Type</th>
                            <th className="text-left whitespace-nowrap">Group</th>
                            <th className="text-right whitespace-nowrap">Quantity</th>
                            <th className="text-right whitespace-nowrap">Age</th>
                            <th className="text-left whitespace-nowrap">Origin</th>
                            <th className="text-left whitespace-nowrap">Status</th>
                            <th className="text-center whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => {
                            const mortality = Number(item.mortality || 0);
                            const stock = Number(item.currentStock || 0);
                            const total = stock + mortality;
                            const rate = total > 0 ? mortality / total : 0;
                            const status =
                              rate >= 0.08 ? "Attention" : total > 0 ? "Active" : "Idle";
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
                                aria-label={`View details for ${item.batchName}`}
                                className="font-body cursor-pointer hover:bg-accent-primary/25 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                              >
                                <td className="text-left">
                                  <div className="flex items-center gap-2">
                                    <span>{typeEmoji(item.type)}</span>
                                    <span>{formatType(item.type)}</span>
                                  </div>
                                </td>
                                <td className="text-left font-semibold">
                                  {item.batchName}
                                </td>
                                <td className="text-right font-semibold">
                                  {formatNumber(item.currentStock)}
                                </td>
                                <td className="text-right">
                                  {computeAgeWeeks(item)} wk
                                </td>
                                <td className="text-left">
                                  {item.sourceType?.replace("_", " ") || "—"}
                                </td>
                                <td className="text-left">
                                  <span
                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                                      status === "Attention"
                                        ? "bg-yellow-400/20 text-yellow-800 dark:text-yellow-300"
                                        : status === "Active"
                                          ? "bg-green-400/20 text-emerald-800 dark:text-green-300"
                                          : "bg-lightbg text-slate-700 dark:bg-slate-400/20 dark:text-slate-300"
                                  }`}
                                  >
                                    {status}
                                  </span>
                                </td>
                                <td className="text-center">
                                  <div className="inline-flex items-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEdit(item);
                                      }}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-accent-primary"
                                      title="Edit batch"
                                    >
                                      <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        askDelete(item);
                                      }}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-status-danger"
                                      title="Delete batch"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="w-full flex items-center justify-center py-12 sm:py-16 font-body">
                    <div className="flex flex-col items-center text-center gap-3 w-full max-w-sm">
                      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 shadow-sm">
                        <Feather className="w-7 h-7 text-emerald-600 dark:text-emerald-200" />
                      </div>
                      <h4 className="text-sm font-semibold font-header text-slate-700 dark:text-slate-100">
                        {hasActiveFilters
                          ? "No groups match these filters"
                          : "No groups yet"}
                      </h4>
                      <p className="text-xs text-lightMuted dark:text-darkMuted leading-relaxed">
                        {hasActiveFilters
                          ? "Clear filters to see more results."
                          : "Add your first livestock batch to start tracking."}
                      </p>
                      <button
                        className="mt-2 w-full sm:w-auto px-5 py-2 bg-accent-primary text-white rounded-lg transition hover:opacity-90 active:scale-[0.98]"
                        onClick={hasActiveFilters ? clearFilters : openCreate}
                      >
                        {hasActiveFilters ? "Clear Filters" : "Add Group"}
                      </button>
                    </div>
                  </div>
                )}

                {meta.totalPages > 1 && !loading && (
                  <div className="mt-4 w-full">
                    <div className="flex items-center gap-4 justify-center sm:justify-end px-2 sm:px-0">
                      <button
                        disabled={!meta.hasPrevious}
                        onClick={() => fetchList(meta.page - 1)}
                        title="Previous page"
                        className="disabled:opacity-40 flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5"
                      >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="font-semibold">Prev</span>
                      </button>

                      <span className="flex items-center whitespace-nowrap">
                        Page {meta.page + 1} / {meta.totalPages || 1}
                      </span>

                      <button
                        disabled={!meta.hasNext}
                        onClick={() => fetchList(meta.page + 1)}
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

            <aside className="space-y-4 xl:sticky xl:top-6 h-fit">
              <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-header font-semibold">Age groups</h2>
                    <p className="text-xs text-lightMuted dark:text-darkMuted">
                      How animals are spread across age ranges.
                    </p>
                  </div>
                  <span className="text-xs text-lightMuted dark:text-darkMuted">
                    Based on current list
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  {ageBuckets.map((entry) => (
                    <div
                      key={entry.label}
                      className="rounded-xl bg-white/5 dark:bg-darkCard/50 shadow-soft ring-1 ring-white/10 p-3"
                    >
                      <div className="text-xs text-lightMuted dark:text-darkMuted">{entry.label}</div>
                      <div className="text-lg font-semibold mt-2">
                        {formatNumber(entry.count)}
                      </div>
                      <div className="text-xs text-lightMuted dark:text-darkMuted mt-1">
                        {entry.percent}% of visible stock
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-4">
                <div className="flex items-center gap-2 text-amber-700 dark:text-yellow-300 font-semibold">
                  <AlertTriangle className="w-5 h-5" />
                  Needs attention
                </div>
                <div className="mt-3 space-y-2 text-sm text-lightText dark:text-darkText">
                  {attentionNeeded.length === 0 && attentionFromList.length === 0 ? (
                    <div className="text-lightMuted dark:text-darkMuted text-sm">
                      No critical alerts right now.
                    </div>
                  ) : attentionNeeded.length > 0 ? (
                    attentionNeeded.map((item, idx) => (
                      <div key={`${item.code}-${idx}`} className="flex gap-2">
                        <span className="w-2 h-2 mt-2 rounded-full bg-amber-500 dark:bg-yellow-300" />
                        <span>{item.message}</span>
                      </div>
                    ))
                  ) : (
                    attentionFromList.map((alert) => (
                      <div key={alert.item.id} className="flex gap-2">
                        <span className="w-2 h-2 mt-2 rounded-full bg-amber-500 dark:bg-yellow-300" />
                        <span>
                          {formatType(alert.item.type)} ({alert.item.batchName}): Losses spike ({formatRate(alert.rate)})
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-4">
                <div className="flex items-center justify-between">
                  <div className="font-header font-semibold">Recent Activity</div>
                  <span className="text-xs text-lightMuted dark:text-darkMuted">
                    {recentActivities.length} updates
                  </span>
                </div>
                <div className="mt-4 space-y-3 text-sm text-lightText dark:text-darkText">
                  {recentActivities.length === 0 ? (
                    <div className="text-lightMuted dark:text-darkMuted text-sm">
                      No recent activity yet.
                    </div>
                  ) : (
                    recentActivities.map((entry, idx) => (
                      <div key={`${entry.time}-${idx}`} className="flex gap-3">
                        <span className="w-2 h-2 mt-2 rounded-full bg-emerald-300" />
                        <div>
                          <div className="font-semibold">{entry.title}</div>
                          <div className="text-xs text-lightMuted dark:text-darkMuted">
                            {entry.details} · {formatDateTime(entry.time)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-4">
                <div className="flex items-center justify-between">
                  <div className="font-header font-semibold">Quick tasks</div>
                  <span className="text-xs text-lightMuted dark:text-darkMuted">
                    Update stock quickly
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  <select
                    className="w-full px-3 py-2 rounded-lg bg-lightCard dark:bg-darkCard/60 border border-white/10 text-lightText dark:text-darkText text-sm"
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                  >
                    <option value="">Select group to update</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.batchName} ({formatType(item.type)})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const target = items.find((i) => String(i.id) === String(selectedGroupId)) || items[0];
                      if (target) openEdit(target);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent-primary text-white hover:opacity-90"
                  >
                    Update count
                  </button>
                  <p className="text-xs text-lightMuted dark:text-darkMuted">
                    Opens the editor to update count and losses.
                  </p>
                </div>
              </div>
            </aside>
          </div>

          <ItemDetailsModal
            open={Boolean(detailItem)}
            title={detailItem?.batchName || "Livestock Details"}
            subtitle={
              detailItem?.id ? `Group ID #${detailItem.id}` : "Livestock Details"
            }
            status={detailItem ? getLivestockStatus(detailItem) : undefined}
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
            title="Delete Group"
            message={`Are you sure you want to delete "${deleteTarget?.batchName}"?`}
            confirmText="Delete"
            loading={false}
            onCancel={() => {
              setConfirmOpen(false);
              setDeleteTarget(null);
            }}
            onConfirm={confirmDelete}
          />

          <TrashModal
            open={trashOpen}
            onClose={() => setTrashOpen(false)}
            title="Deleted groups"
            fetchData={({ page = 0, size = 10 }) =>
              getDeletedLivestock({ page, size })
            }
            onRestore={async (batch) => {
              await restoreLivestock(batch.id);
              fetchList(meta.page);
              fetchOverview();

              setToast({
                message: `"${batch.batchName}" restored successfully`,
                type: "success",
              });
            }}
            onPermanentDelete={async (batch) => {
              try {
                await permanentDeleteLivestock(batch.id);

                fetchList(meta.page);
                fetchOverview();

                setToast({
                  message: `"${batch.batchName}" deleted permanently`,
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
              { key: "batchName", label: "Group" },
              { key: "type", label: "Type" },
              { key: "currentStock", label: "Alive", align: "right" },
              { key: "arrivalDate", label: "Start date" },
            ]}
            formatCell={(item, key) => {
              if (key === "type") return formatType(item.type);
              if (key === "currentStock")
                return Number(item.currentStock || 0).toLocaleString();
              if (key === "arrivalDate")
                return item.arrivalDate
                  ? new Date(item.arrivalDate).toLocaleDateString("en-GB")
                  : "-";
              return item[key] ?? "-";
            }}
          />

          <LivestockFormModal
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
                message: `Group ${editing ? "updated" : "created"}`,
                type: "success",
              });
              fetchList(meta.page);
              fetchOverview();
            }}
          />

          <ExportModal
            open={exportOpen}
            onClose={() => setExportOpen(false)}
            onSubmit={handleExport}
            exporting={exporting}
            defaultCategory="livestock"
            defaultType="csv"
            defaultStart={filters.arrivalDate || ""}
            defaultEnd={filters.arrivalDate || ""}
          />

          <GlassToast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ message: "", type: "info" })}
          />
      </div>
    </DashboardLayout>
  );
}

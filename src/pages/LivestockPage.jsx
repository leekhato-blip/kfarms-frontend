import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

import DashboardLayout from "../layouts/DashboardLayout";
import FarmerGuideCard from "../components/FarmerGuideCard";
import FilteredResultsHint from "../components/FilteredResultsHint";
import GlassToast from "../components/GlassToast";
import MobileAccordionCard from "../components/MobileAccordionCard";
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
import { isOfflinePendingRecord } from "../offline/offlineResources";
import { useOfflineSyncRefresh } from "../offline/useOfflineSyncRefresh";
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
  RefreshCw,
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

const EMPTY_OBJECT = {};
const EMPTY_ARRAY = [];
const KEEPING_METHOD_LABELS = {
  DEEP_LITTER: "Deep litter",
  BATTERY_CAGE: "Battery cage",
  FREE_RANGE: "Free range",
  SEMI_INTENSIVE: "Semi-intensive",
  BROODER_HOUSE: "Brooder house",
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
  const [refreshing, setRefreshing] = useState(false);

  const [selectedGroupId, setSelectedGroupId] = useState("");
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
          { label: "Flock", value: detailItem.batchName },
          { label: "Type", value: formatType(detailItem.type) },
          {
            label: "Method of Keeping",
            value: formatKeepingMethod(detailItem.keepingMethod),
          },
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

  function formatKeepingMethod(value) {
    if (!value) return "—";
    return KEEPING_METHOD_LABELS[value] || value.replaceAll("_", " ");
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
    fetchOverview();
  }, [fetchOverview]);

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([fetchList(meta.page), fetchOverview()]);
<<<<<<< HEAD
      setToast({ message: "Livestock refreshed", type: "success" });
    } catch {
      setToast({ message: "Failed to refresh livestock", type: "error" });
=======
>>>>>>> 0babf4d (Update frontend application)
    } finally {
      setRefreshing(false);
    }
  }

  const refreshPageData = useCallback(async () => {
    await Promise.all([fetchList(meta.page ?? 0), fetchOverview()]);
  }, [fetchList, fetchOverview, meta.page]);

  useOfflineSyncRefresh(refreshPageData);

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
      setToast({ message: "Poultry export ready", type: "success" });
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
      if (detailItem?.id === deleteTarget.id) {
        closeDetails();
      }
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

  const overviewTotals = overview?.totals ?? EMPTY_OBJECT;
  const typeCounts = overview?.countByType ?? summary?.countByType ?? EMPTY_OBJECT;
  const batchCards = overview?.batchCards ?? EMPTY_ARRAY;
  const attentionNeeded = overview?.attentionNeeded ?? EMPTY_ARRAY;
  const recentActivities = overview?.recentActivities ?? EMPTY_ARRAY;
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
  const atRiskGroups = healthCounts.WATCHLIST + healthCounts.CRITICAL;

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

  const mobileOverviewCards = useMemo(
    () => [
      {
        id: "alive",
        label: "Birds in care",
        value: formatNumber(totalAlive),
        detail: "Across all flocks",
        icon: Feather,
        iconClass: "text-emerald-500 dark:text-emerald-300",
      },
      {
        id: "losses",
        label: "Losses",
        value: formatNumber(totalLosses),
        detail: `Rate ${formatPercent(mortalityRate)}`,
        icon: AlertTriangle,
        iconClass: "text-amber-500 dark:text-yellow-300",
      },
      {
        id: "groups",
        label: "Active flocks",
        value: formatNumber(totalGroupes),
        detail: metaRangeDays ? `Last ${metaRangeDays} days` : "All time",
        icon: Calendar,
        iconClass: "text-cyan-500 dark:text-cyan-300",
      },
      {
        id: "health",
        label: "At risk",
        value: formatNumber(atRiskGroups),
        detail: `Healthy ${healthCounts.HEALTHY}`,
        icon: ShieldCheck,
        iconClass:
          atRiskGroups > 0
            ? "text-amber-500 dark:text-amber-300"
            : "text-emerald-500 dark:text-emerald-300",
      },
    ],
    [
      atRiskGroups,
      healthCounts.HEALTHY,
      metaRangeDays,
      mortalityRate,
      totalAlive,
      totalGroupes,
      totalLosses,
    ],
  );




  return (
    <DashboardLayout>
      <div className="font-body space-y-8 animate-fadeIn">
        <div className="relative isolate overflow-hidden rounded-2xl border border-sky-200/70 bg-slate-50/85 p-5 shadow-neo dark:border-sky-500/20 dark:bg-[#061024]/90 dark:shadow-[0_22px_40px_rgba(2,8,24,0.45)] md:p-6">
          <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(108deg,rgba(37,99,235,0.17)_0%,rgba(14,116,144,0.14)_48%,rgba(16,185,129,0.12)_100%),radial-gradient(circle_at_12%_22%,rgba(56,189,248,0.13),transparent_43%),radial-gradient(circle_at_90%_22%,rgba(16,185,129,0.14),transparent_38%)] dark:bg-[linear-gradient(108deg,rgba(6,19,43,0.96)_0%,rgba(7,32,63,0.9)_48%,rgba(6,58,55,0.84)_100%),radial-gradient(circle_at_12%_22%,rgba(56,189,248,0.16),transparent_43%),radial-gradient(circle_at_90%_22%,rgba(16,185,129,0.18),transparent_38%)]" />
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-accent-primary/30 bg-accent-primary/10 px-3 py-1 text-xs font-semibold text-accent-primary dark:text-blue-200">
                <Feather className="h-3.5 w-3.5" />
                Poultry flocks
              </div>
              <h1 className="mt-3 text-2xl font-header font-semibold text-slate-900 dark:text-slate-100 md:text-[1.9rem]">
                Poultry
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-700/90 dark:text-slate-300/85">
                Keep a clear list of your poultry flocks, how many birds are alive, and which flocks need attention.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
              <div className="relative w-full md:w-[380px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                <input
                  type="text"
                  placeholder="Search flocks..."
                  className="w-full rounded-lg border border-slate-200/80 bg-white/45 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-accent-primary/40 focus:ring-2 focus:ring-accent-primary/10 dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:placeholder:text-slate-300/70"
                  value={filters.batchName}
                  onChange={(e) =>
                    setFilters({ ...filters, batchName: e.target.value })
                  }
                />
              </div>
              <div className="grid w-full grid-cols-2 auto-rows-fr gap-2 md:flex md:w-auto md:items-center">
                <button
                  onClick={openCreate}
                  className="col-span-2 inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-accent-primary to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:brightness-105 md:col-span-1 md:h-auto md:min-h-0 md:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add poultry flock</span>
                </button>
                <button
                  onClick={() => setExportOpen(true)}
                  disabled={exporting}
                  className="inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white/45 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 disabled:opacity-50 md:h-auto md:min-h-0 md:w-auto dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20"
                  title="Download poultry report"
                >
                  <Download className="h-4 w-4" />
                  <span>
                    {exporting ? "Downloading..." : "Download"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh poultry"
                  aria-label="Refresh poultry"
                  className={`inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white/45 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 disabled:opacity-60 md:h-auto md:min-h-0 md:w-auto dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20 ${
                    refreshing ? "cursor-not-allowed opacity-70" : ""
                  }`}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilters({ ...filters, type: "" })}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer hover:shadow-soft active:scale-95 ${
                    !filters.type
                      ? "border-cyan-300/70 bg-cyan-100/70 text-cyan-700 shadow-[0_8px_18px_rgba(8,145,178,0.16)] dark:border-cyan-300/50 dark:bg-gradient-to-r dark:from-accent-primary/55 dark:to-cyan-400/38 dark:text-white dark:shadow-[0_10px_22px_rgba(37,99,235,0.34)]"
                      : "border-slate-200/85 bg-white/60 text-slate-700 hover:bg-white/80 dark:border-slate-300/20 dark:bg-slate-900/45 dark:text-slate-200 dark:hover:border-slate-200/35 dark:hover:bg-slate-800/60"
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
                      ? "border-cyan-300/70 bg-cyan-100/70 text-cyan-700 shadow-[0_8px_18px_rgba(8,145,178,0.16)] dark:border-cyan-300/50 dark:bg-gradient-to-r dark:from-accent-primary/55 dark:to-cyan-400/38 dark:text-white dark:shadow-[0_10px_22px_rgba(37,99,235,0.34)]"
                      : "border-slate-200/85 bg-white/60 text-slate-700 hover:bg-white/80 dark:border-slate-300/20 dark:bg-slate-900/45 dark:text-slate-200 dark:hover:border-slate-200/35 dark:hover:bg-slate-800/60"
                  }`}
                >
                  {typeLabels[type] || type}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <span className="text-xs text-slate-600/90 dark:text-slate-300/80">
                  {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                </span>
              )}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="rounded-full border border-slate-200/80 bg-white/45 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-white/70 dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20"
                >
                  Show everything
                </button>
              )}
              <span className="text-xs text-slate-600/90 dark:text-slate-300/80">
                Updated {formatDateTime(metaLastUpdated)}
              </span>
            </div>
          </div>
        </div>

        <FarmerGuideCard
          icon={Feather}
          title="How to use poultry"
          description="This page is for simple poultry flock records, keeping style, and health checks."
          storageKey="livestock-guide"
          steps={[
            "Use \"Add poultry flock\" when you start tracking a new flock or batch.",
            "Check the top cards first to see total birds, losses, and active flocks.",
            "Use the filters only when you want to focus on one bird type or one flock.",
          ]}
          tip="The top boxes show all poultry activity. The list below may show fewer rows when filters are active."
        />

        
        
        <div className="grid grid-cols-2 gap-3 sm:hidden">
          {overviewLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`mobile-overview-skeleton-${idx}`}
                className="min-h-[108px] rounded-2xl bg-white/10 p-4 shadow-neo dark:bg-darkCard/70 dark:shadow-dark"
                aria-hidden="true"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="skeleton-glass h-3.5 w-20 rounded" />
                  <div className="skeleton-glass h-8 w-8 rounded-full" />
                </div>
                <div className="skeleton-glass mt-4 h-8 w-20 rounded" />
                <div className="skeleton-glass mt-3 h-3 w-16 rounded" />
              </div>
            ))
          ) : (
            mobileOverviewCards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.id}
                  className="min-h-[108px] rounded-2xl border border-white/10 bg-white/10 p-4 shadow-neo dark:bg-darkCard/70 dark:shadow-dark"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-lightMuted dark:text-darkMuted">
                        {card.label}
                      </div>
                      <div className="mt-3 text-2xl font-semibold text-lightText dark:text-darkText">
                        {card.value}
                      </div>
                    </div>
                    <Icon className={`h-5 w-5 shrink-0 ${card.iconClass}`} />
                  </div>
                  <div className="mt-3 text-xs text-lightMuted dark:text-darkMuted">
                    {card.detail}
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="hidden grid-cols-1 gap-3 sm:grid sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
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
                  Across all poultry flocks
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
                  <div className="text-sm text-lightMuted dark:text-darkMuted">Active flocks</div>
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
                    <h2 className="font-header font-semibold">Active flocks</h2>
                    <p className="text-xs text-lightMuted dark:text-darkMuted">
                      Quick look at active poultry flocks.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-lightMuted dark:text-darkMuted">
                      {filteredGroupCards.length} flocks
                    </span>
                    <div className="hidden md:flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => scrollActiveGroups(-1)}
                        aria-label="Scroll active flocks left"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition text-lightText dark:text-darkText disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={filteredGroupCards.length === 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollActiveGroups(1)}
                        aria-label="Scroll active flocks right"
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
                      No flocks match your filters.
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
                                    {typeEmoji(batch.type)} {formatType(batch.type)}
                                    {batch.keepingMethod ? ` · ${formatKeepingMethod(batch.keepingMethod)}` : ""}
                                    {` · ${batch.ageWeeks} wk`}
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
                                  title="Edit flock"
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
                                  title="Delete flock"
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
                                    {typeEmoji(batch.type)} {formatType(batch.type)}
                                    {batch.keepingMethod ? ` · ${formatKeepingMethod(batch.keepingMethod)}` : ""}
                                    {` · ${batch.ageWeeks} wk`}
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
                                  title="Edit flock"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    askDelete(batch);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-status-danger"
                                  title="Delete flock"
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

              <div className="sm:hidden">
                <MobileAccordionCard
                  title="Stock by type"
                  description="Open this chart when you want to compare live poultry counts by type."
                  icon={<Feather className="h-4 w-4" />}
                >
                  <div className="rounded-xl bg-white/10 p-4 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-header font-semibold">Stock by type</h2>
                        <p className="text-xs text-lightMuted dark:text-darkMuted">
                          Live count by animal type.
                        </p>
                      </div>
                      <span className="text-xs text-right leading-tight text-lightMuted dark:text-darkMuted">
                        Updated {formatDateTime(metaLastUpdated)}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 items-center">
                      <div className="h-[180px] w-full">
                        {typeBreakdown.length === 0 ? (
                          <div className="flex h-full w-full items-center justify-center text-sm text-lightMuted dark:text-darkMuted">
                            No type breakdown data yet.
                          </div>
                        ) : (
                          <Doughnut data={typeDonutData} options={typeDonutOptions} />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-nowrap gap-3 overflow-x-auto pb-1 hide-scrollbar">
                        {typeBreakdown.map((entry) => (
                          <div
                            key={`mobile-type-${entry.type}`}
                            className="flex min-w-[160px] max-w-[200px] shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3.5 py-2.5 shadow-soft dark:bg-darkCard/70"
                          >
                            <span className="text-lg">{typeEmoji(entry.type)}</span>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold leading-tight text-lightText dark:text-darkText">
                                {entry.label}
                              </div>
                              <div className="text-xs leading-tight text-lightMuted dark:text-darkMuted">
                                {formatNumber(entry.count)} birds
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </MobileAccordionCard>
              </div>

              <div className="hidden rounded-xl bg-white/10 p-4 shadow-neo dark:bg-darkCard/70 dark:shadow-dark sm:block">
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
                    <h2 className="font-header font-semibold">Flock list</h2>
                    <p className="text-xs text-lightMuted dark:text-darkMuted">
                      Each row below is one poultry flock that you can review or update.
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
                        Show everything
                      </button>
                    )}
                    <button
                      onClick={() => setTrashOpen(true)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200 transition font-body"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Deleted flocks</span>
                    </button>
                  </div>
                </div>

                {!loading && (hasActiveFilters || (!hasData && totalGroupes > 0)) ? (
                  <div className="mt-4">
                    <FilteredResultsHint
                      summaryLabel="poultry flocks"
                      tableLabel="flock list"
                      hasFilters={hasActiveFilters}
                      onClear={clearFilters}
                    />
                  </div>
                ) : null}

                {loading ? (
                  <div className="overflow-x-auto md:overflow-visible hide-scrollbar mt-4">
                    <div className="space-y-3" aria-hidden="true">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <div
                          key={`poultry-row-skeleton-${idx}`}
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
                              <th className="text-left whitespace-nowrap">Flock</th>
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
                                    <div className="flex flex-col">
                                      <span>{formatType(item.type)}</span>
                                      {item.keepingMethod && (
                                        <span className="text-[10px] text-lightMuted dark:text-darkMuted">
                                          {formatKeepingMethod(item.keepingMethod)}
                                        </span>
                                      )}
                                    </div>
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
                                        title="Edit flock"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          askDelete(item);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/5 text-status-danger"
                                        title="Delete flock"
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
                            <th className="text-left whitespace-nowrap">Flock</th>
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
                                  <div className="flex items-start gap-2">
                                    <span>{typeEmoji(item.type)}</span>
                                    <div className="flex flex-col">
                                      <span>{formatType(item.type)}</span>
                                      {item.keepingMethod && (
                                        <span className="text-[11px] text-lightMuted dark:text-darkMuted">
                                          {formatKeepingMethod(item.keepingMethod)}
                                        </span>
                                      )}
                                    </div>
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
                                      title="Edit flock"
                                    >
                                      <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        askDelete(item);
                                      }}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-status-danger"
                                      title="Delete flock"
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
                          ? "No flocks match what you selected"
                          : "No flocks yet"}
                      </h4>
                      <p className="text-xs text-lightMuted dark:text-darkMuted leading-relaxed">
                        {hasActiveFilters
                          ? "Show everything to see more results."
                          : "Add your first poultry flock to start tracking."}
                      </p>
                      <button
                        className="mt-2 w-full sm:w-auto px-5 py-2 bg-accent-primary text-white rounded-lg transition hover:opacity-90 active:scale-[0.98]"
                        onClick={hasActiveFilters ? clearFilters : openCreate}
                      >
                        {hasActiveFilters ? "Show everything" : "Add Flock"}
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
                    <option value="">Select flock to update</option>
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
            title={detailItem?.batchName || "Poultry Details"}
            subtitle={
              detailItem?.id ? `Flock ID #${detailItem.id}` : "Poultry Details"
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
                    askDelete(detailItem);
                  }
                : undefined
            }
          />

          <ConfirmModal
            open={confirmOpen}
            title="Delete flock"
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
            title="Deleted flocks"
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
              { key: "batchName", label: "Flock" },
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
            onSuccess={(saved) => {
              setModalOpen(false);
              setEditing(null);
              const pendingOffline = isOfflinePendingRecord(saved);

              setItems((current) => {
                if (editing) {
                  return current.map((item) => (item.id === saved.id ? saved : item));
                }
                return [saved, ...current];
              });

              setToast({
                message: pendingOffline
                  ? "Flock saved offline. It will sync automatically."
                  : `Flock ${editing ? "updated" : "created"}`,
                type: pendingOffline ? "info" : "success",
<<<<<<< HEAD
                actionLabel: pendingOffline ? "" : "View item",
                onAction: pendingOffline ? undefined : () => openDetails(saved),
                duration: pendingOffline ? 3000 : 5200,
=======
>>>>>>> 0babf4d (Update frontend application)
              });
              if (!pendingOffline) {
                fetchList(meta.page);
                fetchOverview();
              }
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
            duration={toast.duration}
            actionLabel={toast.actionLabel}
            onAction={toast.onAction}
            onClose={() => setToast({ message: "", type: "info" })}
          />
      </div>
    </DashboardLayout>
  );
}

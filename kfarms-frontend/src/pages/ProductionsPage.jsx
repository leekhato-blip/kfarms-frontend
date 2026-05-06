import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Egg,
  FileText,
  Package2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import SummaryCard from "../components/SummaryCard";
import FarmerGuideCard from "../components/FarmerGuideCard";
import FilteredResultsHint from "../components/FilteredResultsHint";
import MobileAccordionCard from "../components/MobileAccordionCard";
import ProductionChart from "../components/ProductionChart";
import EggProductionFormModal from "../components/EggProductionFormModal";
import ItemDetailsModal from "../components/ItemDetailsModal";
import ConfirmModal from "../components/ConfirmModal";
import GlassToast from "../components/GlassToast";
import TrashModal from "../components/TrashModal";
import ExportModal from "../components/ExportModal";
import { useTenant } from "../tenant/TenantContext";
import {
  deleteEggRecord,
  getDeletedEggRecords,
  getEggRecords,
  getEggSummary,
  permanentDeleteEggRecord,
  restoreEggRecord,
} from "../services/eggProductionService";
import { exportReport } from "../services/reportService";
import { getLivestock } from "../services/livestockService";
import useQuickCreateModal from "../hooks/useQuickCreateModal";
import { isOfflinePendingRecord } from "../offline/offlineResources";
import { useOfflineSyncRefresh } from "../offline/useOfflineSyncRefresh";

const EMPTY_SUMMARY = {
  totalRecords: 0,
  activeBatchCount: 0,
  totalGoodEggs: 0,
  totalCracked: 0,
  totalCratesProduced: 0,
  todayGoodEggs: 0,
  todayCracked: 0,
  todayCratesProduced: 0,
  monthlyGoodEggs: 0,
  monthlyCracked: 0,
  monthlyCratesProduced: 0,
  averageGoodEggsPerRecord: 0,
  lastCollectionDate: null,
  countByBatch: {},
  monthlyProduction: {},
  topBatch: null,
};

const CREATOR_ROLES = new Set(["OWNER", "ADMIN", "MANAGER", "STAFF"]);
const EDITOR_ROLES = new Set(["OWNER", "ADMIN", "MANAGER"]);
const DELETER_ROLES = new Set(["OWNER", "ADMIN"]);

function normalizeRole(value) {
  return String(value || "").trim().toUpperCase();
}

function formatCount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0";
  return numeric.toLocaleString();
}

function formatDate(value) {
  if (!value) return "-";
  const parsed = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "-";
  const parsed = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMonthLabel(value) {
  if (!value) return "-";
  const [year, month] = String(value).split("-");
  const parsed = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

function getYearFromMonthKey(value) {
  const year = Number(String(value || "").split("-")[0]);
  return Number.isFinite(year) ? year : null;
}

function buildCalendarYearSeries(entries, year) {
  const totals = Array.isArray(entries)
    ? entries.reduce((acc, item) => {
        const monthKey = String(item?.date || "");
        const itemYear = getYearFromMonthKey(monthKey);
        if (itemYear !== year) return acc;

        const month = Number(monthKey.split("-")[1]);
        if (!Number.isFinite(month) || month < 1 || month > 12) return acc;

        const normalizedKey = `${year}-${String(month).padStart(2, "0")}`;
        acc[normalizedKey] = (acc[normalizedKey] || 0) + (Number(item?.quantity) || 0);
        return acc;
      }, {})
    : {};

  return Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");
    const date = `${year}-${month}`;
    return {
      date,
      quantity: Number(totals[date] || 0),
    };
  });
}

function getErrorMessage(error, fallback) {
  if (error?.response?.status === 403) {
    return "You do not have permission to perform this action";
  }

  return error?.response?.data?.message || fallback;
}

function getRowLabel(record) {
  if (!record) return "production record";
  const batch = record.batchName || "this batch";
  const date = formatDate(record.collectionDate);
  return `${batch} on ${date}`;
}

export default function ProductionsPage() {
  const { activeTenant } = useTenant();
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [records, setRecords] = useState([]);
  const [layerBatches, setLayerBatches] = useState([]);
  const [selectedProductionYear, setSelectedProductionYear] = useState(
    new Date().getFullYear(),
  );
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({ livestockId: "", collectionDate: "" });
  const [meta, setMeta] = useState({
    page: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
    totalItems: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });

  const tenantRole = normalizeRole(activeTenant?.myRole);
  const canCreate = CREATOR_ROLES.has(tenantRole);
  const canEdit = EDITOR_ROLES.has(tenantRole);
  const canDelete = DELETER_ROLES.has(tenantRole);
  const hasLayerBatches = layerBatches.length > 0;
  const hasActiveFilters = Boolean(filters.livestockId || filters.collectionDate);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await getEggSummary();
      setSummary({
        ...EMPTY_SUMMARY,
        ...(data || {}),
      });
    } catch (error) {
      console.error("Failed to fetch egg summary", error);
      setSummary(EMPTY_SUMMARY);
      setToast({
        message: "Could not load production summary",
        type: "error",
      });
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchRecords = useCallback(async (page = 0) => {
    setRecordsLoading(true);
    try {
      const data = await getEggRecords({
        page,
        size: 10,
        livestockId: filters.livestockId || undefined,
        collectionDate: filters.collectionDate || undefined,
      });

      setRecords(data?.items || []);
      setMeta({
        page: data?.page ?? 0,
        totalPages: data?.totalPages ?? 0,
        hasNext: data?.hasNext ?? false,
        hasPrevious: data?.hasPrevious ?? false,
        totalItems: data?.totalItems ?? 0,
      });
    } catch (error) {
      console.error("Failed to fetch egg records", error);
      setRecords([]);
      setMeta({
        page: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
        totalItems: 0,
      });
      setToast({
        message: "Could not load production records",
        type: "error",
      });
    } finally {
      setRecordsLoading(false);
    }
  }, [filters.collectionDate, filters.livestockId]);

  const fetchLayerBatches = useCallback(async () => {
    try {
      const data = await getLivestock({ page: 0, size: 200, type: "LAYER" });
      setLayerBatches(data?.items || []);
    } catch (error) {
      console.error("Failed to fetch layer batches", error);
      setLayerBatches([]);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchLayerBatches();
  }, [fetchLayerBatches, fetchSummary]);

  useEffect(() => {
    fetchRecords(0);
  }, [fetchRecords]);

  const productionSeries = useMemo(() => {
    const entries = Object.entries(summary?.monthlyProduction || {})
      .map(([date, quantity]) => ({
        date,
        quantity: Number(quantity) || 0,
      }))
      .sort((left, right) => String(left.date).localeCompare(String(right.date)));

    return entries;
  }, [summary?.monthlyProduction]);

  const productionYears = useMemo(() => {
    const years = productionSeries
      .map((item) => getYearFromMonthKey(item.date))
      .filter((year) => Number.isFinite(year));

    return Array.from(new Set(years)).sort((left, right) => right - left);
  }, [productionSeries]);

  const activeProductionYear = productionYears.includes(selectedProductionYear)
    ? selectedProductionYear
    : (productionYears[0] ?? new Date().getFullYear());

  useEffect(() => {
    if (selectedProductionYear !== activeProductionYear) {
      setSelectedProductionYear(activeProductionYear);
    }
  }, [activeProductionYear, selectedProductionYear]);

  const selectedYearProductionSeries = useMemo(
    () =>
      productionSeries.filter((item) => getYearFromMonthKey(item.date) === activeProductionYear),
    [activeProductionYear, productionSeries],
  );

  const chartProductionSeries = useMemo(
    () => buildCalendarYearSeries(productionSeries, activeProductionYear),
    [activeProductionYear, productionSeries],
  );

  const productionOverview = useMemo(() => {
    if (selectedYearProductionSeries.length === 0) {
      return {
        totalMonths: 0,
        totalEggs: 0,
        averageMonthlyEggs: 0,
        latestMonth: null,
        peakMonth: null,
        peakShare: 0,
      };
    }

    const totalEggs = selectedYearProductionSeries.reduce((sum, item) => sum + item.quantity, 0);
    const latestMonth =
      selectedYearProductionSeries[selectedYearProductionSeries.length - 1] || null;
    const peakMonth = selectedYearProductionSeries.reduce((best, item) => {
      if (!best || item.quantity > best.quantity) return item;
      return best;
    }, null);

    return {
      totalMonths: selectedYearProductionSeries.length,
      totalEggs,
      averageMonthlyEggs: Math.round(totalEggs / selectedYearProductionSeries.length),
      latestMonth,
      peakMonth,
      peakShare:
        peakMonth && totalEggs > 0 ? Math.round((peakMonth.quantity / totalEggs) * 100) : 0,
    };
  }, [selectedYearProductionSeries]);

  const batchPerformance = useMemo(() => {
    const entries = Object.entries(summary?.countByBatch || {})
      .map(([label, value]) => ({
        label,
        value: Number(value) || 0,
      }))
      .filter((item) => item.value > 0)
      .sort((left, right) => right.value - left.value);

    const total = entries.reduce((sum, item) => sum + item.value, 0);

    return entries.map((item) => ({
      ...item,
      share: total > 0 ? Math.round((item.value / total) * 100) : 0,
    }));
  }, [summary?.countByBatch]);

  const leadBatch = batchPerformance[0] || null;
  const visibleBatchPerformance = batchPerformance.slice(0, 5);

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([
        fetchSummary(),
        fetchLayerBatches(),
        fetchRecords(meta.page),
      ]);
      setToast({ message: "Productions refreshed", type: "success" });
    } catch {
      setToast({ message: "Failed to refresh productions", type: "error" });
    } finally {
      setRefreshing(false);
    }
  }

  const refreshPageData = useCallback(async () => {
    await Promise.all([fetchSummary(), fetchRecords(meta.page ?? 0)]);
  }, [fetchRecords, fetchSummary, meta.page]);

  useOfflineSyncRefresh(refreshPageData);

  function clearFilters() {
    setFilters({ livestockId: "", collectionDate: "" });
  }

  function openCreate() {
    if (!canCreate) return;
    setEditing(null);
    setModalOpen(true);
  }

  useQuickCreateModal(() => {
    openCreate();
  });

  function openEdit(record) {
    if (!canEdit) return;
    setEditing(record);
    setModalOpen(true);
  }

  function openDetails(record) {
    setDetailItem(record);
  }

  function closeDetails() {
    setDetailItem(null);
  }

  function askDelete(record) {
    if (!canDelete) return;
    setDeleteTarget(record);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await deleteEggRecord(deleteTarget.id);
      if (detailItem?.id === deleteTarget.id) {
        closeDetails();
      }
      const nextPage = records.length === 1 && meta.page > 0 ? meta.page - 1 : meta.page;
      await Promise.all([fetchSummary(), fetchRecords(nextPage)]);
      setToast({
        message: `Moved ${getRowLabel(deleteTarget)} to trash`,
        type: "success",
      });
    } catch (error) {
      console.error("Failed to delete egg record", error);
      setToast({
        message: getErrorMessage(error, "Failed to delete production record"),
        type: "error",
      });
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  }

  async function handleExport({ type, category, start, end }) {
    if (exporting) return;
    setExporting(true);
    try {
      const { blob, filename } = await exportReport({
        type,
        category,
        start,
        end,
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `${category || "eggs"}.${type || "csv"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setExportOpen(false);
      setToast({
        message: "Production export downloaded successfully",
        type: "success",
      });
    } catch (error) {
      console.error("Failed to export production data", error);
      setToast({
        message: getErrorMessage(error, "Could not export production data"),
        type: "error",
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="font-body space-y-8 animate-fadeIn">
        <div className="space-y-4">
          <div className="relative isolate overflow-hidden rounded-2xl border border-sky-200/70 bg-slate-50/85 p-5 shadow-neo dark:border-sky-500/20 dark:bg-[#061024]/90 dark:shadow-[0_22px_40px_rgba(2,8,24,0.45)] md:p-6">
            <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(108deg,rgba(37,99,235,0.17)_0%,rgba(14,116,144,0.14)_48%,rgba(16,185,129,0.12)_100%),radial-gradient(circle_at_12%_22%,rgba(56,189,248,0.13),transparent_43%),radial-gradient(circle_at_90%_22%,rgba(16,185,129,0.14),transparent_38%)] dark:bg-[linear-gradient(108deg,rgba(6,19,43,0.96)_0%,rgba(7,32,63,0.9)_48%,rgba(6,58,55,0.84)_100%),radial-gradient(circle_at_12%_22%,rgba(56,189,248,0.16),transparent_43%),radial-gradient(circle_at_90%_22%,rgba(16,185,129,0.18),transparent_38%)]" />

            <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-accent-primary/35 bg-accent-primary/12 px-3 py-1 text-sm font-semibold text-accent-primary dark:border-blue-300/35 dark:bg-blue-500/20 dark:text-blue-100">
                  <Egg className="h-3.5 w-3.5" />
                  Egg records
                </span>
                <h1 className="mt-3 text-3xl font-semibold font-header tracking-tight text-slate-900 dark:text-slate-50">
                  Egg production
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:text-base font-body">
                  Record egg collections, see recent output, and keep a clear history for each layer batch.
                </p>
              </div>

              <div className="grid w-full grid-cols-2 items-center gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-start lg:justify-end">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh productions"
                  aria-label="Refresh productions"
                  className={`order-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white/45 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 disabled:opacity-60 sm:order-none sm:w-auto dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20 ${
                    refreshing ? "cursor-not-allowed opacity-70" : ""
                  }`}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={openCreate}
                  disabled={!canCreate || !hasLayerBatches}
                  className="order-1 col-span-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:order-none sm:col-span-1 sm:w-auto"
                  title={
                    !hasLayerBatches
                      ? "Add a layer flock in Poultry first"
                      : !canCreate
                        ? "You do not have permission to add records"
                        : "Record egg production"
                  }
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  Record eggs
                </button>
                <button
                  type="button"
                  onClick={() => setExportOpen(true)}
                  disabled={exporting}
                  className="order-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white/45 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 disabled:opacity-60 sm:order-none sm:w-auto dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20"
                  title="Download egg report"
                >
                  <Download className="h-4 w-4" />
                  {exporting ? "Downloading..." : "Download"}
                </button>
              </div>
            </div>

            <div className="relative z-10 mt-3 text-left text-[11px] font-medium text-slate-600 dark:text-slate-200/80 sm:text-right">
              {summary.lastCollectionDate ? `Last collection ${formatDate(summary.lastCollectionDate)}` : "Live production data"}
            </div>
          </div>

          <FarmerGuideCard
            icon={Egg}
            title="How to use egg production"
            description="This page is for simple daily egg collection records."
            storageKey="productions-guide"
            steps={[
              "Use \"Record eggs\" after a collection is counted.",
              "Check the top cards first to see today, this month, and total output.",
              "Use the find boxes only when you want to find one batch or one day.",
            ]}
            tip="The top boxes show all egg activity. The table below may show fewer rows when the find boxes are in use."
          />
        </div>

        {!hasLayerBatches && (
          <section className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-800 shadow-neo dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-100">
            No active layer flock was found for this farm. Add a layer flock in Poultry first to start recording egg production.
          </section>
        )}

        {summaryLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`production-summary-skeleton-${idx}`}
                className="rounded-2xl bg-white/10 p-5 shadow-neo dark:bg-darkCard/70 dark:shadow-dark lg:p-6"
                aria-hidden="true"
              >
                <div className="flex items-center gap-4">
                  <div className="skeleton-glass h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton-glass h-4 w-24 rounded" />
                    <div className="skeleton-glass h-6 w-20 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-4">
            <SummaryCard
              icon={<FileText />}
              title="Records"
              value={formatCount(summary.totalRecords)}
              subtitle={`${formatCount(summary.activeBatchCount)} active layer batches`}
            />
            <SummaryCard
              icon={<Egg />}
              title="Today's Output"
              value={formatCount(summary.todayGoodEggs)}
              subtitle={`${formatCount(summary.todayCracked)} cracked today`}
            />
            <SummaryCard
              icon={<CalendarDays />}
              title="This Month"
              value={formatCount(summary.monthlyGoodEggs)}
              subtitle={`${formatCount(summary.monthlyCratesProduced)} crates this month`}
            />
            <SummaryCard
              icon={<Package2 />}
              title="Total Good Eggs"
              value={formatCount(summary.totalGoodEggs)}
              subtitle={`${formatCount(summary.totalCratesProduced)} crates all-time`}
            />
          </div>
        )}

        <div className="md:hidden">
          <MobileAccordionCard
            title="Egg output over time"
            description="Open this chart when you want to review monthly production movement."
            icon={<Egg className="h-4 w-4" />}
          >
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
              <div className="mb-4 flex flex-col gap-3">
                <div>
                  <h3 className="text-lg font-header text-slate-900 dark:text-slate-100">
                    Egg output over time
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Monthly egg output for {activeProductionYear} based on recorded collections.
                  </p>
                </div>
                <div className="flex flex-col items-stretch gap-2">
                  <label className="inline-flex w-full items-center justify-between gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                    <span className="uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Year
                    </span>
                    <select
                      value={activeProductionYear}
                      onChange={(event) => setSelectedProductionYear(Number(event.target.value))}
                      className="min-w-[88px] bg-transparent pr-5 text-right text-sm font-semibold text-slate-700 outline-none dark:text-slate-100"
                      title="Select production year"
                      aria-label="Select production year"
                    >
                      {productionYears.length === 0 ? (
                        <option value={activeProductionYear}>{activeProductionYear}</option>
                      ) : (
                        productionYears.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))
                      )}
                    </select>
                  </label>

                  <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200/80 bg-white/70 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                    {productionOverview.totalMonths > 0
                      ? `${productionOverview.totalMonths} months in ${activeProductionYear}`
                      : `No monthly trail for ${activeProductionYear}`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-2xl border border-slate-200/70 bg-white/55 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="h-[260px]">
                    <ProductionChart
                      loading={summaryLoading}
                      productionData={chartProductionSeries}
                      onCreate={canCreate && hasLayerBatches ? openCreate : undefined}
                      actionHref={null}
                      actionLabel="Record Production"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Peak Month
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                      {productionOverview.peakMonth
                        ? formatMonthLabel(productionOverview.peakMonth.date)
                        : "No peak yet"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {productionOverview.peakMonth
                        ? `${formatCount(productionOverview.peakMonth.quantity)} eggs in the strongest month`
                        : "Monthly performance appears here once records exist"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Latest Logged
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                      {productionOverview.latestMonth
                        ? formatMonthLabel(productionOverview.latestMonth.date)
                        : "No month logged"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {productionOverview.latestMonth
                        ? `${formatCount(productionOverview.latestMonth.quantity)} eggs in the most recent month`
                        : "Add records to build a fresh production trail"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Avg / Month
                      </div>
                      <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                        {formatCount(productionOverview.averageMonthlyEggs)} eggs
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Across months recorded in {activeProductionYear}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Peak Share
                      </div>
                      <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                        {productionOverview.peakShare}%
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Of {activeProductionYear} egg total
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      <span>Production Span</span>
                      <span>
                        {productionOverview.totalMonths > 0
                          ? `${productionOverview.totalMonths} months`
                          : "Waiting"}
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-accent-primary via-sky-400 to-emerald-400 transition-all duration-500"
                        style={{
                          width: `${Math.max(
                            productionOverview.totalMonths > 0 ? productionOverview.peakShare : 0,
                            productionOverview.totalMonths > 0 ? 14 : 0,
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full border border-white/50 bg-white/45 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/15 dark:bg-white/10 dark:text-slate-200">
                        Total {formatCount(productionOverview.totalEggs)} eggs in {activeProductionYear}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-white/50 bg-white/45 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/15 dark:bg-white/10 dark:text-slate-200">
                        Viewing January to December
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MobileAccordionCard>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.95fr)]">
          <div className="hidden rounded-2xl border border-white/10 bg-white/10 p-4 shadow-neo dark:bg-darkCard/70 dark:shadow-dark md:block">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-header text-slate-900 dark:text-slate-100">
                  Egg output over time
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Monthly egg output for {activeProductionYear} based on recorded collections.
                </p>
              </div>
              <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                <label className="inline-flex w-full items-center justify-between gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-medium text-slate-600 sm:w-auto sm:justify-start sm:py-1.5 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                  <span className="uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Year
                  </span>
                  <select
                    value={activeProductionYear}
                    onChange={(event) => setSelectedProductionYear(Number(event.target.value))}
                    className="min-w-[88px] bg-transparent pr-5 text-right text-sm font-semibold text-slate-700 outline-none sm:text-left dark:text-slate-100"
                    title="Select production year"
                    aria-label="Select production year"
                  >
                    {productionYears.length === 0 ? (
                      <option value={activeProductionYear}>{activeProductionYear}</option>
                    ) : (
                      productionYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200/80 bg-white/70 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 sm:min-h-0 sm:justify-start sm:py-1 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                  {productionOverview.totalMonths > 0
                    ? `${productionOverview.totalMonths} months in ${activeProductionYear}`
                    : `No monthly trail for ${activeProductionYear}`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_280px]">
              <div className="rounded-2xl border border-slate-200/70 bg-white/55 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="h-[260px] sm:h-[300px] md:h-[340px]">
                  <ProductionChart
                    loading={summaryLoading}
                    productionData={chartProductionSeries}
                    onCreate={canCreate && hasLayerBatches ? openCreate : undefined}
                    actionHref={null}
                    actionLabel="Record Production"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Peak Month
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {productionOverview.peakMonth
                      ? formatMonthLabel(productionOverview.peakMonth.date)
                      : "No peak yet"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {productionOverview.peakMonth
                      ? `${formatCount(productionOverview.peakMonth.quantity)} eggs in the strongest month`
                      : "Monthly performance appears here once records exist"}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Latest Logged
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {productionOverview.latestMonth
                      ? formatMonthLabel(productionOverview.latestMonth.date)
                      : "No month logged"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {productionOverview.latestMonth
                      ? `${formatCount(productionOverview.latestMonth.quantity)} eggs in the most recent month`
                      : "Add records to build a fresh production trail"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Avg / Month
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                      {formatCount(productionOverview.averageMonthlyEggs)} eggs
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Across months recorded in {activeProductionYear}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Peak Share
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                      {productionOverview.peakShare}%
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Of {activeProductionYear} egg total
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    <span>Production Span</span>
                    <span>
                      {productionOverview.totalMonths > 0
                        ? `${productionOverview.totalMonths} months`
                        : "Waiting"}
                    </span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-accent-primary via-sky-400 to-emerald-400 transition-all duration-500"
                      style={{
                        width: `${Math.max(
                          productionOverview.totalMonths > 0 ? productionOverview.peakShare : 0,
                          productionOverview.totalMonths > 0 ? 14 : 0,
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-white/50 bg-white/45 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/15 dark:bg-white/10 dark:text-slate-200">
                      Total {formatCount(productionOverview.totalEggs)} eggs in {activeProductionYear}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-white/50 bg-white/45 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/15 dark:bg-white/10 dark:text-slate-200">
                      Viewing January to December
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-header text-slate-900 dark:text-slate-100">
                  Batch Output
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Compare production strength across your layer batches.
                </p>
              </div>
            </div>

            {summaryLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={`batch-performance-skeleton-${idx}`} className="space-y-2">
                    <div className="skeleton-glass h-3 w-28 rounded" />
                    <div className="skeleton-glass h-2 w-full rounded" />
                  </div>
                ))}
              </div>
            ) : batchPerformance.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-center">
                <div className="max-w-sm space-y-3">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                    <Egg className="h-7 w-7" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    No batch output yet
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    Production totals by batch will appear here once collections are recorded.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Lead Batch
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                      {leadBatch?.label || "-"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {leadBatch ? `${formatCount(leadBatch.value)} good eggs` : "No output yet"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Avg / Record
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                      {formatCount(summary.averageGoodEggsPerRecord)} eggs
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Based on all active production entries
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {visibleBatchPerformance.map((item) => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-medium text-slate-800 dark:text-slate-100">
                          {item.label}
                        </span>
                        <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                          {formatCount(item.value)} eggs
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-amber-400 via-accent-primary to-sky-400"
                          style={{ width: `${Math.max(item.share, 6)}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.share}% of recorded good eggs
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white/10 p-4 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
          <p className="mb-3 text-xs font-body text-slate-500 dark:text-slate-400">
            Use these find boxes only when you want to find one batch or one day.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <select
              value={filters.livestockId}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  livestockId: event.target.value,
                }))
              }
              className="rounded-md border border-white/10 bg-lightCard px-3 py-2 text-sm outline-none dark:bg-darkCard"
              title="Filter by layer batch"
            >
              <option value="">All Layer Batches</option>
              {layerBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchName}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={filters.collectionDate}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  collectionDate: event.target.value,
                }))
              }
              className="rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none"
              title="Filter by collection date"
            />

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="inline-flex items-center justify-center rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-100"
            >
              Show everything
            </button>
          </div>
        </div>

        {!recordsLoading && (hasActiveFilters || (summary.totalRecords > 0 && records.length === 0)) ? (
          <FilteredResultsHint
            summaryLabel="egg production records"
            tableLabel="production table"
            hasFilters={hasActiveFilters}
            onClear={clearFilters}
          />
        ) : null}

        <div className="rounded-xl border border-white/10 bg-white/10 p-6 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-body text-slate-500 dark:text-slate-400">
              Each row below is one egg record that you can review, edit, or delete.
            </p>
            <button
              type="button"
              onClick={() => setTrashOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 font-medium text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
              title="View deleted production records"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden text-sm font-body sm:inline">Deleted records</span>
            </button>
          </div>

          {recordsLoading ? (
            <div className="space-y-3" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={`production-row-skeleton-${idx}`} className="skeleton-glass h-10 rounded-md" />
              ))}
            </div>
          ) : records.length > 0 ? (
            <>
              {isMobileViewport ? (
                <div className="space-y-3">
                  {records.map((record) => (
                    <article
                      key={record.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 dark:bg-white/[0.03]"
                    >
                      <button
                        type="button"
                        onClick={() => openDetails(record)}
                        className="w-full text-left"
                        aria-label={`View details for ${getRowLabel(record)}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {record.batchName || "-"}
                            </div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {formatDate(record.collectionDate)}
                            </div>
                          </div>
                          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
                            {formatCount(record.cratesProduced)} crates
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              Good eggs:
                            </span>{" "}
                            {formatCount(record.goodEggs)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              Cracked:
                            </span>{" "}
                            {formatCount(record.damagedEggs)}
                          </div>
                          <div className="col-span-2">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              Note:
                            </span>{" "}
                            {record.note || "—"}
                          </div>
                        </div>
                      </button>

                      {canEdit || canDelete ? (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {canEdit ? (
                            <button
                              type="button"
                              onClick={() => openEdit(record)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-accent-primary/25 bg-accent-primary/10 px-3 py-2 text-xs font-semibold text-accent-primary"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => askDelete(record)}
                              className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-200 ${
                                canEdit ? "" : "col-span-2"
                              }`}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <div className="mt-3 text-xs text-slate-400">
                          Tap the card to view details.
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] border-separate border-spacing-y-2 text-sm [&_th]:px-4 [&_th]:pb-2 [&_td]:px-4 [&_td]:py-3 [&_td:first-child]:rounded-l-xl [&_td:last-child]:rounded-r-xl [&_tbody_tr]:bg-white/5 [&_tbody_tr]:shadow-soft [&_tbody_tr]:transition [&_tbody_tr:hover]:shadow-neo dark:[&_tbody_tr]:bg-darkCard/60">
                    <thead className="text-lightText font-body dark:text-darkText">
                      <tr className="font-header text-[11px] uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">
                        <th className="py-3 text-left whitespace-nowrap">Date</th>
                        <th className="text-left whitespace-nowrap">Batch</th>
                        <th className="text-right whitespace-nowrap">Good Eggs</th>
                        <th className="text-right whitespace-nowrap">Cracked</th>
                        <th className="text-right whitespace-nowrap">Crates</th>
                        <th className="text-left whitespace-nowrap">Note</th>
                        <th className="text-center whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => (
                        <tr
                          key={record.id}
                          onClick={() => openDetails(record)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openDetails(record);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`View details for ${getRowLabel(record)}`}
                          className="cursor-pointer border-b font-body hover:bg-accent-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50 dark:border-white/10 dark:hover:bg-white/5"
                        >
                          <td className="py-3 text-left">{formatDate(record.collectionDate)}</td>
                          <td className="text-left font-semibold text-slate-900 dark:text-slate-100">
                            {record.batchName || "-"}
                          </td>
                          <td className="text-right">{formatCount(record.goodEggs)}</td>
                          <td className="text-right">{formatCount(record.damagedEggs)}</td>
                          <td className="text-right">{formatCount(record.cratesProduced)}</td>
                          <td className="max-w-[240px] text-left text-slate-500 dark:text-slate-400">
                            <span className="block truncate">{record.note || "-"}</span>
                          </td>
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openEdit(record);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-accent-primary hover:bg-white/10"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    askDelete(record);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-status-danger hover:bg-white/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={!meta.hasPrevious}
                  onClick={() => fetchRecords(Math.max(meta.page - 1, 0))}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Page {meta.totalPages === 0 ? 0 : meta.page + 1} of {Math.max(meta.totalPages, 1)}
                </div>
                <button
                  type="button"
                  disabled={!meta.hasNext}
                  onClick={() => fetchRecords(meta.page + 1)}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                <Egg className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                No production records yet
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {hasActiveFilters
                  ? "No records match what you selected. Show everything to see more results."
                  : hasLayerBatches
                    ? "Start logging egg collections to populate this page."
                    : "Add a layer batch first, then start recording production."}
              </p>
              {canCreate && hasLayerBatches && !hasActiveFilters && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  Record Production
                </button>
              )}
            </div>
          )}
        </div>

        <EggProductionFormModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          initialData={editing}
          layerBatches={layerBatches}
          onSuccess={async (saved) => {
            setModalOpen(false);
            setEditing(null);
            const pendingOffline = isOfflinePendingRecord(saved);

            setRecords((current) => {
              if (editing) {
                return current.map((record) => (record.id === saved.id ? saved : record));
              }
              return [saved, ...current];
            });

            if (!editing) {
              setMeta((current) => ({
                ...current,
                page: 0,
                totalItems: Number(current.totalItems || 0) + 1,
              }));
            }

            if (!pendingOffline) {
              await Promise.all([fetchSummary(), fetchRecords(editing ? meta.page : 0)]);
            }

            setToast({
              message: pendingOffline
                ? "Production record saved offline. It will sync automatically."
                : `Production record ${editing ? "updated" : "created"} successfully`,
              type: pendingOffline ? "info" : "success",
              actionLabel: pendingOffline ? "" : "View item",
              onAction: pendingOffline ? undefined : () => openDetails(saved),
              duration: pendingOffline ? 3000 : 5200,
            });
          }}
          onError={(error) => {
            setToast({
              message: getErrorMessage(error, "Could not save production record"),
              type: "error",
            });
          }}
        />

        <ItemDetailsModal
          open={Boolean(detailItem)}
          title={detailItem?.batchName || "Production Record"}
          subtitle={detailItem ? `Collection ${formatDate(detailItem.collectionDate)}` : undefined}
          status={{ label: "Active", color: "#22c55e" }}
          fields={[
            { label: "Batch", value: detailItem?.batchName },
            { label: "Collection Date", value: formatDate(detailItem?.collectionDate) },
            { label: "Good Eggs", value: formatCount(detailItem?.goodEggs) },
            { label: "Cracked Eggs", value: formatCount(detailItem?.damagedEggs) },
            { label: "Crates", value: formatCount(detailItem?.cratesProduced) },
            { label: "Created By", value: detailItem?.createdBy || "-" },
            { label: "Created At", value: formatDateTime(detailItem?.createdAt) },
            { label: "Updated At", value: formatDateTime(detailItem?.updatedAt) },
            { label: "Note", value: detailItem?.note || "-", full: true },
          ]}
          onClose={closeDetails}
          onEdit={canEdit && detailItem ? () => {
            closeDetails();
            openEdit(detailItem);
          } : undefined}
          onDelete={canDelete && detailItem ? () => {
            askDelete(detailItem);
          } : undefined}
        />

        <ConfirmModal
          open={confirmOpen}
          title="Delete Production Record"
          message={
            deleteTarget
              ? `Move ${getRowLabel(deleteTarget)} to trash?`
              : "Delete this production record?"
          }
          confirmText="Delete"
          cancelText="Cancel"
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={() => {
            if (deleting) return;
            setConfirmOpen(false);
            setDeleteTarget(null);
          }}
        />

        <TrashModal
          open={trashOpen}
          onClose={() => setTrashOpen(false)}
          title="Deleted Production Records"
          fetchData={({ page = 0, size = 10 }) => getDeletedEggRecords({ page, size })}
          onRestore={async (record) => {
            await restoreEggRecord(record.id);
            await Promise.all([fetchSummary(), fetchRecords(meta.page)]);
            setToast({
              message: `${getRowLabel(record)} restored successfully`,
              type: "success",
            });
          }}
          onPermanentDelete={async (record) => {
            try {
              await permanentDeleteEggRecord(record.id);
              await Promise.all([fetchSummary(), fetchRecords(meta.page)]);
              setToast({
                message: `${getRowLabel(record)} deleted permanently`,
                type: "success",
              });
            } catch (error) {
              console.error("Permanent delete failed", error);
              setToast({
                message: getErrorMessage(error, "Failed to delete production record permanently"),
                type: "error",
              });
              throw error;
            }
          }}
          columns={[
            { key: "collectionDate", label: "Date" },
            { key: "batchName", label: "Batch" },
            { key: "goodEggs", label: "Good Eggs", align: "right" },
            { key: "damagedEggs", label: "Cracked", align: "right" },
            { key: "cratesProduced", label: "Crates", align: "right" },
          ]}
          formatCell={(item, key) => {
            if (key === "collectionDate") return formatDate(item.collectionDate);
            if (key === "goodEggs" || key === "damagedEggs" || key === "cratesProduced") {
              return formatCount(item[key]);
            }
            return item?.[key] ?? "-";
          }}
        />

        <ExportModal
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          onSubmit={handleExport}
          exporting={exporting}
          categories={[{ label: "Productions", value: "eggs" }]}
          defaultCategory="eggs"
          defaultType="csv"
          defaultStart={filters.collectionDate || ""}
          defaultEnd={filters.collectionDate || ""}
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

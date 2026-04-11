import React from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import ProductionChart from "../components/ProductionChart";
import SummaryCard from "../components/SummaryCard";
import FeedPie from "../components/FeedPie";
import RecentTable from "../components/RecentTable";
import FarmerGuideCard from "../components/FarmerGuideCard";
import GlassToast from "../components/GlassToast";
import MobileAccordionCard from "../components/MobileAccordionCard";
import ExportModal from "../components/ExportModal";
import PlanUpgradePrompt from "../components/PlanUpgradePrompt";
import ConfirmModal from "../components/ConfirmModal";
import { useFetch } from "../hooks/useFetch";
import { detectFeedModule, resolveFeedColor } from "../utils/feedChart";
import { GiChicken } from "react-icons/gi";
import {
  ChevronRight,
  Download,
  Droplets,
  Egg,
  ListChecks,
  Package2,
  RefreshCw,
  Wallet,
  Wheat,
} from "lucide-react";
import RevenueExpenseChart from "../components/RevenueExpenseChart";
import UpcomingTaskPanel from "../components/UpcomingTaskPanel";
import FeedWatchlistPanel from "../components/FeedWatchlistPanel";
import HealthAlertsPanel from "../components/HealthAlertsPanel";
import { exportReport } from "../services/reportService";
import { adjustInventoryStock } from "../services/inventoryService";
import {
  getDashboardSummary,
  getFinanceSummary,
  getFeedWatchlist,
  getRecentActivities,
} from "../services/dashboardService";
import {
  acknowledgeHealthEvent,
  getHealthEvents,
  handleHealthEvent,
} from "../services/healthService";
import { isOfflinePendingRecord } from "../offline/offlineResources";
import { useTenant } from "../tenant/TenantContext";
import { isPlanAtLeast, normalizePlanId } from "../constants/plans";
import { FARM_MODULES, hasFarmModule } from "../tenant/tenantModules";
import {
  getInventoryItemName,
  getInventoryQuantity,
  getInventoryThreshold,
  getInventoryUnit,
  getRecommendedRestockQuantity,
} from "../utils/inventoryStock";

const EMPTY_ARRAY = [];
const MONTH_SHORT_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function PanelRefreshButton({ onClick, busy = false, label = "Refresh" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={label}
      aria-label={label}
      className={`inline-flex items-center justify-center rounded-md border border-slate-200 p-1.5 text-xs text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 ${
        busy ? "cursor-not-allowed opacity-70" : ""
      }`}
    >
      <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
    </button>
  );
}

function getProductionYear(value) {
  const year = Number(String(value || "").split("-")[0]);
  return Number.isFinite(year) ? year : null;
}

function buildProductionCalendarYear(entries, year) {
  const totals = Array.isArray(entries)
    ? entries.reduce((acc, item) => {
        const monthKey = String(item?.date || "");
        if (getProductionYear(monthKey) !== year) return acc;

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

function DashboardActionCard({
  to,
  icon,
  title,
  description,
  helperText,
  iconClassName = "",
}) {
  const IconComponent = icon;

  return (
    <Link
      to={to}
      className="group flex h-full flex-col rounded-2xl bg-lighCard p-3.5 shadow-neo transition hover:-translate-y-0.5 dark:bg-darkCard dark:shadow-dark sm:p-5 lg:p-6 xl:p-6"
    >
      <div className="flex h-full flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:gap-5">
        <div className="flex-shrink-0">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-neo sm:h-14 sm:w-14 lg:h-16 lg:w-16 ${iconClassName}`}
          >
            <IconComponent
              className="h-5 w-5 text-white sm:h-6 sm:w-6 lg:h-7 lg:w-7"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="flex min-w-0 w-full flex-1 flex-col gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-gray-900 sm:text-lg dark:text-white">
              {title}
            </h3>
            <p className="mt-1 hidden text-sm leading-relaxed text-gray-600 sm:block dark:text-gray-300">
              {description}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-gray-500 sm:mt-3 sm:text-sm dark:text-gray-300/80">
              {helperText}
            </p>
          </div>

          <div className="mt-auto flex shrink-0 justify-start">
            <span className="inline-flex min-h-10 w-full items-center justify-center gap-1 rounded-xl bg-accent-primary/10 px-3.5 py-2 text-sm font-semibold text-accent-primary sm:min-h-0 sm:w-auto sm:justify-start sm:rounded-full sm:px-3 sm:py-1.5">
              Open
              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function isFeedLabelVisibleForWorkspace(label, { poultryEnabled, fishEnabled }) {
  const moduleId = detectFeedModule(label);
  if (moduleId === FARM_MODULES.FISH_FARMING) return fishEnabled;
  if (moduleId === FARM_MODULES.POULTRY) return poultryEnabled;
  return true;
}

function isRecentActivityVisibleForWorkspace(activity, { poultryEnabled, fishEnabled }) {
  const category = String(activity?.category || "").trim().toLowerCase();
  const itemLabel = String(activity?.item || "").trim();
  const normalizedItem = itemLabel.toLowerCase();
  const feedModule = detectFeedModule(itemLabel);

  if (!fishEnabled) {
    if (category === "fish") return false;
    if (feedModule === FARM_MODULES.FISH_FARMING) return false;
    if (normalizedItem.includes("fish")) return false;
  }

  if (!poultryEnabled) {
    if (category === "poultry" || category === "livestock") return false;
    if (feedModule === FARM_MODULES.POULTRY) return false;
    if (/\b(egg|chicken|bird|layer|broiler|noiler|turkey|duck|poultry)\b/.test(normalizedItem)) {
      return false;
    }
  }

  return true;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { activeTenant } = useTenant();
  const currentPlan = normalizePlanId(activeTenant?.plan, "FREE");
  const workspaceCurrency = String(activeTenant?.currency || "NGN").trim().toUpperCase() || "NGN";
  const poultryEnabled = hasFarmModule(activeTenant, FARM_MODULES.POULTRY);
  const fishEnabled = hasFarmModule(activeTenant, FARM_MODULES.FISH_FARMING);
  const canUseAdvancedDashboard = isPlanAtLeast(currentPlan, "PRO");
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [selectedProductionYear, setSelectedProductionYear] = React.useState(
    new Date().getFullYear(),
  );
  const [exportOpen, setExportOpen] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [processingHealthAlertId, setProcessingHealthAlertId] = React.useState(null);
  const [restockTarget, setRestockTarget] = React.useState(null);
  const [restockingId, setRestockingId] = React.useState(null);
  const [toast, setToast] = React.useState({ message: "", type: "info" });
  const fetchDashboardData = React.useCallback(async () => {
    try {
      const [summaryRes, recentRes, financeRes, watchlistRes, alertsRes] =
        await Promise.all([
          getDashboardSummary(),
          getRecentActivities(),
          canUseAdvancedDashboard ? getFinanceSummary() : Promise.resolve({ monthly: [] }),
          canUseAdvancedDashboard ? getFeedWatchlist() : Promise.resolve([]),
          canUseAdvancedDashboard ? getHealthEvents() : Promise.resolve([]),
        ]);

      const summary = summaryRes.data ?? {};
      const monthlyProduction = summary.monthlyProduction || {};

      const productionSeries = Object.entries(monthlyProduction)
        .map(([date, quantity]) => ({ date, quantity }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      return {
        ...summary,
        monthlyFinance: financeRes.monthly || [],
        productionSeries,
        watchlist: watchlistRes || [],
        alerts: alertsRes || [],
        recentActivities: recentRes || [],
      };
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      throw err;
    }
  }, [canUseAdvancedDashboard]);
  const { data, loading } = useFetch(fetchDashboardData, refreshToken);

  const isInitialLoading = loading && !data;
  const isRefreshing = loading && Boolean(data);
  const refreshDashboard = React.useCallback(() => {
    setRefreshToken((prev) => prev + 1);
  }, []);

  const totals = data || {};
  const feed = Array.isArray(data?.feedBreakdown) ? data.feedBreakdown : EMPTY_ARRAY;
  const recent = React.useMemo(
    () =>
      (Array.isArray(data?.recentActivities) ? data.recentActivities : EMPTY_ARRAY).filter(
        (item) => isRecentActivityVisibleForWorkspace(item, { poultryEnabled, fishEnabled }),
      ),
    [data?.recentActivities, fishEnabled, poultryEnabled],
  );
  const watchlist = React.useMemo(
    () =>
      (Array.isArray(data?.watchlist) ? data.watchlist : EMPTY_ARRAY).filter((item) =>
        isFeedLabelVisibleForWorkspace(getInventoryItemName(item), { poultryEnabled, fishEnabled }),
      ),
    [data?.watchlist, fishEnabled, poultryEnabled],
  );
  const alerts = Array.isArray(data?.alerts) ? data.alerts : [];
  const recommendedRestockQuantity = restockTarget
    ? getRecommendedRestockQuantity(restockTarget)
    : 0;
  const restockTargetQuantity = restockTarget
    ? getInventoryQuantity(restockTarget) + recommendedRestockQuantity
    : 0;

  const feedLegendItems = React.useMemo(() => {
    const entries = (Array.isArray(feed) ? feed : [])
      .map((item) => ({
        label: String(item?.label || "Others"),
        value: Number(item?.value) || 0,
      }))
      .filter(
        (item) =>
          item.value > 0 &&
          isFeedLabelVisibleForWorkspace(item.label, { poultryEnabled, fishEnabled }),
      );

    const total = entries.reduce((sum, item) => sum + item.value, 0);
    return entries
      .map((item) => ({
        ...item,
        percent: total > 0 ? (item.value / total) * 100 : 0,
        color: resolveFeedColor(item.label),
      }))
      .sort((a, b) => b.value - a.value);
  }, [feed, fishEnabled, poultryEnabled]);

  const hasFeedConsumptionData = feedLegendItems.length > 0;

  const productionSeries = React.useMemo(
    () =>
      (Array.isArray(data?.productionSeries) ? data.productionSeries : [])
        .map((item) => ({
          date: item?.date,
          quantity: Number(item?.quantity) || 0,
        }))
        .filter((item) => item.date)
        .sort((a, b) => String(a.date).localeCompare(String(b.date))),
    [data?.productionSeries],
  );

  const productionYears = React.useMemo(() => {
    const years = productionSeries
      .map((item) => getProductionYear(item.date))
      .filter((year) => Number.isFinite(year));

    return Array.from(new Set(years)).sort((left, right) => right - left);
  }, [productionSeries]);

  const activeProductionYear = productionYears.includes(selectedProductionYear)
    ? selectedProductionYear
    : (productionYears[0] ?? new Date().getFullYear());

  React.useEffect(() => {
    if (selectedProductionYear !== activeProductionYear) {
      setSelectedProductionYear(activeProductionYear);
    }
  }, [activeProductionYear, selectedProductionYear]);

  const chartProductionSeries = React.useMemo(
    () => buildProductionCalendarYear(productionSeries, activeProductionYear),
    [activeProductionYear, productionSeries],
  );

  const selectedYearProductionEntries = React.useMemo(
    () =>
      productionSeries.filter(
        (item) =>
          getProductionYear(item.date) === activeProductionYear && Number(item.quantity) > 0,
      ),
    [activeProductionYear, productionSeries],
  );

  const productionInsights = React.useMemo(() => {
    const entries = selectedYearProductionEntries;
    if (!entries.length) {
      return null;
    }

    const totalEggs = entries.reduce((sum, item) => sum + item.quantity, 0);
    const peakMonth = entries.reduce((best, item) =>
      item.quantity > best.quantity ? item : best
    );
    const latestMonth = entries[entries.length - 1];

    return {
      peakMonth,
      latestMonth,
      averageMonthlyEggs: Math.round(totalEggs / entries.length),
      totalMonthsTracked: entries.length,
      totalEggs,
      peakShare: totalEggs > 0 ? Math.round((peakMonth.quantity / totalEggs) * 100) : 0,
    };
  }, [selectedYearProductionEntries]);

  const latestRecordedProductionYear = getProductionYear(
    productionInsights?.latestMonth?.date,
  );

  const productionYearHint =
    latestRecordedProductionYear && latestRecordedProductionYear !== activeProductionYear
      ? `Latest record is in ${latestRecordedProductionYear}`
      : `Showing ${activeProductionYear}`;

  const quickActionCards = React.useMemo(
    () => {
      const cards = [];

      if (poultryEnabled) {
        cards.push({
          to: "/productions?create=1",
          icon: Egg,
          title: "Record eggs",
          description: "Add today's egg collection for a layer batch in one simple step.",
          helperText:
            Number(totals.totalCratesProducedToday) > 0
              ? `${formatMetricCount(totals.totalCratesProducedToday)} crates recorded today`
              : "No egg collection has been recorded today yet",
          iconClassName:
            "bg-gradient-to-br from-amber-400 to-orange-500 dark:from-amber-400 dark:to-orange-600",
        });
      }

      cards.push(
        {
          to: "/feeds?create=1",
          icon: Wheat,
          title: "Record feed",
          description: "Log feed usage or purchases so stock and cost stay clear.",
          helperText:
            watchlist.length > 0
              ? `${watchlist.length} stock item${watchlist.length === 1 ? "" : "s"} need attention`
              : "Feed stock looks calm right now",
          iconClassName:
            "bg-gradient-to-br from-emerald-400 to-teal-500 dark:from-emerald-400 dark:to-teal-600",
        },
        {
          to: "/sales?create=1",
          icon: Wallet,
          title: "Record sale",
          description: "Capture what was sold so income and payment records stay clean.",
          helperText:
            Number(totals.totalRevenueThisMonth) > 0
              ? `${formatCurrency(totals.totalRevenueThisMonth)} this month`
              : "No sale has been recorded this month yet",
          iconClassName:
            "bg-gradient-to-br from-sky-400 to-indigo-500 dark:from-sky-400 dark:to-indigo-600",
        },
        {
          to: "/inventory?create=1",
          icon: Package2,
          title: "Add stock item",
          description: "Keep your farm items easy to find before anything runs out.",
          helperText:
            watchlist.length > 0
              ? `${watchlist.length} low-stock item${watchlist.length === 1 ? "" : "s"} to review`
              : "Inventory is ready for the next update",
          iconClassName:
            "bg-gradient-to-br from-violet-400 to-fuchsia-500 dark:from-violet-400 dark:to-fuchsia-600",
        },
      );

      return cards;
    },
    [
      poultryEnabled,
      totals.totalCratesProducedToday,
      totals.totalRevenueThisMonth,
      watchlist.length,
    ],
  );

  const summaryCards = React.useMemo(() => {
    const cards = [];
    const attentionValue =
      watchlist.length > 0 ? formatCount(watchlist.length) : formatCount(recent.length);
    const attentionSubtitle =
      watchlist.length > 0
        ? `Low-stock item${watchlist.length === 1 ? "" : "s"} to review`
        : `Recent farm update${recent.length === 1 ? "" : "s"}`;

    if (poultryEnabled) {
      cards.push(
        <SummaryCard
          key="summary-birds"
          icon={<GiChicken className="w-8 h-8 sm:w-10 sm:h-10 text-amber-200" />}
          title="Birds"
          value={formatCount(totals.totalLivestockCount)}
          subtitle="Birds on the farm"
          titleClass="font-header"
          valueClass="font-body"
          className="min-h-[92px]"
        />,
      );
    }

    if (fishEnabled) {
      cards.push(
        <SummaryCard
          key="summary-ponds"
          icon={<Droplets className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-200" />}
          title="Fish Ponds"
          value={formatCount(totals.totalPondCount)}
          subtitle="Active ponds"
          titleClass="font-header"
          valueClass="font-body"
          className="min-h-[92px]"
        />,
      );
    }

    if (poultryEnabled) {
      cards.push(
        <SummaryCard
          key="summary-crates"
          icon={<Egg className="w-8 h-8 sm:w-10 sm:h-10 text-amber-100" />}
          title="Egg Crates Today"
          value={formatCount(totals.totalCratesProducedToday)}
          subtitle="Recorded so far today"
          titleClass="font-header"
          valueClass="font-body"
          className="min-h-[92px]"
        />,
      );
    }

    const shouldShowAttentionCard =
      (poultryEnabled && !fishEnabled) || (!poultryEnabled && fishEnabled);

    if (shouldShowAttentionCard) {
      cards.push(
        <SummaryCard
          key="summary-attention"
          icon={<ListChecks className="w-8 h-8 sm:w-10 sm:h-10 text-sky-100" />}
          title="Items to Review"
          value={attentionValue}
          subtitle={attentionSubtitle}
          titleClass="font-header"
          valueClass="font-body"
          className="min-h-[92px]"
        />,
      );
    }

    cards.push(
      <SummaryCard
        key="summary-sales"
        icon={<Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-status-success" />}
        title="Sales This Month"
        value={formatCurrency(totals.totalRevenueThisMonth)}
        subtitle="Month to date"
        titleClass="font-header"
        valueClass="font-body"
        className="min-h-[92px]"
      />,
    );

    return cards;
  }, [
    fishEnabled,
    poultryEnabled,
    recent.length,
    totals.totalCratesProducedToday,
    totals.totalLivestockCount,
    totals.totalPondCount,
    totals.totalRevenueThisMonth,
    watchlist.length,
  ]);

  const feedSummaryText = poultryEnabled && fishEnabled
    ? "Share of feed usage across poultry and fish categories."
    : poultryEnabled
      ? "Share of feed usage across your poultry feed categories."
      : "Share of feed usage across your fish feed categories.";

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
      link.download = filename || `${category || "report"}.${type || "csv"}`;
      link.click();
      window.URL.revokeObjectURL(url);
      setToast({ message: "Report ready", type: "success" });
    } catch (error) {
      console.error("Export failed: ", error);
      setToast({ message: "Could not download report", type: "error" });
    } finally {
      setExporting(false);
      setExportOpen(false);
    }
  };

  const openRestockPrompt = React.useCallback((item) => {
    if (!item?.id) return;
    setRestockTarget(item);
  }, []);

  const confirmRestock = React.useCallback(async () => {
    if (!restockTarget?.id) return;

    const itemName = getInventoryItemName(restockTarget);
    const quantityChange = getRecommendedRestockQuantity(restockTarget);
    const unit = getInventoryUnit(restockTarget);

    setRestockingId(restockTarget.id);
    try {
      const saved = await adjustInventoryStock(
        restockTarget.id,
        {
          quantityChange,
          note: `Dashboard restock for ${itemName} (+${quantityChange} ${unit})`,
        },
        {
          baseRecord: restockTarget,
        },
      );

      refreshDashboard();

      if (isOfflinePendingRecord(saved)) {
        setToast({
          message: `${itemName} restock was saved offline and will sync automatically.`,
          type: "info",
        });
      } else {
        setToast({
          message: `${itemName} restocked by ${quantityChange} ${unit}.`,
          type: "success",
        });
      }
    } catch (error) {
      setToast({
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          `Could not restock ${itemName}.`,
        type: "error",
      });
    } finally {
      setRestockingId(null);
      setRestockTarget(null);
    }
  }, [refreshDashboard, restockTarget]);

  const runHealthAction = React.useCallback(async (alertId, action) => {
    if (!alertId || processingHealthAlertId) return;

    setProcessingHealthAlertId(String(alertId));
    try {
      if (action === "handle") {
        await handleHealthEvent(alertId);
        setToast({ message: "Health alert marked as handled.", type: "success" });
      } else {
        await acknowledgeHealthEvent(alertId);
        setToast({ message: "Health alert acknowledged.", type: "success" });
      }
      refreshDashboard();
    } catch (error) {
      setToast({
        message: error?.message || "Could not update this health alert.",
        type: "error",
      });
    } finally {
      setProcessingHealthAlertId(null);
    }
  }, [processingHealthAlertId, refreshDashboard]);

  function formatCurrency(value) {
    if (value == null || isNaN(value) || Number(value) === 0) return "—";
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: workspaceCurrency,
      minimumFractionDigits: 0,
    }).format(value);
  }

  function formatCount(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "—";
    return numeric;
  }

  function formatMetricCount(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "—";
    return new Intl.NumberFormat("en-NG", {
      maximumFractionDigits: 0,
    }).format(numeric);
  }

  function formatMonthLabel(value) {
    if (!value || typeof value !== "string") return "—";
    const [year, month] = value.split("-");
    const monthIndex = Number(month) - 1;
    if (!year || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
      return value;
    }
    return `${MONTH_SHORT_NAMES[monthIndex]} ${year}`;
  }

  const singleModuleFocus = null;

  return (
    <DashboardLayout>
      <div className="font-body">
        {/* Header */}
        <div className="space-y-4 animate-fadeIn mb-4">
          <div className="relative isolate overflow-hidden rounded-2xl border border-sky-200/70 bg-slate-50/85 p-5 shadow-neo dark:border-sky-500/20 dark:bg-[#061024]/90 dark:shadow-[0_22px_40px_rgba(2,8,24,0.45)] md:p-6">
            <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(108deg,rgba(37,99,235,0.17)_0%,rgba(14,116,144,0.14)_48%,rgba(16,185,129,0.12)_100%),radial-gradient(circle_at_12%_22%,rgba(56,189,248,0.13),transparent_43%),radial-gradient(circle_at_90%_22%,rgba(16,185,129,0.14),transparent_38%)] dark:bg-[linear-gradient(108deg,rgba(6,19,43,0.96)_0%,rgba(7,32,63,0.9)_48%,rgba(6,58,55,0.84)_100%),radial-gradient(circle_at_12%_22%,rgba(56,189,248,0.16),transparent_43%),radial-gradient(circle_at_90%_22%,rgba(16,185,129,0.18),transparent_38%)]" />

            <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-accent-primary/35 bg-accent-primary/12 px-3 py-1 text-sm font-semibold text-accent-primary dark:border-blue-300/35 dark:bg-blue-500/20 dark:text-blue-100">
                  <Droplets className="h-3.5 w-3.5" />
                  Farm overview
                </span>
                <h1 className="mt-3 text-3xl font-semibold font-header tracking-tight text-slate-900 dark:text-slate-50">
                  Farm overview
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:text-base font-body">
                  Start here each day to see what needs attention across eggs,
                  feed, sales, tasks, and farm health.
                </p>
              </div>

              <div className="grid w-full grid-cols-2 auto-rows-fr items-center gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-start lg:justify-end">
                <button
                  type="button"
                  onClick={refreshDashboard}
                  disabled={isRefreshing}
                  title="Refresh dashboard"
                  aria-label="Refresh dashboard"
                  className={`order-2 inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white/45 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 disabled:opacity-60 sm:order-none sm:h-auto sm:min-h-0 sm:w-auto dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20 ${
                    isRefreshing ? "cursor-not-allowed opacity-70" : ""
                  }`}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                <button
                  onClick={() => setExportOpen(true)}
                  disabled={exporting}
                  title="Download dashboard report"
                  className="order-1 inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 sm:order-none sm:h-auto sm:min-h-0 sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  {exporting ? "Downloading..." : "Download"}
                </button>
              </div>
            </div>

            <div className="relative z-10 mt-3 text-left text-[11px] font-medium text-slate-600 dark:text-slate-200/80 sm:text-right">
              Live dashboard data
            </div>
          </div>

          <FarmerGuideCard
            icon={Droplets}
            title="Use this page like a daily checklist"
            description="You do not need to read every chart first. Start at the top and open the sections that need attention."
            storageKey="dashboard-guide"
            steps={[
              "Check the top cards first to see today's main numbers.",
              "Open warnings, tasks, or alerts next.",
              "Use recent activity to confirm what was recorded today.",
            ]}
            tip="If a section is empty, it usually means nothing has been recorded there yet."
          />
        </div>

        <div className="flex flex-col gap-6">
          <section className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Record Something
              </p>
              <h2 className="mt-1 text-2xl font-semibold font-header text-slate-900 dark:text-slate-50">
                Choose one job to do now
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                These are the most common tasks. Pick one and ignore the rest for now.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {quickActionCards.map((card) => (
                <DashboardActionCard key={card.title} {...card} />
              ))}
            </div>
          </section>

          {/* Summary Cards */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Today
              </p>
              <h2 className="mt-1 text-xl font-semibold font-header text-slate-900 dark:text-slate-50">
                Today at a glance
              </h2>
            </div>
            <PanelRefreshButton
              onClick={refreshDashboard}
              busy={isRefreshing}
              label="Refresh summary cards"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {isInitialLoading
              ? Array.from({ length: Math.max(summaryCards.length, 2) }).map((_, idx) => (
                  <div
                    key={`summary-skeleton-${idx}`}
                    className="min-h-[92px] rounded-2xl bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-5 lg:p-6 xl:p-6"
                    aria-hidden="true"
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-5">
                      <div className="skeleton-glass w-14 h-14 lg:w-16 lg:h-16 rounded-xl" />
                      <div className="flex-1 min-w-0 w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="skeleton-glass h-4 sm:h-5 lg:h-6 w-24 sm:w-32 rounded" />
                          <div className="skeleton-glass h-3 w-16 rounded" />
                        </div>
                        <div className="skeleton-glass h-6 sm:h-8 lg:h-9 w-16 sm:w-20 rounded" />
                      </div>
                    </div>
                  </div>
                ))
              : summaryCards}
          </div>

          {singleModuleFocus && (
            <section className="space-y-4">
              <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-sky-50 p-5 shadow-neo dark:border-white/10 dark:from-[#08121f] dark:via-[#0b1730] dark:to-[#0a2231] dark:shadow-dark">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  {singleModuleFocus.eyebrow}
                </p>
                <h2 className="mt-2 text-2xl font-semibold font-header text-slate-900 dark:text-slate-50">
                  {singleModuleFocus.title}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {singleModuleFocus.description}
                </p>
              </div>

              <div className="grid gap-3 xl:grid-cols-3">
                {singleModuleFocus.cards.map((card) => (
                  <ModuleFocusCard key={card.title} {...card} />
                ))}
              </div>
            </section>
          )}

          {/* Charts Row */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Trends
            </p>
            <h2 className="mt-1 text-xl font-semibold font-header text-slate-900 dark:text-slate-50">
              Look deeper only when you need to
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              These charts are helpful for review and planning. You can skip them if you only need to record today's work.
            </p>
          </div>

          <div className="space-y-4 md:hidden">
            {poultryEnabled ? (
              <MobileAccordionCard
                title="Egg production"
                description="Open this chart when you want to review monthly egg output."
                icon={<Egg className="h-4 w-4" />}
              >
                <div className="rounded-xl bg-white p-4 shadow-neo dark:bg-darkCard dark:shadow-dark">
                  <div className="mb-3 flex flex-col gap-3">
                    <div>
                      <h3 className="text-lg font-header">Egg production</h3>
                      <p className="mb-0 text-xs text-slate-500 dark:text-slate-400 font-body">
                        Monthly output trend for {activeProductionYear}.
                      </p>
                    </div>
                    <div className="flex flex-col items-stretch gap-2">
                      <label className="inline-flex w-full items-center justify-between gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                        <span className="uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Year
                        </span>
                        <select
                          value={activeProductionYear}
                          onChange={(event) => setSelectedProductionYear(Number(event.target.value))}
                          className="min-w-[88px] bg-transparent pr-4 text-right text-sm font-semibold text-slate-700 outline-none dark:text-slate-100"
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
                      <PanelRefreshButton
                        onClick={refreshDashboard}
                        busy={isRefreshing}
                        label="Refresh production overview"
                      />
                    </div>
                  </div>
                  <div className="h-[220px] w-full">
                    {isInitialLoading ? (
                      <div className="skeleton-glass h-full w-full rounded-lg" />
                    ) : (
                      <ProductionChart productionData={chartProductionSeries} />
                    )}
                  </div>
                  {!isInitialLoading && productionInsights ? (
                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-200/80 pt-4 dark:border-white/10">
                      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-3 dark:border-white/10 dark:bg-white/5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Peak Month
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {formatMonthLabel(productionInsights.peakMonth?.date)}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-300">
                            {formatMetricCount(productionInsights.peakMonth?.quantity)} eggs
                          </p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-3 dark:border-white/10 dark:bg-white/5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Latest Logged
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {formatMonthLabel(productionInsights.latestMonth?.date)}
                          </p>
                          <p className="text-xs text-sky-600 dark:text-sky-300">
                            {formatMetricCount(productionInsights.latestMonth?.quantity)} eggs
                          </p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-3 dark:border-white/10 dark:bg-white/5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Avg / Month
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {formatMetricCount(productionInsights.averageMonthlyEggs)} eggs
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Across {productionInsights.totalMonthsTracked} months in {activeProductionYear}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-3 dark:border-white/10 dark:bg-white/5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Year Total
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {formatMetricCount(productionInsights.totalEggs)} eggs
                          </p>
                          <p className="text-xs text-amber-600 dark:text-amber-300">
                            {productionYearHint}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </MobileAccordionCard>
            ) : null}

            <MobileAccordionCard
              title="Feed consumption"
              description="Open this chart when you want to review feed mix and usage share."
              icon={<Wheat className="h-4 w-4" />}
            >
              <div className="rounded-xl bg-white p-4 shadow-neo dark:bg-darkCard dark:shadow-dark">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-lg font-header">Feed Consumption</h3>
                  <PanelRefreshButton
                    onClick={refreshDashboard}
                    busy={isRefreshing}
                    label="Refresh feed consumption"
                  />
                </div>
                <p className="mb-3 text-xs text-slate-500 dark:text-slate-400 font-body">
                  {feedSummaryText}
                </p>
                {isInitialLoading ? (
                  <div className="flex w-full flex-col items-stretch gap-4 font-body">
                    <div className="min-w-0 flex-1">
                      <div className="skeleton-glass h-40 w-full rounded-lg" />
                    </div>
                    <div className="w-full flex-1 space-y-3">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <div key={`mobile-feed-skeleton-${idx}`} className="space-y-2">
                          <div className="skeleton-glass h-4 w-24 rounded" />
                          <div className="skeleton-glass h-3 w-12 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : !hasFeedConsumptionData ? (
                  <div
                    className="flex h-[260px] w-full items-center justify-center p-4 font-body"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
                      <div
                        className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 shadow-sm dark:bg-gradient-to-br dark:from-yellow-900/30 dark:to-amber-900/20"
                        aria-hidden="true"
                      >
                        <span className="text-3xl leading-none">🌾</span>
                      </div>
                      <h4 className="text-sm font-semibold font-header text-slate-700 dark:text-slate-100">
                        No feed consumption recorded
                      </h4>
                      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {poultryEnabled && fishEnabled
                          ? "Log feed usage for your birds or fish to see the breakdown here."
                          : poultryEnabled
                            ? "Log feed usage for your birds to see the breakdown here."
                            : "Log feed usage for your fish to see the breakdown here."}
                      </p>
                      <button
                        className="mt-2 w-full rounded-lg bg-accent-primary px-5 py-2 text-white transition hover:opacity-90 active:scale-[0.98]"
                        onClick={() => navigate("/feeds")}
                      >
                        Log Feed Consumption
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid w-full grid-cols-1 gap-4 font-body">
                    <div className="min-w-0">
                      <FeedPie breakdown={feedLegendItems} />
                    </div>
                    <div className="w-full space-y-2">
                      {feedLegendItems.map((item) => (
                        <div
                          key={`mobile-feed-legend-${item.label}`}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 dark:bg-darkCard/50"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <div className="truncate text-sm font-body">{item.label}</div>
                            </div>
                            <div className="text-xs font-semibold text-slate-600 dark:text-slate-200">
                              {item.percent.toFixed(1)}%
                            </div>
                          </div>
                          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200/70 dark:bg-slate-700/60">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                backgroundColor: item.color,
                                width: `${Math.max(item.percent, 3)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </MobileAccordionCard>
          </div>

          <div className="hidden gap-4 md:flex md:flex-row">
            {poultryEnabled && (
              <div className="flex flex-1 flex-col rounded-xl bg-white p-4 shadow-neo dark:bg-darkCard dark:shadow-dark">
              <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-header">Egg production</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0 font-body">
                    Monthly output trend for {activeProductionYear}.
                  </p>
                </div>
                <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                  <label className="inline-flex w-full items-center justify-between gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 sm:w-auto sm:justify-start sm:py-1.5 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                    <span className="uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Year
                    </span>
                    <select
                      value={activeProductionYear}
                      onChange={(event) => setSelectedProductionYear(Number(event.target.value))}
                      className="min-w-[88px] bg-transparent pr-4 text-right text-sm font-semibold text-slate-700 outline-none sm:text-left dark:text-slate-100"
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
                  <PanelRefreshButton
                    onClick={refreshDashboard}
                    busy={isRefreshing}
                    label="Refresh production overview"
                  />
                </div>
              </div>
              <div className="w-full h-[220px] sm:h-[250px] md:h-[280px]">
                {isInitialLoading ? (
                  <div className="skeleton-glass w-full h-full rounded-lg" />
                ) : (
                  <ProductionChart
                    productionData={chartProductionSeries}
                  />
                )}
              </div>
              {!isInitialLoading && productionInsights && (
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-200/80 pt-4 dark:border-white/10 xl:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-3 dark:border-white/10 dark:bg-white/5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Peak Month
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatMonthLabel(productionInsights.peakMonth?.date)}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-300">
                        {formatMetricCount(productionInsights.peakMonth?.quantity)} eggs
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-3 dark:border-white/10 dark:bg-white/5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Latest Logged
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatMonthLabel(productionInsights.latestMonth?.date)}
                      </p>
                      <p className="text-xs text-sky-600 dark:text-sky-300">
                        {formatMetricCount(productionInsights.latestMonth?.quantity)} eggs
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-3 dark:border-white/10 dark:bg-white/5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Avg / Month
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatMetricCount(productionInsights.averageMonthlyEggs)} eggs
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Across {productionInsights.totalMonthsTracked} months in {activeProductionYear}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-3 dark:border-white/10 dark:bg-white/5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Year Total
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatMetricCount(productionInsights.totalEggs)} eggs
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-300">
                        {productionYearHint}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              </div>
            )}

            <div
              className={`${poultryEnabled ? "flex-1" : "w-full"} bg-white dark:bg-darkCard shadow-neo dark:shadow-dark p-4 rounded-xl`}
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="text-lg font-header">Feed Consumption</h3>
                <PanelRefreshButton
                  onClick={refreshDashboard}
                  busy={isRefreshing}
                  label="Refresh feed consumption"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-body">
                {feedSummaryText}
              </p>
              {isInitialLoading ? (
                <div className="flex flex-col sm:flex-row w-full items-stretch sm:items-center gap-4 font-body">
                  <div className="flex-1 min-w-0 sm:min-w-[120px]">
                    <div className="skeleton-glass w-full h-40 sm:h-48 rounded-lg" />
                  </div>
                  <div className="flex-1 w-full space-y-3">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={`feed-skeleton-${idx}`} className="space-y-2">
                        <div className="skeleton-glass h-4 w-24 rounded" />
                        <div className="skeleton-glass h-3 w-12 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : !hasFeedConsumptionData ? (
                <div
                  className="w-full h-[260px] sm:h-[300px] md:h-[340px] flex items-center justify-center p-4 font-body"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex flex-col items-center text-center gap-3 w-full max-w-sm">
                    <div
                      className="flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 dark:bg-gradient-to-br dark:from-yellow-900/30 dark:to-amber-900/20 shadow-sm"
                      aria-hidden="true"
                    >
                      <span className="text-3xl leading-none">🌾</span>
                    </div>
                    <h4 className="text-sm font-semibold font-header text-slate-700 dark:text-slate-100">
                      No feed consumption recorded
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {poultryEnabled && fishEnabled
                        ? "Log feed usage for your birds or fish to see the breakdown here."
                        : poultryEnabled
                          ? "Log feed usage for your birds to see the breakdown here."
                          : "Log feed usage for your fish to see the breakdown here."}
                    </p>
                    <button
                      className="mt-2 w-full sm:w-auto px-5 py-2 bg-accent-primary text-white rounded-lg transition hover:opacity-90 active:scale-[0.98]"
                      onClick={() => navigate("/feeds")}
                    >
                      Log Feed Consumption
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] w-full gap-4 font-body">
                  <div className="min-w-0">
                    <FeedPie breakdown={feedLegendItems} />
                  </div>
                  <div className="w-full space-y-2">
                    {feedLegendItems.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-lg border border-white/10 bg-white/5 dark:bg-darkCard/50 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <div className="text-sm font-body truncate">
                              {item.label}
                            </div>
                          </div>
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-200">
                            {item.percent.toFixed(1)}%
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200/70 dark:bg-slate-700/60">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              backgroundColor: item.color,
                              width: `${Math.max(item.percent, 3)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Revenue + Upcoming Tasks */}
          {canUseAdvancedDashboard ? (
            <>
              <div className="space-y-4 md:hidden">
                <MobileAccordionCard
                  title="Revenue and expenses"
                  description="Open this chart when you want to review money coming in and going out."
                  icon={<Wallet className="h-4 w-4" />}
                >
                  {isInitialLoading ? (
                    <div className="rounded-xl bg-white/10 p-5 shadow-neo dark:bg-darkCard/70 dark:shadow-dark h-[320px]">
                      <div className="skeleton-glass mb-3 h-4 w-28 rounded" />
                      <div className="skeleton-glass mb-6 h-8 w-36 rounded" />
                      <div className="skeleton-glass h-48 rounded" />
                    </div>
                  ) : (
                    <RevenueExpenseChart
                      data={data?.monthlyFinance}
                      currency={workspaceCurrency}
                      onRefresh={refreshDashboard}
                      refreshing={isRefreshing}
                    />
                  )}
                </MobileAccordionCard>

                {isInitialLoading ? (
                  <div className="w-full rounded-xl bg-white/10 p-4 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
                    <div className="mb-4 flex flex-col items-start justify-between gap-3">
                      <div className="skeleton-glass h-4 w-28 rounded" />
                      <div className="skeleton-glass h-8 w-24 rounded" />
                    </div>
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <div
                          key={`mobile-task-skeleton-${idx}`}
                          className="skeleton-glass h-12 rounded"
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <UpcomingTaskPanel
                    className="h-full"
                    onRefresh={refreshDashboard}
                    refreshing={isRefreshing}
                  />
                )}
              </div>

              <div className="hidden grid-cols-1 gap-4 md:grid md:grid-cols-3">
              <div className="md:col-span-2">
                {isInitialLoading ? (
                  <div className="bg-white/10 dark:bg-darkCard/70 rounded-xl shadow-neo dark:shadow-dark p-5 h-[320px] sm:h-[360px]">
                    <div className="skeleton-glass h-4 w-28 sm:w-32 rounded mb-3" />
                    <div className="skeleton-glass h-8 w-36 sm:w-40 rounded mb-6" />
                    <div className="skeleton-glass h-48 sm:h-64 rounded" />
                  </div>
                ) : (
                  <RevenueExpenseChart
                    data={data?.monthlyFinance}
                    currency={workspaceCurrency}
                    onRefresh={refreshDashboard}
                    refreshing={isRefreshing}
                  />
                )}
              </div>
              <div className="md:flex md:col-span-1">
                {isInitialLoading ? (
                  <div className="bg-white/10 w-full dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-4 rounded-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                      <div className="skeleton-glass h-4 w-28 sm:w-32 rounded" />
                      <div className="skeleton-glass h-8 w-24 sm:w-20 rounded" />
                    </div>
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <div
                          key={`task-skeleton-${idx}`}
                          className="skeleton-glass h-12 rounded"
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <UpcomingTaskPanel
                    className="h-full"
                    onRefresh={refreshDashboard}
                    refreshing={isRefreshing}
                  />
                )}
              </div>
              </div>
            </>
          ) : (
            <PlanUpgradePrompt
              title="Unlock Advanced Dashboard Widgets"
              feature="advanced dashboard insights"
              requiredPlan="PRO"
              description="Upgrade to Pro to access revenue analytics, upcoming task intelligence, feed watchlist, and health alerts in one live command center."
            />
          )}

          {/* Feed Watchlist & Health Alerts */}
          {canUseAdvancedDashboard ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {isInitialLoading ? (
                <div className="bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="skeleton-glass w-9 h-9 rounded-md" />
                    <div className="space-y-2">
                      <div className="skeleton-glass h-4 w-32 rounded" />
                      <div className="skeleton-glass h-3 w-40 rounded" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div
                        key={`watchlist-skeleton-${idx}`}
                        className="skeleton-glass h-16 rounded"
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div id="dashboard-watchlist">
                  <FeedWatchlistPanel
                    feeds={watchlist}
                    onRefresh={refreshDashboard}
                    onRestock={openRestockPrompt}
                    restockingId={restockingId}
                  />
                </div>
              )}

              {isInitialLoading ? (
                <div className="bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="skeleton-glass w-9 h-9 rounded-md" />
                    <div className="space-y-2">
                      <div className="skeleton-glass h-4 w-28 rounded" />
                      <div className="skeleton-glass h-3 w-48 rounded" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={`alerts-skeleton-${idx}`}
                        className="skeleton-glass h-14 rounded"
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div id="dashboard-alerts">
                  <HealthAlertsPanel
                    alerts={alerts}
                    onRefresh={refreshDashboard}
                    refreshing={isRefreshing}
                    onAcknowledge={(alertId) => runHealthAction(alertId, "acknowledge")}
                    onHandle={(alertId) => runHealthAction(alertId, "handle")}
                    processingId={processingHealthAlertId}
                  />
                </div>
              )}
            </div>
          ) : null}

          {/* Recent Activities Table */}
          {isInitialLoading ? (
            <div className="shadow-neo dark:shadow-dark mt-4 rounded-2xl bg-white/10 dark:bg-darkCard/70 p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="skeleton-glass h-5 w-32 sm:w-40 rounded" />
                <div className="skeleton-glass h-6 w-20 sm:w-24 rounded" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div
                    key={`recent-skeleton-${idx}`}
                    className="skeleton-glass h-10 rounded"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div
              id="dashboard-recent"
              className="mt-4 overflow-x-auto shadow-neo dark:shadow-dark"
              title="Latest records from across the farm"
            >
              <RecentTable
                items={recent}
                onRefresh={refreshDashboard}
                refreshing={isRefreshing}
              />
            </div>
          )}
        </div>
      </div>
      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onSubmit={handleExport}
        exporting={exporting}
      />
      <ConfirmModal
        open={Boolean(restockTarget)}
        title="Restock Feed Item"
        message={
          restockTarget
            ? `Add ${recommendedRestockQuantity} ${getInventoryUnit(restockTarget)} to ${getInventoryItemName(restockTarget)}? This moves it from ${getInventoryQuantity(restockTarget)} ${getInventoryUnit(restockTarget)} to about ${restockTargetQuantity} ${getInventoryUnit(restockTarget)}, above the reorder level of ${getInventoryThreshold(restockTarget)} ${getInventoryUnit(restockTarget)}.`
            : "Confirm this feed restock."
        }
        confirmText="Restock now"
        cancelText="Cancel"
        loading={restockingId != null}
        onCancel={() => {
          if (restockingId != null) return;
          setRestockTarget(null);
        }}
        onConfirm={confirmRestock}
      />
      <GlassToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />
    </DashboardLayout>
  );
}

import React from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import ProductionChart from "../components/ProductionChart";
import SummaryCard from "../components/SummaryCard";
import FeedPie, { COLORS } from "../components/FeedPie";
import RecentTable from "../components/RecentTable";
import { useFetch } from "../hooks/useFetch";
import { GiChicken } from "react-icons/gi";
import { Egg, Wallet, Download } from "lucide-react";
import { PiFishSimpleBold } from "react-icons/pi";
import api from "../services/axios";
import RevenueExpenseChart from "../components/RevenueExpenseChart";
import UpcomingTaskPanel from "../components/UpcomingTaskPanel";
import FeedWatchlistPanel from "../components/FeedWatchlistPanel";
import HealthAlertsPanel from "../components/HealthAlertsPanel";
import {
  getDashboardSummary,
  getFinanceSummary,
  getFeedWatchlist,
  getRecentActivities,
} from "../services/dashboardService";
import { getHealthEvents } from "../services/healthService";
import GlassToast from "../components/GlassToast";

export default function DashboardPage() {
  const { data, loading } = useFetch(async () => {
    try {
      const [summaryRes, financeRes, watchlistRes, alertsRes, recentRes] =
        await Promise.all([
          getDashboardSummary(),
          getFinanceSummary(),
          getFeedWatchlist(),
          getHealthEvents(),
          getRecentActivities(),
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
  }, []);

  const totals = data || {};
  const feed = data?.feedBreakdown || [];
  const recent = data?.recentActivities || [];
  const watchlist = data?.watchlist || [];
  const alerts = Array.isArray(data?.alerts) ? data.alerts : [];

  const hasFeedConsumptionData =
    Array.isArray(feed) &&
    feed.length > 0 &&
    feed.some((item) => {
      const numericValue = Number(item?.value);
      if (Number.isFinite(numericValue)) return numericValue > 0;
      return Boolean(item?.value);
    });

  const handleExport = async () => {
    try {
      const response = await api.get("/export/pdf", {
        responseType: "blob",
      });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "dashboard_report.pdf";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed: ", error);
    }
  };

  function formatCurrency(value) {
    if (value == null || isNaN(value) || Number(value) === 0) return "—";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(value);
  }

  function formatCount(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "—";
    return numeric;
  }

  return (
    <DashboardLayout>
      <div className="font-body">
        {/* Header */}
        <div className="animate-fadeIn flex items-center justify-between gap-3 mb-4">
          <h1 className="text-xl sm:text-h2 font-semibold font-header">
            Dashboard
          </h1>
          <button
            onClick={handleExport}
            title="Download a PDF snapshot of this dashboard"
            className="w-auto justify-center flex items-center gap-2 bg-accent-primary text-darkText dark:bg-accent-primary dark:text-darkText px-4 py-2 rounded-lg hover:bg-primary/30 transition font-body"
          >
            <Download size={18} />
            Export
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, idx) => (
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
              : [
                  <SummaryCard
                    key="summary-layers"
                    icon={
                      <GiChicken className="w-8 h-8 sm:w-10 sm:h-10 text-amber-200" />
                    }
                    title="Layers"
                    value={formatCount(totals.totalLivestockCount)}
                    subtitle="Total birds"
                    titleClass="font-header"
                    valueClass="font-body"
                    className="min-h-[92px]"
                  />,
                  <SummaryCard
                    key="summary-ponds"
                    icon={
                      <PiFishSimpleBold className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-200" />
                    }
                    title="Fish Ponds"
                    value={formatCount(totals.totalPondCount)}
                    subtitle="Active ponds"
                    titleClass="font-header"
                    valueClass="font-body"
                    className="min-h-[92px]"
                  />,
                  <SummaryCard
                    key="summary-crates"
                    icon={
                      <Egg className="w-8 h-8 sm:w-10 sm:h-10 text-amber-100" />
                    }
                    title="Total Crates Today"
                    value={formatCount(totals.totalCratesProducedToday)}
                    subtitle="Today's production"
                    titleClass="font-header"
                    valueClass="font-body"
                    className="min-h-[92px]"
                  />,
                  <SummaryCard
                    key="summary-sales"
                    icon={
                      <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-status-success" />
                    }
                    title="This Month Sales"
                    value={formatCurrency(totals.totalRevenueThisMonth)}
                    subtitle="Month to date"
                    titleClass="font-header"
                    valueClass="font-body"
                    className="min-h-[92px]"
                  />,
                ]}
          </div>

          {/* Charts Row */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-white dark:bg-darkCard shadow-neo dark:shadow-dark p-4 rounded-xl">
              <h3 className="text-lg mb-2 font-header">Production Overview</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-body">
                Monthly output trend based on recorded production entries.
              </p>
              <div className="w-full h-[260px] sm:h-[300px] md:h-[340px]">
                {loading ? (
                  <div className="skeleton-glass w-full h-full rounded-lg" />
                ) : (
                  <ProductionChart
                    productionData={data?.productionSeries || []}
                  />
                )}
              </div>
            </div>

            <div className="flex-1 bg-white dark:bg-darkCard shadow-neo dark:shadow-dark p-4 rounded-xl">
              <h3 className="text-lg mb-4 font-header">Feed Consumption</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-body">
                Share of feed usage across livestock and fish categories.
              </p>
              {loading ? (
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
                      Log feed usage for your layers, ducks, or fish to see the
                      breakdown here.
                    </p>
                    <button
                      className="mt-2 w-full sm:w-auto px-5 py-2 bg-accent-primary text-white rounded-lg transition hover:opacity-90 active:scale-[0.98]"
                      onClick={() => {
                        window.location.href = "/feed/add";
                      }}
                    >
                      Log Feed Consumption
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row w-full items-stretch sm:items-center gap-4 font-body">
                  <div className="flex-1 min-w-0 sm:min-w-[120px]">
                    <FeedPie breakdown={feed} />
                  </div>
                  <div className="flex-1 w-full">
                    {feed.map((f) => (
                      <div
                        key={f.label}
                        className="flex items-center gap-3 mb-2"
                      >
                        <span
                          className="w-6 h-3 rounded-full"
                          style={{
                            background:
                              COLORS[f.label.toLowerCase()] || "#9CA3AF",
                          }}
                        />
                        <div>
                          <div className="text-sm font-body">{f.label}</div>
                          <div className="text-xs text-slate-400 font-body">
                            {f.value}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Revenue + Upcoming Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              {loading ? (
                <div className="bg-white/10 dark:bg-darkCard/70 rounded-xl shadow-neo dark:shadow-dark p-5 h-[320px] sm:h-[360px]">
                  <div className="skeleton-glass h-4 w-28 sm:w-32 rounded mb-3" />
                  <div className="skeleton-glass h-8 w-36 sm:w-40 rounded mb-6" />
                  <div className="skeleton-glass h-48 sm:h-64 rounded" />
                </div>
              ) : (
                <RevenueExpenseChart data={data?.monthlyFinance} />
              )}
            </div>
            <div className="md:flex md:col-span-1">
              {loading ? (
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
                <UpcomingTaskPanel className="h-full" />
              )}
            </div>
          </div>

          {/* Feed Watchlist & Health Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {loading ? (
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
              <FeedWatchlistPanel feeds={watchlist} />
            )}

            {loading ? (
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
              <HealthAlertsPanel alerts={alerts} />
            )}
          </div>

          {/* Recent Activities Table */}
          {loading ? (
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
            className="overflow-x-auto shadow-neo dark:shadow-dark mt-4"
            title="Recent farm activities across modules"
          >
            <RecentTable items={recent} />
          </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

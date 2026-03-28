import React from "react";
import { Activity, AlertCircle, ArrowUpRight, BellRing, Blocks, Building2, Radar, RefreshCw, Rocket, ShieldCheck, Users } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Badge from "../../components/Badge";
import Card from "../../components/Card";
import Button from "../../components/Button";
import PlatformMetricCard from "../../components/PlatformMetricCard";
import { MetricCardSkeleton } from "../../components/Skeleton";
import { useToast } from "../../components/ToastProvider";
import { getApiErrorMessage, platformAxios, unwrapApiResponse } from "../../api/platformClient";
import { PLATFORM_ENDPOINTS } from "../../api/endpoints";
import {
  formatCompactCurrencyValue,
  formatCurrencyValue,
  formatDateTime,
  formatNumber,
  normalizePagination,
} from "../../utils/formatters";
import { normalizePlanId } from "../../constants/plans";
import {
  APP_PORTFOLIO_FALLBACK,
  getAppLifecycleLabel,
  getAppLifecycleTone,
  normalizeAppPortfolio,
} from "./appHub";
import PortfolioAnalyticsSection from "./PortfolioAnalyticsSection";
import {
  buildPlatformCatalogPortfolio,
  buildPlatformDemoSnapshot,
  mergeLivePlatformPortfolio,
} from "./platformWorkbench";
import { filterPlatformUsers, resolvePlatformAccessTier } from "./platformInsights";
import { getUserDisplayName } from "../../services/userProfileService";

const FALLBACK = {
  totalApps: 0,
  liveApps: 0,
  plannedApps: 0,
  totalTenants: 0,
  activeTenants: 0,
  suspendedTenants: 0,
  totalUsers: 0,
  platformAdmins: 0,
};

const SIGNAL_PULSE_INTERVAL_MS = 6000;

const METRIC_CONFIG = [
  {
    key: "totalApps",
    icon: Blocks,
    label: "Apps In Portfolio",
    tone: "blue",
    note: "Products tracked in ROOTS",
  },
  {
    key: "liveApps",
    icon: Rocket,
    label: "Live Apps",
    tone: "blue",
    note: "Currently serving live workspaces",
  },
  {
    key: "totalTenants",
    icon: Building2,
    label: "Total Tenants",
    tone: "purple",
    note: "Customer workspaces under management",
  },
  {
    key: "activeTenants",
    icon: Activity,
    label: "Active Tenants",
    tone: "purple",
    note: "Workspaces currently active",
  },
  {
    key: "totalUsers",
    icon: Users,
    label: "Total Users",
    tone: "green",
    note: "Operators visible across ROOTS",
  },
  {
    key: "platformAdmins",
    icon: ShieldCheck,
    label: "ROOTS Admins",
    tone: "green",
    note: "Admins with full platform access",
  },
];

function toneDotClass(tone) {
  if (tone === "cyan") return "bg-sky-300";
  if (tone === "indigo") return "bg-indigo-300";
  if (tone === "blue") return "bg-indigo-400";
  if (tone === "rose") return "bg-rose-400";
  if (tone === "amber") return "bg-violet-300";
  return "bg-violet-400";
}

function resolveUserEnabled(user) {
  if (typeof user?.enabled === "boolean") return user.enabled;
  if (typeof user?.active === "boolean") return user.active;
  return true;
}

function toEpoch(value) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function toRelativeTime(value) {
  const epoch = toEpoch(value);
  if (!epoch) return "recently";

  const delta = Date.now() - epoch;
  if (delta < 60_000) return "just now";
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)} min ago`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)} hrs ago`;
  return formatDateTime(value);
}

function buildSignals(tenants, users) {
  const tenantSignals = tenants.map((tenant, index) => {
    const status = String(tenant?.status || "").toUpperCase();
    const name = tenant?.name || tenant?.slug || "Tenant";
    const when = tenant?.lastActivityAt || tenant?.lastActivity || tenant?.updatedAt || tenant?.createdAt;

    if (status === "SUSPENDED") {
      return {
        id: `tenant-${tenant?.id || index}-suspended`,
        tone: "rose",
        text: `Tenant suspended: ${name}`,
        when,
      };
    }

    return {
      id: `tenant-${tenant?.id || index}-active`,
      tone: "green",
      text: `Tenant active: ${name}`,
      when,
    };
  });

  const userSignals = users.map((user, index) => {
    const role = String(user?.role || "").toUpperCase();
    const enabled = resolveUserEnabled(user);
    const username = getUserDisplayName(user, "User");
    const when = user?.createdAt || user?.updatedAt;

    if (!enabled) {
      return {
        id: `user-${user?.id || index}-disabled`,
        tone: "rose",
        text: `User disabled: ${username}`,
        when,
      };
    }

    if (role === "PLATFORM_ADMIN") {
      return {
        id: `user-${user?.id || index}-admin`,
        tone: "violet",
        text: `ROOTS admin active: ${username}`,
        when,
      };
    }

    return {
      id: `user-${user?.id || index}-active`,
      tone: "blue",
      text: `User active: ${username}`,
      when,
    };
  });

  return [...tenantSignals, ...userSignals]
    .sort((a, b) => toEpoch(b.when) - toEpoch(a.when))
    .slice(0, 6)
    .map((signal) => ({
      ...signal,
      time: toRelativeTime(signal.when),
    }));
}

function signalLaneColors(tone) {
  if (tone === "emerald") {
    return {
      stroke: "#34d399",
      glow: "rgba(52, 211, 153, 0.28)",
      tint: "border-emerald-300/55 bg-emerald-50/92 text-emerald-800 shadow-[0_12px_24px_rgba(16,185,129,0.12)] dark:border-emerald-300/20 dark:bg-emerald-400/12 dark:text-emerald-100 dark:ring-1 dark:ring-emerald-300/20",
      pill: "border-emerald-300/50 bg-emerald-50/92 text-emerald-700 dark:border-emerald-300/22 dark:bg-emerald-400/10 dark:text-emerald-100",
    };
  }

  if (tone === "blue") {
    return {
      stroke: "#60a5fa",
      glow: "rgba(96, 165, 250, 0.28)",
      tint: "border-sky-300/55 bg-sky-50/92 text-sky-800 shadow-[0_12px_24px_rgba(14,165,233,0.12)] dark:border-sky-300/20 dark:bg-sky-400/12 dark:text-sky-100 dark:ring-1 dark:ring-sky-300/20",
      pill: "border-sky-300/50 bg-sky-50/92 text-sky-700 dark:border-sky-300/22 dark:bg-sky-400/10 dark:text-sky-100",
    };
  }

  return {
    stroke: "#8b5cf6",
    glow: "rgba(139, 92, 246, 0.28)",
    tint: "border-violet-300/55 bg-violet-50/92 text-violet-800 shadow-[0_12px_24px_rgba(139,92,246,0.12)] dark:border-violet-300/20 dark:bg-violet-400/12 dark:text-violet-100 dark:ring-1 dark:ring-violet-300/20",
    pill: "border-violet-300/50 bg-violet-50/92 text-violet-700 dark:border-violet-300/22 dark:bg-violet-400/10 dark:text-violet-100",
  };
}

function SignalWave({ lanes = [], activeLaneId = "", pulseVersion = 0 }) {
  const paths = React.useMemo(
    () => [
      "M0 78 C24 44, 48 42, 72 76 S118 122, 144 78 188 34, 214 72 260 126, 320 52",
      "M0 90 C28 114, 52 114, 76 86 S122 48, 146 86 190 124, 220 82 266 40, 320 76",
      "M0 70 C26 28, 52 28, 78 68 S124 116, 150 74 196 32, 224 70 270 116, 320 58",
    ],
    [],
  );

  return (
    <svg viewBox="0 0 320 140" className="h-36 w-full">
      <style>
        {`
          @keyframes platform-signal-sweep {
            0% {
              opacity: 0;
              stroke-dashoffset: 240;
            }
            12% {
              opacity: 0.95;
            }
            100% {
              opacity: 0;
              stroke-dashoffset: 0;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            [data-platform-signal-sweep="true"] {
              animation: none !important;
              opacity: 0 !important;
            }
          }
        `}
      </style>
      <defs>
        <linearGradient id="atlas-wave-grid" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(148,163,184,0.02)" />
          <stop offset="100%" stopColor="rgba(148,163,184,0.08)" />
        </linearGradient>
        <filter id="atlas-wave-soft-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d="M0 30 H320" stroke="url(#atlas-wave-grid)" strokeWidth="1" />
      <path d="M0 70 H320" stroke="url(#atlas-wave-grid)" strokeWidth="1" />
      <path d="M0 110 H320" stroke="url(#atlas-wave-grid)" strokeWidth="1" />
      {lanes.map((lane, index) => {
        const colors = signalLaneColors(lane.tone);
        const path = paths[index] || paths[paths.length - 1];
        const isActive = activeLaneId ? activeLaneId === lane.id : index === 0;

        return (
          <g key={lane.id}>
            <path
              d={path}
              fill="none"
              stroke={colors.stroke}
              strokeWidth={isActive ? 3.8 : 2.4}
              strokeLinecap="round"
              opacity={isActive ? 0.96 : 0.42}
              style={{ filter: isActive ? `drop-shadow(0 0 12px ${colors.glow})` : "none" }}
            />
            <path
              key={`${lane.id}-${pulseVersion}`}
              d={path}
              fill="none"
              stroke={colors.stroke}
              strokeWidth={isActive ? 4.8 : 3.4}
              strokeLinecap="round"
              strokeDasharray="28 260"
              data-platform-signal-sweep="true"
              style={{
                opacity: 0,
                animation: pulseVersion > 0 ? "platform-signal-sweep 1.5s ease-out 1" : "none",
                filter: `drop-shadow(0 0 10px ${colors.glow})`,
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}

function lifecyclePillClasses(lifecycle) {
  const tone = getAppLifecycleTone(lifecycle);
  if (tone === "indigo") {
    return "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-400/50 dark:bg-indigo-500/20 dark:text-indigo-200";
  }
  if (tone === "violet") {
    return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/50 dark:bg-violet-500/20 dark:text-violet-200";
  }
  return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-400/50 dark:bg-fuchsia-500/20 dark:text-fuchsia-200";
}

function PortfolioCard({ app, onOpen, className = "" }) {
  return (
    <Card className={`atlas-stage-card flex h-full flex-col gap-4 p-4 ${className}`}>
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
            {app.category}
          </div>
          <h3 className="mt-1 text-lg font-semibold text-[var(--atlas-text-strong)]">
            {app.name}
          </h3>
        </div>
        <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${lifecyclePillClasses(app.lifecycle)}`}>
          {getAppLifecycleLabel(app.lifecycle)}
        </span>
      </div>

      <div className="relative z-10 text-sm font-medium text-[var(--atlas-text-strong)]">
        {app.headline || "Platform app"}
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-3 2xl:grid-cols-3">
        <div className="min-w-0 rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3">
          <div className="break-words text-[10px] uppercase tracking-[0.14em] text-[var(--atlas-muted)]">
            Workspaces
          </div>
          <div className="mt-2 text-2xl font-semibold text-[var(--atlas-text-strong)]">
            {formatNumber(app.tenantCount)}
          </div>
          <div className="mt-1 break-words text-xs leading-5 text-[var(--atlas-muted)]">
            {formatNumber(app.activeTenantCount)} active
          </div>
        </div>
        <div className="min-w-0 rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3">
          <div className="break-words text-[10px] uppercase tracking-[0.14em] text-[var(--atlas-muted)]">
            Operators
          </div>
          <div className="mt-2 text-2xl font-semibold text-[var(--atlas-text-strong)]">
            {formatNumber(app.operatorCount)}
          </div>
          <div className="mt-1 break-words text-xs leading-5 text-[var(--atlas-muted)]">
            Platform coverage
          </div>
        </div>
        <div className="col-span-2 min-w-0 rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3 2xl:col-span-1">
          <div className="break-words text-[10px] uppercase tracking-[0.14em] text-[var(--atlas-muted)]">
            Revenue
          </div>
          <div className="mt-2 text-lg font-semibold text-[var(--atlas-text-strong)]">
            {formatCompactCurrencyValue(app.revenueGenerated, app.revenueCurrency, {
              maximumFractionDigits: 1,
            })}
          </div>
          <div className="mt-1 break-words text-xs leading-5 text-[var(--atlas-muted)]">
            Recurring billing
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-wrap gap-2">
        {app.capabilities.slice(0, 3).map((capability) => (
          <span
            key={`${app.id}-${capability}`}
            className="inline-flex rounded-full border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)]/80 px-2.5 py-1 text-[11px] font-medium text-[var(--atlas-text)]"
          >
            {capability}
          </span>
        ))}
      </div>

      <div className="relative z-10 mt-auto">
        <Button variant="outline" size="sm" onClick={() => onOpen(app)}>
          <ArrowUpRight size={14} />
          {app.consolePath ? "Open" : "View"}
        </Button>
      </div>
    </Card>
  );
}

export default function PlatformDashboardPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const {
    platformDataMode = "live",
    customApps = [],
    platformLimitedAccess = false,
  } = useOutletContext() || {};
  const demoSnapshot = React.useMemo(
    () => buildPlatformDemoSnapshot(customApps),
    [customApps],
  );

  const [metrics, setMetrics] = React.useState(FALLBACK);
  const [overviewLoading, setOverviewLoading] = React.useState(true);
  const [overviewError, setOverviewError] = React.useState("");

  const [portfolio, setPortfolio] = React.useState(APP_PORTFOLIO_FALLBACK);
  const [portfolioLoading, setPortfolioLoading] = React.useState(true);
  const [portfolioError, setPortfolioError] = React.useState("");

  const [recentTenants, setRecentTenants] = React.useState([]);
  const [tenantsLoading, setTenantsLoading] = React.useState(true);
  const [tenantsError, setTenantsError] = React.useState("");

  const [recentUsers, setRecentUsers] = React.useState([]);
  const [usersLoading, setUsersLoading] = React.useState(true);
  const [usersError, setUsersError] = React.useState("");
  const [signalPulseVersion, setSignalPulseVersion] = React.useState(0);
  const [signalsUpdatedAt, setSignalsUpdatedAt] = React.useState(() => new Date().toISOString());
  const [activeSignalLaneId, setActiveSignalLaneId] = React.useState("workspaces");

  const loadOverview = React.useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError("");

    if (platformDataMode === "demo") {
      setMetrics(demoSnapshot.metrics);
      setOverviewLoading(false);
      return;
    }

    try {
      const response = await platformAxios.get(PLATFORM_ENDPOINTS.overview);
      const data = unwrapApiResponse(response.data, "Failed to load platform overview");
      const nextMetrics = { ...FALLBACK, ...(data || {}) };
      const hasLiveOverviewData = Boolean(
        Number(nextMetrics.totalTenants || 0) ||
          Number(nextMetrics.totalUsers || 0) ||
          Number(nextMetrics.platformAdmins || 0),
      );
      setMetrics(hasLiveOverviewData ? nextMetrics : demoSnapshot.metrics);
    } catch (error) {
      setMetrics(demoSnapshot.metrics);
      setOverviewError(
        platformLimitedAccess ? "" : getApiErrorMessage(error, "Overview unavailable"),
      );
    } finally {
      setOverviewLoading(false);
    }
  }, [demoSnapshot.metrics, platformDataMode, platformLimitedAccess]);

  const loadPortfolio = React.useCallback(async () => {
    setPortfolioLoading(true);
    setPortfolioError("");

    if (platformDataMode === "demo") {
      setPortfolio(demoSnapshot.portfolio);
      setPortfolioLoading(false);
      return;
    }

    try {
      const response = await platformAxios.get(PLATFORM_ENDPOINTS.apps);
      const data = unwrapApiResponse(response.data, "Failed to load app portfolio");
      const livePortfolio = mergeLivePlatformPortfolio(normalizeAppPortfolio(data), customApps);
      setPortfolio(livePortfolio.apps.length > 0 ? livePortfolio : demoSnapshot.portfolio);
    } catch (error) {
      setPortfolio(demoSnapshot.portfolio);
      setPortfolioError(
        platformLimitedAccess ? "" : getApiErrorMessage(error, "App portfolio unavailable"),
      );
    } finally {
      setPortfolioLoading(false);
    }
  }, [customApps, demoSnapshot.portfolio, platformDataMode, platformLimitedAccess]);

  const loadRecentTenants = React.useCallback(async () => {
    setTenantsLoading(true);
    setTenantsError("");

    if (platformDataMode === "demo") {
      setRecentTenants(demoSnapshot.tenants);
      setTenantsLoading(false);
      return;
    }

    try {
      const response = await platformAxios.get(PLATFORM_ENDPOINTS.tenants, {
        params: { page: 0, size: 5 },
      });
      const payload = unwrapApiResponse(response.data, "Failed to load tenants");
      const normalized = normalizePagination(payload, { page: 0, size: 5 });
      const nextTenants = normalized.items || [];
      setRecentTenants(nextTenants.length === 0 ? demoSnapshot.tenants : nextTenants);
    } catch (error) {
      setRecentTenants(demoSnapshot.tenants);
      setTenantsError(
        platformLimitedAccess ? "" : getApiErrorMessage(error, "Failed to load tenants"),
      );
    } finally {
      setTenantsLoading(false);
    }
  }, [demoSnapshot.tenants, platformDataMode, platformLimitedAccess]);

  const loadRecentUsers = React.useCallback(async () => {
    setUsersLoading(true);
    setUsersError("");

    if (platformDataMode === "demo") {
      setRecentUsers(filterPlatformUsers(demoSnapshot.users));
      setUsersLoading(false);
      return;
    }

    try {
      const response = await platformAxios.get(PLATFORM_ENDPOINTS.users, {
        params: { page: 0, size: 5, platformOnly: true },
      });
      const payload = unwrapApiResponse(response.data, "Failed to load users");
      const normalized = normalizePagination(payload, { page: 0, size: 5 });
      const nextUsers = filterPlatformUsers(normalized.items);
      setRecentUsers(nextUsers.length === 0 ? filterPlatformUsers(demoSnapshot.users) : nextUsers);
    } catch (error) {
      setRecentUsers(filterPlatformUsers(demoSnapshot.users));
      setUsersError(
        platformLimitedAccess ? "" : getApiErrorMessage(error, "Failed to load users"),
      );
    } finally {
      setUsersLoading(false);
    }
  }, [demoSnapshot.users, platformDataMode, platformLimitedAccess]);

  const loadAll = React.useCallback(async () => {
    await Promise.all([loadOverview(), loadPortfolio(), loadRecentTenants(), loadRecentUsers()]);
    setSignalsUpdatedAt(new Date().toISOString());
    setSignalPulseVersion((current) => current + 1);
  }, [loadOverview, loadPortfolio, loadRecentTenants, loadRecentUsers]);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSignalPulseVersion((current) => current + 1);
    }, SIGNAL_PULSE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const signals = React.useMemo(() => buildSignals(recentTenants, recentUsers), [recentTenants, recentUsers]);
  const featuredApps = React.useMemo(() => portfolio.apps.slice(0, 4), [portfolio.apps]);
  const portfolioRevenue = React.useMemo(
    () => portfolio.apps.reduce((sum, app) => sum + Number(app.revenueGenerated || 0), 0),
    [portfolio.apps],
  );
  const portfolioRevenueCurrency = React.useMemo(
    () => portfolio.apps.find((app) => String(app?.revenueCurrency || "").trim())?.revenueCurrency || "NGN",
    [portfolio.apps],
  );
  const displayMetrics = React.useMemo(
    () => ({
      ...metrics,
      totalApps: portfolio.totalApps,
      liveApps: portfolio.liveApps,
      plannedApps: portfolio.plannedApps,
    }),
    [metrics, portfolio.liveApps, portfolio.plannedApps, portfolio.totalApps],
  );
  const liveSignalStatus = React.useMemo(() => {
    if (platformDataMode === "demo") {
      return {
        label: "Demo",
        detail: "Demo signal feed",
        classes: "border-blue-300/55 bg-blue-50/92 text-blue-700 shadow-[0_10px_22px_rgba(59,130,246,0.08)] dark:border-blue-300/18 dark:bg-blue-400/10 dark:text-blue-100",
      };
    }

    if (overviewError || portfolioError || tenantsError || usersError) {
      return {
        label: "Snapshot",
        detail: "Fallback signal surface",
        classes: "border-amber-300/55 bg-amber-50/94 text-amber-700 shadow-[0_10px_22px_rgba(245,158,11,0.08)] dark:border-amber-300/18 dark:bg-amber-400/10 dark:text-amber-100",
      };
    }

    return {
      label: "Live",
      detail: "Synchronized to platform data",
      classes: "border-emerald-300/55 bg-emerald-50/92 text-emerald-700 shadow-[0_10px_22px_rgba(16,185,129,0.08)] dark:border-emerald-300/18 dark:bg-emerald-400/10 dark:text-emerald-100",
    };
  }, [overviewError, platformDataMode, portfolioError, tenantsError, usersError]);
  const liveSignalLanes = React.useMemo(
    () => [
      {
        id: "workspaces",
        label: "Workspaces",
        value: `${formatNumber(displayMetrics.activeTenants)}/${formatNumber(displayMetrics.totalTenants)}`,
        detail: "Currently active across ROOTS",
        tone: "violet",
      },
      {
        id: "operators",
        label: "Operators",
        value: formatNumber(displayMetrics.totalUsers),
        detail: `${formatNumber(displayMetrics.platformAdmins)} admins in command lanes`,
        tone: "blue",
      },
      {
        id: "revenue",
        label: "Revenue",
        value: formatCompactCurrencyValue(portfolioRevenue, portfolioRevenueCurrency, {
          maximumFractionDigits: 1,
        }),
        detail: `${formatNumber(displayMetrics.liveApps)} live app lane${Number(displayMetrics.liveApps) === 1 ? "" : "s"} contributing`,
        tone: "emerald",
      },
    ],
    [
      displayMetrics.activeTenants,
      displayMetrics.liveApps,
      displayMetrics.platformAdmins,
      displayMetrics.totalTenants,
      displayMetrics.totalUsers,
      portfolioRevenue,
      portfolioRevenueCurrency,
    ],
  );
  const activeSignalLane =
    liveSignalLanes.find((lane) => lane.id === activeSignalLaneId) || liveSignalLanes[0];

  React.useEffect(() => {
    if (
      platformDataMode === "live" &&
      !platformLimitedAccess &&
      (overviewError || portfolioError || tenantsError || usersError)
    ) {
      notify("Some dashboard sections are unavailable. Showing partial live data.", "info");
    }
  }, [
    notify,
    overviewError,
    platformDataMode,
    platformLimitedAccess,
    portfolioError,
    tenantsError,
    usersError,
  ]);

  return (
    <div className="space-y-5">
      {(overviewError || portfolioError || tenantsError || usersError) && (
        <Card className="border-violet-300/60 bg-violet-50 dark:border-violet-300/30 dark:bg-violet-500/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-violet-800 dark:text-violet-100">
              <AlertCircle size={14} className="text-violet-600 dark:text-violet-200" />
              <span>
                {overviewError && `Metrics: ${overviewError}`}
                {overviewError && (portfolioError || tenantsError || usersError) ? " | " : ""}
                {portfolioError && `Apps: ${portfolioError}`}
                {portfolioError && (tenantsError || usersError) ? " | " : ""}
                {tenantsError && `Tenants: ${tenantsError}`}
                {tenantsError && usersError ? " | " : ""}
                {usersError && `Users: ${usersError}`}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={loadAll}>
              <RefreshCw size={14} />
              Retry All
            </Button>
          </div>
        </Card>
      )}

      <section className="grid gap-4 xl:grid-cols-[1.45fr_0.9fr]">
        <Card className="atlas-stage-card min-h-[280px] p-5 md:p-6">
          <div className="relative z-10 flex h-full flex-col justify-between gap-8 xl:max-w-[60%]">
            <div>
              <div className="atlas-signal-chip w-fit">
                <Rocket size={12} />
                Platform Snapshot
              </div>
              <h1 className="mt-5 max-w-xl font-header text-3xl font-semibold leading-tight text-[var(--atlas-text-strong)] md:text-[2.6rem]">
                Manage apps, workspaces, and operators from one ROOTS view.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--atlas-muted)] md:text-[15px]">
                Track revenue, workspace health, access coverage, and product status in one place.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <div className="col-span-2 rounded-[1.2rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/70 p-4 md:col-span-1">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--atlas-muted)]">
                  Live Apps
                </div>
                <div className="mt-2 text-2xl font-semibold text-[var(--atlas-text-strong)]">
                  {formatNumber(metrics.liveApps)}
                </div>
              </div>
              <div className="rounded-[1.2rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/70 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--atlas-muted)]">
                  Workspaces
                </div>
                <div className="mt-2 text-2xl font-semibold text-[var(--atlas-text-strong)]">
                  {formatNumber(metrics.totalTenants)}
                </div>
              </div>
              <div className="rounded-[1.2rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/70 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--atlas-muted)]">
                  Operators
                </div>
                <div className="mt-2 text-2xl font-semibold text-[var(--atlas-text-strong)]">
                  {formatNumber(metrics.totalUsers)}
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute right-8 top-8 hidden h-24 w-24 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl md:block" />
          <div className="pointer-events-none absolute right-14 top-20 hidden h-44 w-44 rounded-full bg-fuchsia-500/18 blur-[50px] md:block" />
          <div className="pointer-events-none absolute bottom-10 right-28 hidden h-36 w-36 rounded-full bg-violet-500/20 blur-[44px] md:block" />
          <div className="pointer-events-none absolute bottom-12 right-12 hidden h-24 w-24 rounded-[2rem] rotate-12 bg-gradient-to-br from-indigo-300/35 via-violet-400/20 to-fuchsia-500/20 blur-[2px] md:block" />
          <div className="pointer-events-none absolute right-24 top-28 hidden h-20 w-20 rounded-full border border-indigo-300/35 bg-indigo-200/10 md:block" />
          <div className="pointer-events-none absolute bottom-16 right-40 hidden h-10 w-10 rounded-full border border-fuchsia-300/35 bg-fuchsia-300/10 md:block" />
        </Card>

        <Card className="atlas-stage-card atlas-dot-grid p-5">
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--atlas-muted)]">
                Live Signals
              </div>
              <div className="mt-1 font-header text-xl font-semibold text-[var(--atlas-text-strong)]">
                Live activity
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${liveSignalStatus.classes}`}>
                {liveSignalStatus.label}
              </div>
              <Button variant="outline" size="sm" onClick={loadAll}>
                <RefreshCw size={14} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="relative z-10 mt-4 grid gap-2 sm:grid-cols-3">
            {liveSignalLanes.map((lane) => {
              const laneColors = signalLaneColors(lane.tone);
              const isActive = activeSignalLane?.id === lane.id;

              return (
                <button
                  key={lane.id}
                  type="button"
                  onClick={() => setActiveSignalLaneId(lane.id)}
                  onFocus={() => setActiveSignalLaneId(lane.id)}
                  className={`rounded-[1rem] border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--atlas-surface)] ${isActive ? laneColors.tint : "border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/70 text-[var(--atlas-text)] hover:border-[color:var(--atlas-border-strong)]"}`}
                >
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em]">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: signalLaneColors(lane.tone).stroke }}
                    />
                    <span>{lane.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="relative z-10 mt-4 rounded-[1.4rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                  {activeSignalLane?.label || "Signal"}
                </div>
                <div className="mt-1 text-2xl font-semibold text-[var(--atlas-text-strong)]">
                  {activeSignalLane?.value}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                  Updated
                </div>
                <div className="mt-1 text-xs font-medium text-[var(--atlas-text-strong)]">
                  {toRelativeTime(signalsUpdatedAt)}
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs leading-5 text-[var(--atlas-muted)]">
              {activeSignalLane?.detail || liveSignalStatus.detail}
            </div>
            <SignalWave
              lanes={liveSignalLanes}
              activeLaneId={activeSignalLane?.id}
              pulseVersion={signalPulseVersion}
            />
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-6">
        {overviewLoading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx}>
                <MetricCardSkeleton />
              </div>
            ))
          : METRIC_CONFIG.map((card) => (
              <div key={card.key}>
                <PlatformMetricCard
                  label={card.label}
                  tone={card.tone}
                  icon={card.icon}
                  hint={card.note}
                  value={formatNumber(displayMetrics[card.key])}
                />
              </div>
            ))}
      </section>

      <PortfolioAnalyticsSection
        apps={portfolio.apps}
        loading={portfolioLoading}
        compact
        title="Platform analytics"
        subtitle="Revenue, footprint, and lifecycle charts for the ROOTS platform."
      />

      <section>
        <Card className="atlas-data-shell p-0">
          <div className="border-b border-[color:var(--atlas-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Blocks size={16} className="text-[var(--atlas-muted)]" />
              <h3 className="font-header text-xl font-semibold text-[var(--atlas-text-strong)]">Application Portfolio</h3>
            </div>
            <p className="mt-1 text-sm text-[var(--atlas-muted)]">
              Live and planned apps across ROOTS.
            </p>
          </div>

          <div className="px-4 py-4">
            {portfolioLoading ? (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={`app-loading-${idx}`}
                    className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-4 py-8 text-sm text-[var(--atlas-muted)]"
                  >
                    Loading app portfolio...
                  </div>
                ))}
              </div>
            ) : featuredApps.length === 0 ? (
              <div>
                <Card className="border-dashed p-6 text-sm text-[var(--atlas-muted)]">
                  No apps are registered yet.
                </Card>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                {featuredApps.map((app) => (
                  <PortfolioCard
                    key={app.id}
                    app={app}
                    className="h-full"
                    onOpen={(entry) => navigate(entry.consolePath || "/platform/apps")}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.5fr]">
        <Card className="atlas-data-shell p-0">
          <div className="flex items-center justify-between border-b border-[color:var(--atlas-border)] px-4 py-3">
            <div className="flex items-center gap-2 text-[var(--atlas-text-strong)]">
              <Radar size={16} className="text-violet-600 dark:text-fuchsia-300" />
              <h3 className="text-base font-semibold">Signals</h3>
            </div>
            <BellRing size={15} className="text-[var(--atlas-muted)]" />
          </div>

          <div className="space-y-2 p-3">
            {(tenantsLoading || usersLoading) && (
              <div className="rounded-lg border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 py-3 text-sm text-[var(--atlas-muted)]">
                Loading recent activity...
              </div>
            )}

            {!tenantsLoading && !usersLoading && signals.length === 0 && (
              <div className="rounded-lg border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 py-3 text-sm text-[var(--atlas-muted)]">
                No recent platform activity yet.
              </div>
            )}

            {!tenantsLoading && !usersLoading &&
              signals.map((signal) => (
                <div
                  key={signal.id}
                  className="rounded-[1.1rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${toneDotClass(signal.tone)}`} />
                      <div className="text-sm text-[var(--atlas-text-strong)]">{signal.text}</div>
                    </div>
                    <span className="shrink-0 text-xs text-[var(--atlas-muted)]">{signal.time}</span>
                  </div>
                </div>
              ))}
          </div>
        </Card>

        <Card className="atlas-data-shell p-0">
          <div className="flex items-center justify-between border-b border-[color:var(--atlas-border)] px-4 py-3">
            <h3 className="font-header text-xl font-semibold text-[var(--atlas-text-strong)]">Tenants Overview</h3>
            <Button variant="outline" size="sm" onClick={loadRecentTenants}>
              <RefreshCw size={14} />
              Retry
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-[color:var(--atlas-border)] text-left text-xs uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                  <th className="px-4 py-3">App</th>
                  <th className="px-4 py-3">Tenant Name</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Members</th>
                  <th className="px-4 py-3">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {tenantsLoading &&
                  Array.from({ length: 3 }).map((_, idx) => (
                    <tr key={`tenant-loading-${idx}`} className="border-b border-[color:var(--atlas-border)] last:border-b-0">
                      <td colSpan={7} className="px-4 py-4 text-[var(--atlas-muted)]">Loading tenants...</td>
                    </tr>
                  ))}

                {!tenantsLoading && recentTenants.length === 0 && (
                  <tr className="border-b border-[color:var(--atlas-border)] last:border-b-0">
                    <td colSpan={7} className="px-4 py-4 text-[var(--atlas-muted)]">
                      {tenantsError ? `Unable to load tenants: ${tenantsError}` : "No tenants available."}
                    </td>
                  </tr>
                )}

                {!tenantsLoading &&
                  recentTenants.map((row, index) => {
                    const tenantId = row?.tenantId ?? row?.id ?? `tenant-${index}`;
                    const members = row?.memberCount ?? row?.membersCount ?? 0;
                    const lastActivity = row?.lastActivityAt || row?.lastActivity || row?.updatedAt || row?.createdAt;

                    return (
                      <tr key={tenantId} className="atlas-premium-row border-b border-[color:var(--atlas-border)] last:border-b-0">
                        <td className="px-4 py-3 text-[var(--atlas-text)]">{row?.appName || "KFarms"}</td>
                        <td className="px-4 py-3 font-semibold text-[var(--atlas-text-strong)]">{row?.name || "-"}</td>
                        <td className="px-4 py-3">
                          <Badge kind="plan" value={normalizePlanId(row?.plan, "FREE")} />
                        </td>
                        <td className="px-4 py-3">
                          <Badge kind="status" value={String(row?.status || "ACTIVE").toUpperCase()} />
                        </td>
                        <td className="px-4 py-3 text-[var(--atlas-text)]">{row?.ownerEmail || row?.owner?.email || "-"}</td>
                        <td className="px-4 py-3 font-semibold text-[var(--atlas-text-strong)]">{formatNumber(members)}</td>
                        <td className="px-4 py-3 text-[var(--atlas-muted)]">{formatDateTime(lastActivity)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section>
        <Card className="atlas-data-shell p-0">
          <div className="flex items-center justify-between border-b border-[color:var(--atlas-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[var(--atlas-muted)]" />
              <h3 className="font-header text-xl font-semibold text-[var(--atlas-text-strong)]">Platform Users</h3>
            </div>
            <Button variant="outline" size="sm" onClick={loadRecentUsers}>
              <RefreshCw size={14} />
              Retry
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-[color:var(--atlas-border)] text-left text-xs uppercase tracking-[0.12em] text-[var(--atlas-muted)]">
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading &&
                  Array.from({ length: 3 }).map((_, idx) => (
                    <tr key={`user-loading-${idx}`} className="border-b border-[color:var(--atlas-border)] last:border-b-0">
                      <td colSpan={4} className="px-4 py-4 text-[var(--atlas-muted)]">Loading users...</td>
                    </tr>
                  ))}

                {!usersLoading && recentUsers.length === 0 && (
                  <tr className="border-b border-[color:var(--atlas-border)] last:border-b-0">
                    <td colSpan={4} className="px-4 py-4 text-[var(--atlas-muted)]">
                      {usersError ? `Unable to load users: ${usersError}` : "No users available."}
                    </td>
                  </tr>
                )}

                {!usersLoading &&
                  recentUsers.map((user, index) => {
                    const userId = user?.userId ?? user?.id ?? `user-${index}`;
                    const accessTier = resolvePlatformAccessTier(user);
                    const enabled = resolveUserEnabled(user);

                    return (
                      <tr key={userId} className="atlas-premium-row border-b border-[color:var(--atlas-border)] last:border-b-0">
                        <td className="px-4 py-3 font-semibold text-[var(--atlas-text-strong)]">{user?.username || "-"}</td>
                        <td className="px-4 py-3 text-[var(--atlas-text)]">{user?.email || "-"}</td>
                        <td className="px-4 py-3">
                          <Badge kind="platform-role" value={accessTier} />
                        </td>
                        <td className="px-4 py-3">
                          <Badge kind="active" value={enabled ? "ENABLED" : "DISABLED"} />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end border-t border-[color:var(--atlas-border)] px-4 py-3 text-xs uppercase tracking-[0.14em] text-[var(--atlas-muted)]">
            <ShieldCheck size={13} className="mr-2 text-violet-600 dark:text-violet-300" />
            Access Matrix
          </div>
        </Card>
      </section>
    </div>
  );
}

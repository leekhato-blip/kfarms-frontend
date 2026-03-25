import React from "react";
import { ArrowUpRight, Blocks, Building2, Globe2, Plus, RefreshCw, Rocket } from "lucide-react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import Card from "../../components/Card";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import PlatformMetricCard from "../../components/PlatformMetricCard";
import { useToast } from "../../components/ToastProvider";
import { usePlatformAuth } from "../../auth/AuthProvider";
import { PLATFORM_ENDPOINTS } from "../../api/endpoints";
import { getApiErrorMessage, platformAxios, unwrapApiResponse } from "../../api/platformClient";
import {
  formatCompactCurrencyValue,
  formatCurrencyValue,
  formatNumber,
} from "../../utils/formatters";
import {
  APP_PORTFOLIO_FALLBACK,
  getAppLifecycleLabel,
  getAppLifecycleTone,
  normalizeAppPortfolio,
  splitAppsByLifecycle,
} from "./appHub";
import PortfolioAnalyticsSection from "./PortfolioAnalyticsSection";
import PlatformAppModal from "./PlatformAppModal";
import {
  buildPlatformCatalogPortfolio,
  buildPlatformDemoSnapshot,
  mergeLivePlatformPortfolio,
} from "./platformWorkbench";
import { resolvePlatformAccessTier } from "./platformInsights";

function lifecycleBadgeClasses(lifecycle) {
  const tone = getAppLifecycleTone(lifecycle);
  if (tone === "indigo") {
    return "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-400/50 dark:bg-indigo-500/20 dark:text-indigo-200";
  }
  if (tone === "violet") {
    return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/50 dark:bg-violet-500/20 dark:text-violet-200";
  }
  return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-400/50 dark:bg-fuchsia-500/20 dark:text-fuchsia-200";
}

function appMatchesSearch(app, query) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery) return true;

  const haystack = [
    app?.name,
    app?.category,
    app?.headline,
    app?.description,
    ...(Array.isArray(app?.capabilities) ? app.capabilities : []),
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean)
    .join(" ");

  return haystack.includes(normalizedQuery);
}

function AppCard({ app, onOpenConsole }) {
  const isLive = app.lifecycle === "LIVE";
  const recurringRevenueLabel = formatCompactCurrencyValue(
    app.revenueGenerated,
    app.revenueCurrency,
    {
      maximumFractionDigits: 1,
    },
  );
  const recurringRevenueTooltip = formatCurrencyValue(
    app.revenueGenerated,
    app.revenueCurrency,
  );

  return (
    <Card className="atlas-stage-card flex h-full flex-col gap-4 p-5">
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
            {app.category}
          </div>
          <h3 className="mt-1 text-xl font-semibold text-[var(--atlas-text-strong)]">
            {app.name}
          </h3>
        </div>
        <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] uppercase ${lifecycleBadgeClasses(app.lifecycle)}`}>
          {getAppLifecycleLabel(app.lifecycle)}
        </span>
      </div>

      <div className="relative z-10">
        <div className="text-sm font-medium text-[var(--atlas-text-strong)]">
          {app.headline || "Platform app"}
        </div>
        <div className="mt-2 text-sm leading-6 text-[var(--atlas-muted)]">
          {app.description || "Add more details as this product grows."}
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-3 2xl:grid-cols-4">
        <div className="min-w-0 rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3">
          <div className="break-words text-[10px] uppercase tracking-[0.14em] text-[var(--atlas-muted)]">
            Workspaces
          </div>
          <div className="mt-2 text-[clamp(1.45rem,2.5vw,2rem)] font-semibold leading-[1.05] text-[var(--atlas-text-strong)] tabular-nums">
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
          <div className="mt-2 text-[clamp(1.45rem,2.5vw,2rem)] font-semibold leading-[1.05] text-[var(--atlas-text-strong)] tabular-nums">
            {formatNumber(app.operatorCount)}
          </div>
          <div className="mt-1 break-words text-xs leading-5 text-[var(--atlas-muted)]">
            Platform coverage
          </div>
        </div>
        <div className="min-w-0 rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3">
          <div className="break-words text-[10px] uppercase tracking-[0.14em] text-[var(--atlas-muted)]">
            Recurring revenue
          </div>
          <div
            className="mt-2 max-w-full text-[clamp(1.2rem,2.1vw,1.5rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--atlas-text-strong)]"
            title={recurringRevenueTooltip}
          >
            <span className="[overflow-wrap:anywhere] tabular-nums">
              {recurringRevenueLabel}
            </span>
          </div>
          <div className="mt-1 break-words text-xs leading-5 text-[var(--atlas-muted)]">
            {isLive ? "Billing is active" : "Billing is not active yet"}
          </div>
        </div>
        <div className="min-w-0 rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3">
          <div className="break-words text-[10px] uppercase tracking-[0.14em] text-[var(--atlas-muted)]">
            Suspension risk
          </div>
          <div className="mt-2 text-[clamp(1.45rem,2.5vw,2rem)] font-semibold leading-[1.05] text-[var(--atlas-text-strong)] tabular-nums">
            {formatNumber(app.suspendedTenantCount)}
          </div>
          <div className="mt-1 break-words text-xs leading-5 text-[var(--atlas-muted)]">
            Paused workspaces
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-wrap gap-2">
        {app.capabilities.length > 0 ? app.capabilities.map((capability) => (
          <span
            key={`${app.id}-${capability}`}
            className="inline-flex rounded-full border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)]/80 px-2.5 py-1 text-[11px] font-medium text-[var(--atlas-text)]"
          >
            {capability}
          </span>
        )) : (
          <span className="text-sm text-[var(--atlas-muted)]">No capability tags configured yet.</span>
        )}
      </div>

      <div className="relative z-10 mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant={isLive ? "primary" : "outline"}
          className="w-full sm:w-auto sm:min-w-[10.75rem]"
          onClick={() => onOpenConsole(app)}
          disabled={!app.consolePath}
        >
          <ArrowUpRight size={14} />
          {isLive ? "Open app" : "View planned app"}
        </Button>
        <div className="min-w-0 text-xs leading-5 text-[var(--atlas-muted)] sm:max-w-[12.5rem] sm:text-right lg:max-w-none">
          {app.workspacePath
            ? `Workspace route ${app.workspacePath}`
            : "No live workspace route yet"}
        </div>
      </div>
    </Card>
  );
}

export default function PlatformAppsPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const { user: currentUser } = usePlatformAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    platformDataMode = "live",
    customApps = [],
    createCustomApp,
    openCreateApp: openGlobalCreateApp,
  } = useOutletContext() || {};
  const demoSnapshot = React.useMemo(
    () => buildPlatformDemoSnapshot(customApps),
    [customApps],
  );
  const accessTier = React.useMemo(
    () => resolvePlatformAccessTier(currentUser),
    [currentUser],
  );
  const canManagePortfolio =
    accessTier === "PLATFORM_OWNER" || accessTier === "PLATFORM_ADMIN";

  const [portfolio, setPortfolio] = React.useState(APP_PORTFOLIO_FALLBACK);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const composeOpen = searchParams.get("compose") === "1";
  const appSearch = searchParams.get("search")?.trim() || "";

  const openCreateApp = React.useCallback(() => {
    if (!canManagePortfolio) {
      notify("Only platform admins can stage a new planned app.", "info");
      return;
    }

    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("compose", "1");
      return next;
    });
  }, [canManagePortfolio, notify, setSearchParams]);

  const closeCreateApp = React.useCallback(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("compose");
      return next;
    });
  }, [setSearchParams]);

  const loadPortfolio = React.useCallback(async () => {
    setLoading(true);
    setError("");

    if (platformDataMode === "demo") {
      setPortfolio(demoSnapshot.portfolio);
      setLoading(false);
      return;
    }

    try {
      const response = await platformAxios.get(PLATFORM_ENDPOINTS.apps);
      const payload = unwrapApiResponse(response.data, "Failed to load app portfolio");
      const livePortfolio = mergeLivePlatformPortfolio(normalizeAppPortfolio(payload), customApps);
      setPortfolio(livePortfolio.apps.length > 0 ? livePortfolio : demoSnapshot.portfolio);
    } catch (portfolioError) {
      setPortfolio(demoSnapshot.portfolio);
      setError(getApiErrorMessage(portfolioError, "Failed to load app portfolio"));
    } finally {
      setLoading(false);
    }
  }, [customApps, demoSnapshot.portfolio, platformDataMode]);

  React.useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  React.useEffect(() => {
    if (!composeOpen || canManagePortfolio) return;
    closeCreateApp();
    notify("Only platform admins can stage a new planned app.", "info");
  }, [canManagePortfolio, closeCreateApp, composeOpen, notify]);

  React.useEffect(() => {
    if (platformDataMode === "live" && error) {
      notify("The app directory is showing partial data right now.", "info");
    }
  }, [error, notify, platformDataMode]);

  const handleCreateApp = React.useCallback(
    (draft) => {
      if (!canManagePortfolio) {
        notify("Only platform admins can stage a new planned app.", "error");
        return;
      }

      try {
        const created = createCustomApp?.(draft);
        notify(created?.name ? `${created.name} added to the portfolio.` : "App lane added.", "success");
        closeCreateApp();
      } catch (errorMessage) {
        notify(
          errorMessage instanceof Error ? errorMessage.message : "Unable to add app lane.",
          "error",
        );
      }
    },
    [canManagePortfolio, closeCreateApp, createCustomApp, notify],
  );

  const visibleApps = React.useMemo(
    () => portfolio.apps.filter((app) => appMatchesSearch(app, appSearch)),
    [appSearch, portfolio.apps],
  );

  const { live, upcoming } = React.useMemo(
    () => splitAppsByLifecycle(visibleApps),
    [visibleApps],
  );

  const openConsole = React.useCallback(
    (app) => {
      if (!app?.consolePath) return;
      navigate(app.consolePath);
    },
    [navigate],
  );

  return (
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.88fr]">
        <Card className="atlas-stage-card min-h-[240px] p-5 md:p-6">
          <div className="relative z-10 max-w-2xl xl:max-w-[62%]">
            <div className="atlas-signal-chip w-fit">
              <Blocks size={12} />
              App Portfolio
            </div>
            <h1 className="mt-5 font-header text-3xl font-semibold leading-tight text-[var(--atlas-text-strong)] md:text-[2.4rem]">
              Manage live and planned apps across ROOTS.
            </h1>
            <p className="mt-3 text-sm leading-7 text-[var(--atlas-muted)]">
              See what is live, what is planned, and how each app fits into the platform.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {canManagePortfolio ? (
                <Button
                  variant="primary"
                  className="w-full sm:w-auto"
                  onClick={openGlobalCreateApp || openCreateApp}
                >
                  <Plus size={14} />
                  Create planned app
                </Button>
              ) : null}
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={loadPortfolio}
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Refresh portfolio
              </Button>
              <Button
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={() => navigate("/platform")}
              >
                <Rocket size={14} />
                Open hub
              </Button>
            </div>
          </div>

          <div className="pointer-events-none absolute right-8 top-8 hidden h-24 w-24 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl md:block" />
          <div className="pointer-events-none absolute right-16 top-20 hidden h-48 w-48 rounded-full bg-violet-500/20 blur-[56px] md:block" />
          <div className="pointer-events-none absolute bottom-12 right-12 hidden h-32 w-32 rounded-[2rem] rotate-12 bg-gradient-to-br from-fuchsia-400/30 via-violet-400/18 to-indigo-400/28 md:block" />
          <div className="pointer-events-none absolute bottom-10 right-36 hidden h-16 w-16 rounded-full border border-indigo-300/35 bg-indigo-200/10 md:block" />
        </Card>

        <Card className="atlas-stage-card atlas-dot-grid p-5">
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--atlas-muted)]">
                Portfolio Status
              </div>
              <div className="mt-1 font-header text-xl font-semibold text-[var(--atlas-text-strong)]">
                Live and planned
              </div>
            </div>
            <Globe2 size={18} className="shrink-0 text-violet-600 dark:text-fuchsia-300" />
          </div>

          <div className="relative z-10 mt-6 space-y-4">
            <div className="rounded-[1.25rem] border border-indigo-300/40 bg-indigo-50/75 p-4 dark:border-indigo-400/20 dark:bg-indigo-500/10">
              <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-200/80">
                Live
              </div>
              <div className="mt-2 text-3xl font-semibold text-[var(--atlas-text-strong)]">
                {formatNumber(portfolio.liveApps)}
              </div>
              <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                Apps already serving active workspaces.
              </div>
            </div>
            <div className="rounded-[1.25rem] border border-violet-300/40 bg-violet-50/75 p-4 dark:border-fuchsia-400/20 dark:bg-fuchsia-500/10">
              <div className="text-[10px] uppercase tracking-[0.2em] text-violet-700 dark:text-fuchsia-200/80">
                Upcoming
              </div>
              <div className="mt-2 text-3xl font-semibold text-[var(--atlas-text-strong)]">
                {formatNumber(portfolio.plannedApps)}
              </div>
              <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                Planned apps already added to ROOTS.
              </div>
            </div>
          </div>
        </Card>
      </section>

      {error && (
        <div className="rounded-md border border-violet-300/60 bg-violet-50 px-3 py-2 text-sm text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/20 dark:text-violet-100">
          {error}. Showing saved app data while live data catches up.
        </div>
      )}

      {appSearch ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-blue-300/60 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-100">
          <div>
            Showing portfolio matches for <span className="font-semibold">{appSearch}</span>.
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() =>
              setSearchParams((current) => {
                const next = new URLSearchParams(current);
                next.delete("search");
                return next;
              })
            }
          >
            Clear search
          </Button>
        </div>
      ) : null}

      <div className="atlas-platform-metric-grid-compact">
        <PlatformMetricCard
          icon={Blocks}
          label="Apps In Portfolio"
          value={formatNumber(portfolio.totalApps)}
          hint="Registered apps in ROOTS."
          tone="purple"
        />
        <PlatformMetricCard
          icon={Rocket}
          label="Live Apps"
          value={formatNumber(portfolio.liveApps)}
          hint="Apps already serving live workspaces."
          tone="blue"
        />
        <PlatformMetricCard
          icon={Globe2}
          label="Planned Apps"
          value={formatNumber(portfolio.plannedApps)}
          hint="Planned apps already added to ROOTS."
          tone="green"
        />
        <PlatformMetricCard
          icon={Building2}
          label="Total Workspaces"
          value={formatNumber(portfolio.totalWorkspaces)}
          hint={`${formatNumber(portfolio.totalOperators)} operators visible across ROOTS.`}
          tone="blue"
        />
      </div>

      <PortfolioAnalyticsSection
        apps={visibleApps}
        loading={loading}
        title="App hub analytics"
        subtitle="Revenue, usage, and lifecycle charts for the app portfolio."
      />

      <div className="space-y-4">
        <Card className="atlas-data-shell space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
                Live apps
              </h2>
              <p className="mt-1 text-sm text-[var(--atlas-muted)]">
                Apps already serving live workspaces and users.
              </p>
            </div>
            <div className="text-sm text-[var(--atlas-muted)]">
              {formatNumber(live.length)} active portfolio entry{live.length === 1 ? "" : "ies"}
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-4 py-6 text-sm text-[var(--atlas-muted)]">
              Loading live app portfolio...
            </div>
          ) : live.length === 0 ? (
            <div className="space-y-3">
              <EmptyState
                title="No live apps yet"
                message="Create the first live app and it will appear here."
              />
              {canManagePortfolio ? (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={openGlobalCreateApp || openCreateApp}
                  >
                    <Plus size={14} />
                    Create planned app
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {live.map((app) => (
                <AppCard key={app.id} app={app} onOpenConsole={openConsole} />
              ))}
            </div>
          )}
        </Card>

        <Card className="atlas-data-shell space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
                Planned apps
              </h2>
              <p className="mt-1 text-sm text-[var(--atlas-muted)]">
                Apps that are defined but not live yet.
              </p>
            </div>
            <div className="text-sm text-[var(--atlas-muted)]">
              {formatNumber(upcoming.length)} planned app{upcoming.length === 1 ? "" : "s"}
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-4 py-6 text-sm text-[var(--atlas-muted)]">
              Loading planned app lanes...
            </div>
          ) : upcoming.length === 0 ? (
            <div className="space-y-3">
              <EmptyState
                title="No planned apps configured"
                message="Add the next app and it will appear here."
              />
              {canManagePortfolio ? (
                <div className="flex justify-center">
                  <Button variant="outline" onClick={openGlobalCreateApp || openCreateApp}>
                    <Plus size={14} />
                    Create planned app
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {upcoming.map((app) => (
                <AppCard key={app.id} app={app} onOpenConsole={openConsole} />
              ))}
            </div>
          )}
        </Card>
      </div>

      <PlatformAppModal open={composeOpen} onClose={closeCreateApp} onSubmit={handleCreateApp} />
    </div>
  );
}

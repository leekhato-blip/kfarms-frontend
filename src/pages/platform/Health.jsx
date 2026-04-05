import React from "react";
import {
  Activity,
<<<<<<< HEAD
  Radar,
=======
  AlertTriangle,
>>>>>>> 0babf4d (Update frontend application)
  RefreshCw,
  ShieldCheck,
  ShieldX,
  UserCog,
<<<<<<< HEAD
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import Card from "../../components/Card";
import Button from "../../components/Button";
import PlatformMetricCard from "../../components/PlatformMetricCard";
=======
  Users,
} from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
>>>>>>> 0babf4d (Update frontend application)
import { useToast } from "../../components/ToastProvider";
import { PLATFORM_ENDPOINTS } from "../../api/endpoints";
import {
  getApiErrorMessage,
  platformAxios,
  unwrapApiResponse,
} from "../../api/platformClient";
import { formatNumber, normalizePagination } from "../../utils/formatters";
import {
  buildPlanDistribution,
  buildPlatformTimeline,
  buildTenantPressureList,
<<<<<<< HEAD
  filterPlatformUsers,
=======
>>>>>>> 0babf4d (Update frontend application)
  formatPercentLabel,
  resolvePlatformUserEnabled,
  resolvePlatformUserRole,
} from "./platformInsights";
<<<<<<< HEAD
import { buildPlatformDemoSnapshot, buildPlatformLiveSnapshot } from "./platformWorkbench";
=======
>>>>>>> 0babf4d (Update frontend application)

const FALLBACK_OVERVIEW = {
  totalTenants: 0,
  activeTenants: 0,
  suspendedTenants: 0,
  totalUsers: 0,
  platformAdmins: 0,
};

function toneClasses(tone) {
  if (tone === "rose") {
    return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-100";
  }
  if (tone === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100";
  }
  if (tone === "green") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100";
  }
  if (tone === "blue") {
    return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-100";
  }
  return "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-100";
}

function toneDotClass(tone) {
  if (tone === "rose") return "bg-rose-500";
  if (tone === "amber") return "bg-amber-500";
  if (tone === "green") return "bg-emerald-500";
  if (tone === "blue") return "bg-blue-500";
  return "bg-violet-500";
}

<<<<<<< HEAD
function getHealthStatusMeta(score) {
  if (score >= 88) {
    return {
      label: "Stable",
      tone: "green",
      color: "#10b981",
      track: "rgba(16,185,129,0.14)",
    };
  }
  if (score >= 72) {
    return {
      label: "Watch",
      tone: "blue",
      color: "#3b82f6",
      track: "rgba(59,130,246,0.14)",
    };
  }
  if (score >= 56) {
    return {
      label: "Guarded",
      tone: "amber",
      color: "#f59e0b",
      track: "rgba(245,158,11,0.16)",
    };
  }
  return {
    label: "At risk",
    tone: "rose",
    color: "#f43f5e",
    track: "rgba(244,63,94,0.16)",
  };
}

function HealthScoreDial({ score }) {
  const status = getHealthStatusMeta(score);
  const bounded = Math.max(0, Math.min(score, 100));

  return (
    <div
      className="relative grid h-40 w-40 place-items-center rounded-full border border-[color:var(--atlas-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
      style={{
        background: `conic-gradient(${status.color} 0deg ${bounded * 3.6}deg, ${status.track} ${bounded * 3.6}deg 360deg)`,
      }}
    >
      <div className="grid h-[calc(100%-18px)] w-[calc(100%-18px)] place-items-center rounded-full border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="text-center">
          <div className="text-[2.15rem] font-semibold leading-none tracking-[-0.05em] text-[var(--atlas-text-strong)] tabular-nums">
            {bounded}
          </div>
          <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--atlas-muted)]">
            {status.label}
          </div>
        </div>
      </div>
    </div>
=======
function MetricCard({ icon, label, value, hint }) {
  const IconComponent = icon;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
          {label}
        </div>
        <IconComponent size={16} className="text-[var(--atlas-muted)]" />
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-[var(--atlas-text-strong)]">
        {value}
      </div>
      <div className="mt-1 text-xs text-[var(--atlas-muted)]">{hint}</div>
    </Card>
>>>>>>> 0babf4d (Update frontend application)
  );
}

export default function PlatformHealthPage() {
  const { notify } = useToast();
<<<<<<< HEAD
  const {
    customApps = [],
    platformDataMode = "live",
    platformLimitedAccess = false,
  } = useOutletContext() || {};
  const demoSnapshot = React.useMemo(
    () => buildPlatformDemoSnapshot(customApps),
    [customApps],
  );
  const liveSnapshot = React.useMemo(() => buildPlatformLiveSnapshot(), []);
=======
>>>>>>> 0babf4d (Update frontend application)

  const [overview, setOverview] = React.useState(FALLBACK_OVERVIEW);
  const [tenants, setTenants] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const loadSnapshot = React.useCallback(async () => {
    setLoading(true);
    setError("");

<<<<<<< HEAD
    if (platformDataMode === "demo") {
      setOverview(demoSnapshot.metrics);
      setTenants(demoSnapshot.tenants);
      setUsers(filterPlatformUsers(demoSnapshot.users));
      setLoading(false);
      return;
    }

=======
>>>>>>> 0babf4d (Update frontend application)
    try {
      const [overviewResponse, tenantsResponse, usersResponse] = await Promise.all([
        platformAxios.get(PLATFORM_ENDPOINTS.overview),
        platformAxios.get(PLATFORM_ENDPOINTS.tenants, {
          params: { page: 0, size: 100 },
        }),
        platformAxios.get(PLATFORM_ENDPOINTS.users, {
<<<<<<< HEAD
          params: { page: 0, size: 100, platformOnly: true },
=======
          params: { page: 0, size: 100 },
>>>>>>> 0babf4d (Update frontend application)
        }),
      ]);

      const overviewPayload = unwrapApiResponse(
        overviewResponse.data,
        "Failed to load platform overview",
      );
<<<<<<< HEAD
      const tenantPayload = unwrapApiResponse(tenantsResponse.data, "Failed to load tenants");
      const userPayload = unwrapApiResponse(usersResponse.data, "Failed to load users");
      const nextOverview = { ...FALLBACK_OVERVIEW, ...(overviewPayload || {}) };
      const nextTenants = normalizePagination(tenantPayload, { page: 0, size: 100 }).items || [];
      const nextUsers = filterPlatformUsers(
        normalizePagination(userPayload, { page: 0, size: 100 }).items,
      );
      setOverview(nextOverview);
      setTenants(nextTenants);
      setUsers(nextUsers);
    } catch (snapshotError) {
      setOverview(liveSnapshot.metrics);
      setTenants(liveSnapshot.tenants);
      setUsers(filterPlatformUsers(liveSnapshot.users));
      setError(
        platformLimitedAccess
          ? ""
          : getApiErrorMessage(snapshotError, "Failed to load platform health"),
      );
    } finally {
      setLoading(false);
    }
  }, [demoSnapshot, liveSnapshot, platformDataMode, platformLimitedAccess]);
=======
      const tenantPayload = unwrapApiResponse(
        tenantsResponse.data,
        "Failed to load tenants",
      );
      const userPayload = unwrapApiResponse(usersResponse.data, "Failed to load users");

      setOverview({ ...FALLBACK_OVERVIEW, ...(overviewPayload || {}) });
      setTenants(normalizePagination(tenantPayload, { page: 0, size: 100 }).items || []);
      setUsers(normalizePagination(userPayload, { page: 0, size: 100 }).items || []);
    } catch (snapshotError) {
      setOverview(FALLBACK_OVERVIEW);
      setTenants([]);
      setUsers([]);
      setError(getApiErrorMessage(snapshotError, "Failed to load platform health"));
    } finally {
      setLoading(false);
    }
  }, []);
>>>>>>> 0babf4d (Update frontend application)

  React.useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  React.useEffect(() => {
<<<<<<< HEAD
    if (platformDataMode === "live" && error && !platformLimitedAccess) {
      notify("Platform health is showing partial data right now.", "info");
    }
  }, [error, notify, platformDataMode, platformLimitedAccess]);
=======
    if (error) {
      notify("Platform health is showing partial data right now.", "info");
    }
  }, [error, notify]);
>>>>>>> 0babf4d (Update frontend application)

  const enabledUsers = React.useMemo(
    () => users.filter((user) => resolvePlatformUserEnabled(user)).length,
    [users],
  );
  const disabledUsers = users.length - enabledUsers;
  const activeAdmins = React.useMemo(
    () =>
      users.filter(
        (user) =>
          resolvePlatformUserEnabled(user) &&
          resolvePlatformUserRole(user) === "PLATFORM_ADMIN",
      ).length,
    [users],
  );

<<<<<<< HEAD
  const pressureRows = React.useMemo(() => buildTenantPressureList(tenants), [tenants]);
=======
  const pressureRows = React.useMemo(
    () => buildTenantPressureList(tenants),
    [tenants],
  );
>>>>>>> 0babf4d (Update frontend application)

  const pressuredTenants = pressureRows.filter(
    ({ seatUsage }) => seatUsage.nearLimit || seatUsage.overLimit,
  );
  const overLimitTenants = pressureRows.filter(({ seatUsage }) => seatUsage.overLimit);
  const liveSignals = React.useMemo(
    () => buildPlatformTimeline(tenants, users).slice(0, 8),
    [tenants, users],
  );

<<<<<<< HEAD
  const planDistribution = React.useMemo(() => buildPlanDistribution(tenants), [tenants]);
=======
  const planDistribution = React.useMemo(
    () => buildPlanDistribution(tenants),
    [tenants],
  );
>>>>>>> 0babf4d (Update frontend application)

  const healthScore = React.useMemo(() => {
    const penalties =
      overLimitTenants.length * 18 +
      Number(overview.suspendedTenants || 0) * 12 +
      disabledUsers * 6 +
      Math.max(0, 2 - activeAdmins) * 10;

    return Math.max(0, 100 - penalties);
  }, [activeAdmins, disabledUsers, overLimitTenants.length, overview.suspendedTenants]);

<<<<<<< HEAD
  const healthStatus = React.useMemo(() => getHealthStatusMeta(healthScore), [healthScore]);

=======
>>>>>>> 0babf4d (Update frontend application)
  const activeTenantShare = React.useMemo(() => {
    const totalTenants = Number(overview.totalTenants || 0);
    if (!totalTenants) return "0%";
    return formatPercentLabel(Number(overview.activeTenants || 0) / totalTenants, 0);
  }, [overview.activeTenants, overview.totalTenants]);

  const riskRegister = React.useMemo(() => {
    const items = [];

    if (Number(overview.suspendedTenants || 0) > 0) {
      items.push({
        tone: "rose",
<<<<<<< HEAD
        title: "Suspended workspaces",
        detail: `${formatNumber(overview.suspendedTenants)} suspended now.`,
=======
        title: "Suspended workspaces need review",
        detail: `${formatNumber(overview.suspendedTenants)} tenant workspace(s) are suspended.`,
>>>>>>> 0babf4d (Update frontend application)
      });
    }

    if (overLimitTenants.length > 0) {
      items.push({
        tone: "rose",
<<<<<<< HEAD
        title: "Team limits exceeded",
        detail: `${formatNumber(overLimitTenants.length)} over limit.`,
=======
        title: "Seat caps exceeded",
        detail: `${formatNumber(overLimitTenants.length)} tenant(s) are above plan capacity.`,
>>>>>>> 0babf4d (Update frontend application)
      });
    }

    if (pressuredTenants.length > overLimitTenants.length) {
      items.push({
        tone: "amber",
<<<<<<< HEAD
        title: "Team pressure rising",
        detail: `${formatNumber(pressuredTenants.length)} near limit.`,
=======
        title: "Capacity pressure building",
        detail: `${formatNumber(pressuredTenants.length)} tenant(s) are near their seat ceiling.`,
>>>>>>> 0babf4d (Update frontend application)
      });
    }

    if (disabledUsers > 0) {
      items.push({
        tone: "amber",
<<<<<<< HEAD
        title: "Inactive accounts",
        detail: `${formatNumber(disabledUsers)} accounts inactive.`,
=======
        title: "Disabled operator accounts detected",
        detail: `${formatNumber(disabledUsers)} platform account(s) are inactive.`,
>>>>>>> 0babf4d (Update frontend application)
      });
    }

    if (activeAdmins < 2) {
      items.push({
        tone: "amber",
<<<<<<< HEAD
        title: "Thin admin cover",
        detail: `Only ${formatNumber(activeAdmins)} admins active.`,
=======
        title: "Thin admin coverage",
        detail: `Only ${formatNumber(activeAdmins)} enabled platform admin account(s) are active.`,
>>>>>>> 0babf4d (Update frontend application)
      });
    }

    if (items.length === 0) {
      items.push({
        tone: "green",
<<<<<<< HEAD
        title: "Platform looks healthy",
        detail: "No urgent access or capacity risk.",
=======
        title: "Platform posture looks healthy",
        detail: "No immediate seat, suspension, or operator-access risks detected.",
>>>>>>> 0babf4d (Update frontend application)
      });
    }

    return items;
  }, [
    activeAdmins,
    disabledUsers,
    overLimitTenants.length,
    overview.suspendedTenants,
    pressuredTenants.length,
  ]);

  return (
    <div className="space-y-4">
<<<<<<< HEAD
      <section className="grid gap-4 xl:grid-cols-[1.36fr_0.9fr]">
        <Card className="atlas-stage-card min-h-[250px] p-5 md:p-6">
          <div className="relative z-10 max-w-2xl">
            <div className="atlas-signal-chip w-fit">
              <Activity size={12} />
              ROOTS Health
            </div>
            <h1 className="mt-5 font-header text-3xl font-semibold leading-tight text-[var(--atlas-text-strong)] md:text-[2.4rem]">
              ROOTS system health.
            </h1>
            <div className="mt-3 text-sm leading-7 text-[var(--atlas-muted)]">
              Track uptime, load, and workspace risk.
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {riskRegister.slice(0, 3).map((item) => (
                <span
                  key={item.title}
                  className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${toneClasses(item.tone)}`}
                >
                  {item.title}
                </span>
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute right-8 top-8 hidden h-28 w-28 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl md:block" />
          <div className="pointer-events-none absolute right-12 top-20 hidden h-52 w-52 rounded-full bg-blue-500/16 blur-[64px] md:block" />
          <div className="pointer-events-none absolute bottom-10 right-28 hidden h-20 w-20 rounded-[1.75rem] rotate-12 bg-gradient-to-br from-cyan-300/30 via-blue-400/18 to-indigo-400/24 md:block" />
        </Card>

        <Card className="atlas-stage-card atlas-dot-grid p-5">
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--atlas-muted)]">
                System Pulse
              </div>
              <div className="mt-1 font-header text-xl font-semibold text-[var(--atlas-text-strong)]">
                Live readiness
              </div>
            </div>
            <span className={`atlas-premium-badge ${toneClasses(healthStatus.tone)}`}>
              {healthStatus.label}
            </span>
          </div>

          <div className="relative z-10 mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
            <HealthScoreDial score={healthScore} />

            <div className="grid flex-1 gap-3">
              <div className="rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                  Pressured tenants
                </div>
                <div className="mt-2 text-2xl font-semibold leading-none text-[var(--atlas-text-strong)]">
                  {formatNumber(pressuredTenants.length)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                    Suspended
                  </div>
                  <div className="mt-2 text-xl font-semibold leading-none text-[var(--atlas-text-strong)]">
                    {formatNumber(overview.suspendedTenants || 0)}
                  </div>
                </div>
                <div className="rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                    Admins live
                  </div>
                  <div className="mt-2 text-xl font-semibold leading-none text-[var(--atlas-text-strong)]">
                    {formatNumber(activeAdmins)}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={loadSnapshot}
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Refresh
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {error ? (
        <div className="rounded-md border border-violet-300/60 bg-violet-50 px-3 py-2 text-sm text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/20 dark:text-violet-100">
          {error}
        </div>
      ) : null}

      <div className="atlas-platform-metric-grid-compact">
        <PlatformMetricCard
          icon={ShieldCheck}
          label="Health Score"
          value={`${healthScore}/100`}
          hint="Capacity, suspension, and access score."
          tone="green"
        />
        <PlatformMetricCard
          icon={Radar}
          label="Active Workspace Share"
          value={activeTenantShare}
          hint={`${formatNumber(overview.activeTenants || 0)} of ${formatNumber(overview.totalTenants || 0)} workspaces live.`}
          tone="blue"
        />
        <PlatformMetricCard
          icon={ShieldX}
          label="Disabled Operators"
          value={formatNumber(disabledUsers)}
          hint="Accounts blocked from sign-in."
          tone="purple"
        />
        <PlatformMetricCard
          icon={UserCog}
          label="ROOTS Admins"
          value={formatNumber(activeAdmins)}
          hint="Enabled admin coverage."
          tone="green"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.32fr)_minmax(360px,0.96fr)]">
        <div className="space-y-4">
          <Card className="atlas-data-shell space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
                  Risk Register
                </h2>
                <p className="mt-1 text-sm text-[var(--atlas-muted)]">
                  The top signals right now.
                </p>
              </div>
              <span className="rounded-full border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--atlas-muted)]">
                {formatNumber(riskRegister.length)} signal{riskRegister.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {riskRegister.map((item) => (
                <div
                  key={item.title}
                  className={`rounded-[1.2rem] border px-4 py-4 ${toneClasses(item.tone)}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 h-2.5 w-2.5 rounded-full ${toneDotClass(item.tone)}`} />
                    <div>
                      <div className="text-sm font-semibold">{item.title}</div>
                      <div className="mt-1 text-xs leading-6 opacity-90">{item.detail}</div>
                    </div>
                  </div>
=======
      <Card className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-emerald-500/15 via-blue-500/10 to-violet-500/10 p-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
              Platform Health
            </div>
            <div className="mt-1 text-sm text-[var(--atlas-text-strong)]">
              Live posture across tenant capacity, operator access, and workspace pressure.
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadSnapshot} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </Card>

      {error && (
        <div className="rounded-md border border-violet-300/60 bg-violet-50 px-3 py-2 text-sm text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/20 dark:text-violet-100">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ShieldCheck}
          label="Health Score"
          value={`${healthScore}/100`}
          hint="A blended score of capacity, suspensions, and access coverage."
        />
        <MetricCard
          icon={Activity}
          label="Active Workspace Share"
          value={activeTenantShare}
          hint={`${formatNumber(overview.activeTenants || 0)} of ${formatNumber(overview.totalTenants || 0)} tenants are active.`}
        />
        <MetricCard
          icon={ShieldX}
          label="Disabled Operators"
          value={formatNumber(disabledUsers)}
          hint="Platform accounts currently unable to sign in."
        />
        <MetricCard
          icon={UserCog}
          label="Active Platform Admins"
          value={formatNumber(activeAdmins)}
          hint="Enabled admin coverage for the control plane."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_380px]">
        <div className="space-y-4">
          <Card className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
                Risk Register
              </h2>
              <p className="mt-1 text-sm text-[var(--atlas-muted)]">
                Prioritized issues that could weaken tenant isolation or operator coverage.
              </p>
            </div>

            <div className="space-y-3">
              {riskRegister.map((item) => (
                <div
                  key={item.title}
                  className={`rounded-xl border px-3 py-3 ${toneClasses(item.tone)}`}
                >
                  <div className="text-sm font-semibold">{item.title}</div>
                  <div className="mt-1 text-xs opacity-90">{item.detail}</div>
>>>>>>> 0babf4d (Update frontend application)
                </div>
              ))}
            </div>
          </Card>

<<<<<<< HEAD
          <Card className="atlas-data-shell space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
                  Team Limit Watch
                </h2>
                <p className="mt-1 text-sm text-[var(--atlas-muted)]">
                  Team limit usage by tenant plan and workspace activity.
                </p>
              </div>
              <span className="rounded-full border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--atlas-muted)]">
                {formatNumber(pressuredTenants.length)} at risk
              </span>
=======
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
                  Tenant Capacity Watch
                </h2>
                <p className="mt-1 text-sm text-[var(--atlas-muted)]">
                  Seat guardrails by tenant plan so overages do not hide inside the system.
                </p>
              </div>
              <div className="rounded-full bg-[color:var(--atlas-surface-soft)] px-3 py-1 text-xs font-semibold text-[var(--atlas-text-strong)]">
                {formatNumber(pressuredTenants.length)} at risk
              </div>
>>>>>>> 0babf4d (Update frontend application)
            </div>

            {pressureRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[color:var(--atlas-border-strong)] px-3 py-5 text-center text-sm text-[var(--atlas-muted)]">
<<<<<<< HEAD
                No tenants with finite team limits have been loaded yet.
=======
                No tenants with finite seat limits have been loaded yet.
>>>>>>> 0babf4d (Update frontend application)
              </div>
            ) : (
              <div className="space-y-3">
                {pressureRows.slice(0, 6).map(({ tenant, seatUsage }) => (
                  <div
                    key={`pressure-${tenant.id}`}
<<<<<<< HEAD
                    className="rounded-[1.2rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/70 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                          {tenant.name || tenant.slug}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">
                          {tenant.ownerEmail || "Owner email unavailable"} · Team limit {seatUsage.label}
                        </div>
                      </div>
                      <span
=======
                    className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                          {tenant.name || tenant.slug}
                        </div>
                        <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                          {tenant.ownerEmail || "Owner email unavailable"} · {seatUsage.label} seats
                        </div>
                      </div>
                      <div
>>>>>>> 0babf4d (Update frontend application)
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          seatUsage.overLimit
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200"
                            : seatUsage.nearLimit
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                        }`}
                      >
                        {seatUsage.overLimit
                          ? "Over limit"
                          : seatUsage.nearLimit
                            ? "Near limit"
                            : "Healthy"}
<<<<<<< HEAD
                      </span>
                    </div>

                    <div className="mt-4 h-2 rounded-full bg-[color:var(--atlas-border)]/70">
=======
                      </div>
                    </div>

                    <div className="mt-3 h-2 rounded-full bg-[color:var(--atlas-border)]">
>>>>>>> 0babf4d (Update frontend application)
                      <div
                        className={`h-2 rounded-full ${
                          seatUsage.overLimit
                            ? "bg-rose-500"
                            : seatUsage.nearLimit
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${Math.min(seatUsage.usageRatio, 1) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-[var(--atlas-muted)]">
<<<<<<< HEAD
                      {formatPercentLabel(seatUsage.usageRatio, 0)} of team limit used.
=======
                      {formatPercentLabel(seatUsage.usageRatio, 0)} of plan capacity used.
>>>>>>> 0babf4d (Update frontend application)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
<<<<<<< HEAD
          <Card className="atlas-data-shell space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
                  Signal Stream
                </h2>
                <p className="mt-1 text-sm text-[var(--atlas-muted)]">
                  The most recent tenant and operator changes across ROOTS.
                </p>
              </div>
              <span className="rounded-full border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--atlas-muted)]">
                {formatNumber(liveSignals.length)} recent
              </span>
=======
          <Card className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
                Live Signals
              </h2>
              <p className="mt-1 text-sm text-[var(--atlas-muted)]">
                Recent tenant and operator changes visible from the control plane.
              </p>
>>>>>>> 0babf4d (Update frontend application)
            </div>

            <div className="space-y-3">
              {liveSignals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[color:var(--atlas-border-strong)] px-3 py-5 text-center text-sm text-[var(--atlas-muted)]">
                  No recent health signals yet.
                </div>
              ) : (
                liveSignals.map((signal) => (
                  <div
                    key={signal.id}
<<<<<<< HEAD
                    className="rounded-[1.2rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/70 px-4 py-4"
=======
                    className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 py-3"
>>>>>>> 0babf4d (Update frontend application)
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${toneDotClass(signal.tone)}`} />
                      <div className="min-w-0 flex-1">
<<<<<<< HEAD
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
=======
                        <div className="text-xs uppercase tracking-[0.14em] text-[var(--atlas-muted)]">
>>>>>>> 0babf4d (Update frontend application)
                          {signal.category}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-[var(--atlas-text-strong)]">
                          {signal.title}
                        </div>
                        <div className="mt-1 text-sm text-[var(--atlas-text)]">
                          {signal.subject}
                        </div>
<<<<<<< HEAD
                        <div className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">
=======
                        <div className="mt-1 text-xs text-[var(--atlas-muted)]">
>>>>>>> 0babf4d (Update frontend application)
                          {signal.detail}
                        </div>
                      </div>
                      <div className="text-xs text-[var(--atlas-muted)]">
                        {signal.relativeTime}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

<<<<<<< HEAD
          <Card className="atlas-data-shell space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
                  Plan Mix
                </h2>
                <p className="mt-1 text-sm text-[var(--atlas-muted)]">
                  Distribution of workspaces by commercial tier.
                </p>
              </div>
              <span className="rounded-full border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--atlas-muted)]">
                {formatNumber(tenants.length)} workspaces
              </span>
            </div>

            <div className="space-y-4">
=======
          <Card className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
                Plan Mix
              </h2>
              <p className="mt-1 text-sm text-[var(--atlas-muted)]">
                Distribution of tenants by commercial tier.
              </p>
            </div>

            <div className="space-y-3">
>>>>>>> 0babf4d (Update frontend application)
              {planDistribution.map((planItem) => {
                const ratio =
                  tenants.length > 0 ? planItem.count / Math.max(tenants.length, 1) : 0;

                return (
                  <div key={planItem.id}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-[var(--atlas-text-strong)]">
                        {planItem.label}
                      </span>
                      <span className="text-[var(--atlas-muted)]">
                        {formatNumber(planItem.count)} tenant(s)
                      </span>
                    </div>
<<<<<<< HEAD
                    <div className="mt-2 h-2 rounded-full bg-[color:var(--atlas-border)]/70">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500"
=======
                    <div className="mt-2 h-2 rounded-full bg-[color:var(--atlas-border)]">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500"
>>>>>>> 0babf4d (Update frontend application)
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

<<<<<<< HEAD
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                  Enabled operators
                </div>
                <div className="mt-2 text-2xl font-semibold leading-none text-[var(--atlas-text-strong)]">
                  {formatNumber(enabledUsers)}
                </div>
                <div className="mt-2 text-xs text-[var(--atlas-muted)]">
                  Enabled out of {formatNumber(users.length)} ROOTS users.
                </div>
              </div>

              <div className="rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                  Active tenants
                </div>
                <div className="mt-2 text-2xl font-semibold leading-none text-[var(--atlas-text-strong)]">
                  {formatNumber(overview.activeTenants || 0)}
                </div>
                <div className="mt-2 text-xs text-[var(--atlas-muted)]">
                  {formatNumber(overview.totalTenants || 0)} total workspaces visible.
                </div>
=======
            <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] p-3 text-sm text-[var(--atlas-muted)]">
              <div className="font-semibold text-[var(--atlas-text-strong)]">
                Enabled operators
              </div>
              <div className="mt-1">
                {formatNumber(enabledUsers)} enabled out of {formatNumber(users.length)} total platform users.
>>>>>>> 0babf4d (Update frontend application)
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import {
  Activity,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  UserCog,
  Users,
} from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
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
  formatPercentLabel,
  resolvePlatformUserEnabled,
  resolvePlatformUserRole,
} from "./platformInsights";

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
  );
}

export default function PlatformHealthPage() {
  const { notify } = useToast();

  const [overview, setOverview] = React.useState(FALLBACK_OVERVIEW);
  const [tenants, setTenants] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const loadSnapshot = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [overviewResponse, tenantsResponse, usersResponse] = await Promise.all([
        platformAxios.get(PLATFORM_ENDPOINTS.overview),
        platformAxios.get(PLATFORM_ENDPOINTS.tenants, {
          params: { page: 0, size: 100 },
        }),
        platformAxios.get(PLATFORM_ENDPOINTS.users, {
          params: { page: 0, size: 100 },
        }),
      ]);

      const overviewPayload = unwrapApiResponse(
        overviewResponse.data,
        "Failed to load platform overview",
      );
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

  React.useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  React.useEffect(() => {
    if (error) {
      notify("Platform health is showing partial data right now.", "info");
    }
  }, [error, notify]);

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

  const pressureRows = React.useMemo(
    () => buildTenantPressureList(tenants),
    [tenants],
  );

  const pressuredTenants = pressureRows.filter(
    ({ seatUsage }) => seatUsage.nearLimit || seatUsage.overLimit,
  );
  const overLimitTenants = pressureRows.filter(({ seatUsage }) => seatUsage.overLimit);
  const liveSignals = React.useMemo(
    () => buildPlatformTimeline(tenants, users).slice(0, 8),
    [tenants, users],
  );

  const planDistribution = React.useMemo(
    () => buildPlanDistribution(tenants),
    [tenants],
  );

  const healthScore = React.useMemo(() => {
    const penalties =
      overLimitTenants.length * 18 +
      Number(overview.suspendedTenants || 0) * 12 +
      disabledUsers * 6 +
      Math.max(0, 2 - activeAdmins) * 10;

    return Math.max(0, 100 - penalties);
  }, [activeAdmins, disabledUsers, overLimitTenants.length, overview.suspendedTenants]);

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
        title: "Suspended workspaces need review",
        detail: `${formatNumber(overview.suspendedTenants)} tenant workspace(s) are suspended.`,
      });
    }

    if (overLimitTenants.length > 0) {
      items.push({
        tone: "rose",
        title: "Seat caps exceeded",
        detail: `${formatNumber(overLimitTenants.length)} tenant(s) are above plan capacity.`,
      });
    }

    if (pressuredTenants.length > overLimitTenants.length) {
      items.push({
        tone: "amber",
        title: "Capacity pressure building",
        detail: `${formatNumber(pressuredTenants.length)} tenant(s) are near their seat ceiling.`,
      });
    }

    if (disabledUsers > 0) {
      items.push({
        tone: "amber",
        title: "Disabled operator accounts detected",
        detail: `${formatNumber(disabledUsers)} platform account(s) are inactive.`,
      });
    }

    if (activeAdmins < 2) {
      items.push({
        tone: "amber",
        title: "Thin admin coverage",
        detail: `Only ${formatNumber(activeAdmins)} enabled platform admin account(s) are active.`,
      });
    }

    if (items.length === 0) {
      items.push({
        tone: "green",
        title: "Platform posture looks healthy",
        detail: "No immediate seat, suspension, or operator-access risks detected.",
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
                </div>
              ))}
            </div>
          </Card>

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
            </div>

            {pressureRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[color:var(--atlas-border-strong)] px-3 py-5 text-center text-sm text-[var(--atlas-muted)]">
                No tenants with finite seat limits have been loaded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {pressureRows.slice(0, 6).map(({ tenant, seatUsage }) => (
                  <div
                    key={`pressure-${tenant.id}`}
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
                      </div>
                    </div>

                    <div className="mt-3 h-2 rounded-full bg-[color:var(--atlas-border)]">
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
                      {formatPercentLabel(seatUsage.usageRatio, 0)} of plan capacity used.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
                Live Signals
              </h2>
              <p className="mt-1 text-sm text-[var(--atlas-muted)]">
                Recent tenant and operator changes visible from the control plane.
              </p>
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
                    className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${toneDotClass(signal.tone)}`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs uppercase tracking-[0.14em] text-[var(--atlas-muted)]">
                          {signal.category}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-[var(--atlas-text-strong)]">
                          {signal.title}
                        </div>
                        <div className="mt-1 text-sm text-[var(--atlas-text)]">
                          {signal.subject}
                        </div>
                        <div className="mt-1 text-xs text-[var(--atlas-muted)]">
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
                    <div className="mt-2 h-2 rounded-full bg-[color:var(--atlas-border)]">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500"
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] p-3 text-sm text-[var(--atlas-muted)]">
              <div className="font-semibold text-[var(--atlas-text-strong)]">
                Enabled operators
              </div>
              <div className="mt-1">
                {formatNumber(enabledUsers)} enabled out of {formatNumber(users.length)} total platform users.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

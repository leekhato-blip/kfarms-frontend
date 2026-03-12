import React from "react";
import { AlertCircle, BellRing, Radar, RefreshCw, ShieldCheck, Users } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { MetricCardSkeleton } from "../../components/Skeleton";
import { useToast } from "../../components/ToastProvider";
import { getApiErrorMessage, platformAxios, unwrapApiResponse } from "../../api/platformClient";
import { PLATFORM_ENDPOINTS } from "../../api/endpoints";
import { formatDateTime, formatNumber, normalizePagination } from "../../utils/formatters";
import { normalizePlanId } from "../../constants/plans";

const FALLBACK = {
  totalTenants: 0,
  activeTenants: 0,
  suspendedTenants: 0,
  totalUsers: 0,
  platformAdmins: 0,
};

const METRIC_CONFIG = [
  {
    key: "totalTenants",
    label: "Total Tenants",
    tone: "violet",
    bars: [18, 24, 38, 48, 34, 56, 28],
  },
  {
    key: "activeTenants",
    label: "Active Tenants",
    tone: "blue",
    bars: [12, 22, 20, 36, 52, 34, 44],
  },
  {
    key: "suspendedTenants",
    label: "Suspended Tenants",
    tone: "violet",
    bars: [10, 14, 24, 18, 26, 16, 22],
  },
  {
    key: "totalUsers",
    label: "Total Users",
    tone: "green",
    bars: [8, 18, 34, 30, 46, 40, 58],
  },
  {
    key: "platformAdmins",
    label: "Platform Admins",
    tone: "green",
    bars: [8, 10, 16, 20, 28, 32, 38],
  },
];

function toneGlowClass(tone) {
  if (tone === "blue") {
    return "shadow-[0_0_0_1px_rgba(96,165,250,0.45),0_0_28px_rgba(37,99,235,0.2)]";
  }
  if (tone === "green") {
    return "shadow-[0_0_0_1px_rgba(110,231,183,0.45),0_0_28px_rgba(16,185,129,0.2)]";
  }
  return "shadow-[0_0_0_1px_rgba(167,139,250,0.45),0_0_28px_rgba(139,92,246,0.2)]";
}

function toneDotClass(tone) {
  if (tone === "blue") return "bg-blue-400";
  if (tone === "green") return "bg-emerald-400";
  if (tone === "rose") return "bg-rose-400";
  return "bg-violet-400";
}

function planBadgeTone(plan) {
  const normalized = normalizePlanId(plan, "FREE");
  if (normalized === "ENTERPRISE") return "green";
  if (normalized === "PRO") return "blue";
  return "blue";
}

function statusBadgeTone(status) {
  if (String(status || "").toUpperCase() === "ACTIVE") return "green";
  return "rose";
}

function resolveUserEnabled(user) {
  if (typeof user?.enabled === "boolean") return user.enabled;
  if (typeof user?.active === "boolean") return user.active;
  return true;
}

function userStatusTone(enabled) {
  return enabled ? "green" : "rose";
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
    const username = user?.username || user?.email || "User";
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
        text: `Platform admin active: ${username}`,
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

function SummaryCard({ label, value, tone, bars }) {
  const barGradientMap = {
    violet: "from-violet-400/20 via-violet-300/40 to-fuchsia-300/60",
    blue: "from-blue-400/20 via-cyan-300/40 to-blue-200/60",
    green: "from-emerald-400/20 via-emerald-300/40 to-cyan-300/60",
  };

  return (
    <Card interactive className={`relative overflow-hidden p-4 ${toneGlowClass(tone)}`}>
      <div className="text-xs font-medium text-[var(--atlas-text)] sm:text-sm">{label}</div>
      <div className="mt-2 text-4xl font-bold leading-none tracking-tight text-[var(--atlas-text-strong)] sm:text-[44px]">
        {formatNumber(value)}
      </div>
      <div className="mt-3 flex h-8 items-end gap-1 sm:h-9">
        {bars.map((height, idx) => (
          <div
            key={`${label}-${idx}`}
            className={`w-full rounded-sm bg-gradient-to-t ${barGradientMap[tone] || barGradientMap.violet}`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </Card>
  );
}

export default function PlatformDashboardPage() {
  const { notify } = useToast();

  const [metrics, setMetrics] = React.useState(FALLBACK);
  const [overviewLoading, setOverviewLoading] = React.useState(true);
  const [overviewError, setOverviewError] = React.useState("");

  const [recentTenants, setRecentTenants] = React.useState([]);
  const [tenantsLoading, setTenantsLoading] = React.useState(true);
  const [tenantsError, setTenantsError] = React.useState("");

  const [recentUsers, setRecentUsers] = React.useState([]);
  const [usersLoading, setUsersLoading] = React.useState(true);
  const [usersError, setUsersError] = React.useState("");

  const loadOverview = React.useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError("");

    try {
      const response = await platformAxios.get(PLATFORM_ENDPOINTS.overview);
      const data = unwrapApiResponse(response.data, "Failed to load platform overview");
      setMetrics({ ...FALLBACK, ...(data || {}) });
    } catch (error) {
      setMetrics(FALLBACK);
      setOverviewError(getApiErrorMessage(error, "Overview unavailable"));
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const loadRecentTenants = React.useCallback(async () => {
    setTenantsLoading(true);
    setTenantsError("");

    try {
      const response = await platformAxios.get(PLATFORM_ENDPOINTS.tenants, {
        params: { page: 0, size: 5 },
      });
      const payload = unwrapApiResponse(response.data, "Failed to load tenants");
      const normalized = normalizePagination(payload, { page: 0, size: 5 });
      setRecentTenants(normalized.items || []);
    } catch (error) {
      setRecentTenants([]);
      setTenantsError(getApiErrorMessage(error, "Failed to load tenants"));
    } finally {
      setTenantsLoading(false);
    }
  }, []);

  const loadRecentUsers = React.useCallback(async () => {
    setUsersLoading(true);
    setUsersError("");

    try {
      const response = await platformAxios.get(PLATFORM_ENDPOINTS.users, {
        params: { page: 0, size: 5 },
      });
      const payload = unwrapApiResponse(response.data, "Failed to load users");
      const normalized = normalizePagination(payload, { page: 0, size: 5 });
      setRecentUsers(normalized.items || []);
    } catch (error) {
      setRecentUsers([]);
      setUsersError(getApiErrorMessage(error, "Failed to load users"));
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadAll = React.useCallback(async () => {
    await Promise.all([loadOverview(), loadRecentTenants(), loadRecentUsers()]);
  }, [loadOverview, loadRecentTenants, loadRecentUsers]);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  const signals = React.useMemo(() => buildSignals(recentTenants, recentUsers), [recentTenants, recentUsers]);

  React.useEffect(() => {
    if (overviewError || tenantsError || usersError) {
      notify("Some dashboard sections are unavailable. Showing partial live data.", "info");
    }
  }, [notify, overviewError, tenantsError, usersError]);

  return (
    <div className="space-y-5">
      {(overviewError || tenantsError || usersError) && (
        <Card className="border-violet-300/60 bg-violet-50 dark:border-violet-300/30 dark:bg-violet-500/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-violet-800 dark:text-violet-100">
              <AlertCircle size={14} className="text-violet-600 dark:text-violet-200" />
              <span>
                {overviewError && `Metrics: ${overviewError}`}
                {overviewError && (tenantsError || usersError) ? " | " : ""}
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

      <Card className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gradient-to-r from-violet-500/20 via-blue-500/10 to-emerald-500/10 px-3 py-2">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">Executive Snapshot</div>
            <div className="mt-1 text-sm text-[var(--atlas-text-strong)]">Realtime pulse across tenants, operators, and system health.</div>
          </div>
          <Button variant="outline" size="sm" onClick={loadAll}>
            <RefreshCw size={14} />
            Refresh
          </Button>
        </div>
      </Card>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        {overviewLoading
          ? Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className={idx === 4 ? "col-span-2 xl:col-span-1" : ""}>
                <MetricCardSkeleton />
              </div>
            ))
          : METRIC_CONFIG.map((card, idx) => (
              <div key={card.key} className={idx === 4 ? "col-span-2 xl:col-span-1" : ""}>
                <SummaryCard
                  label={card.label}
                  tone={card.tone}
                  bars={card.bars}
                  value={metrics[card.key]}
                />
              </div>
            ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.5fr]">
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-[color:var(--atlas-border)] px-4 py-3">
            <div className="flex items-center gap-2 text-[var(--atlas-text-strong)]">
              <Radar size={16} className="text-blue-300" />
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
                No recent platform activity available.
              </div>
            )}

            {!tenantsLoading && !usersLoading &&
              signals.map((signal) => (
                <div
                  key={signal.id}
                  className="rounded-lg border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 py-2"
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

        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-[color:var(--atlas-border)] px-4 py-3">
            <h3 className="text-xl font-semibold text-[var(--atlas-text-strong)]">Tenants Overview</h3>
            <Button variant="outline" size="sm" onClick={loadRecentTenants}>
              <RefreshCw size={14} />
              Retry
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-[color:var(--atlas-border)] text-left text-xs uppercase tracking-[0.12em] text-[var(--atlas-muted)]">
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
                      <td colSpan={6} className="px-4 py-4 text-[var(--atlas-muted)]">Loading tenants...</td>
                    </tr>
                  ))}

                {!tenantsLoading && recentTenants.length === 0 && (
                  <tr className="border-b border-[color:var(--atlas-border)] last:border-b-0">
                    <td colSpan={6} className="px-4 py-4 text-[var(--atlas-muted)]">
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
                        <td className="px-4 py-3 font-semibold text-[var(--atlas-text-strong)]">{row?.name || "-"}</td>
                        <td className="px-4 py-3">
                          <span className="atlas-premium-badge" data-tone={planBadgeTone(row?.plan)}>
                            {normalizePlanId(row?.plan, "FREE")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="atlas-premium-badge" data-tone={statusBadgeTone(row?.status)}>
                            {String(row?.status || "ACTIVE").toUpperCase()}
                          </span>
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
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-[color:var(--atlas-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[var(--atlas-muted)]" />
              <h3 className="text-xl font-semibold text-[var(--atlas-text-strong)]">Platform Users</h3>
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
                    const role = String(user?.role || "USER").toUpperCase();
                    const enabled = resolveUserEnabled(user);

                    return (
                      <tr key={userId} className="atlas-premium-row border-b border-[color:var(--atlas-border)] last:border-b-0">
                        <td className="px-4 py-3 font-semibold text-[var(--atlas-text-strong)]">{user?.username || "-"}</td>
                        <td className="px-4 py-3 text-[var(--atlas-text)]">{user?.email || "-"}</td>
                        <td className="px-4 py-3 text-[var(--atlas-text)]">{role}</td>
                        <td className="px-4 py-3">
                          <span className="atlas-premium-badge" data-tone={userStatusTone(enabled)}>
                            {enabled ? "ENABLED" : "DISABLED"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end border-t border-[color:var(--atlas-border)] px-4 py-3 text-xs uppercase tracking-[0.14em] text-[var(--atlas-muted)]">
            <ShieldCheck size={13} className="mr-2 text-emerald-300" />
            Access Matrix
          </div>
        </Card>
      </section>
    </div>
  );
}

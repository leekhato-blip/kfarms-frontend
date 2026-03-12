import React from "react";
import {
  Globe2,
  LockKeyhole,
  RefreshCw,
  Shield,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
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
  CURRENCY_OPTIONS,
  DEFAULT_ORGANIZATION_SETTINGS,
  DEFAULT_USER_PREFERENCES,
  LANDING_PAGE_OPTIONS,
  THEME_OPTIONS,
  TIMEZONE_OPTIONS,
} from "../../constants/settings";
import { PLAN_FEATURE_MATRIX, PLAN_TIER_CONFIG } from "../../constants/plans";
import {
  buildPlanDistribution,
  buildTenantPressureList,
  getTenantMemberLimit,
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

function findLabel(options, value, fallback = value) {
  return options.find((option) => option.value === value)?.label || fallback;
}

function SummaryTile({ icon, label, value, hint }) {
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

export default function PlatformSettingsPage() {
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
      setError(getApiErrorMessage(snapshotError, "Failed to load platform settings"));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  React.useEffect(() => {
    if (error) {
      notify("Platform settings are showing partial data right now.", "info");
    }
  }, [error, notify]);

  const enabledUsers = React.useMemo(
    () => users.filter((user) => resolvePlatformUserEnabled(user)).length,
    [users],
  );
  const activeAdmins = React.useMemo(
    () =>
      users.filter(
        (user) =>
          resolvePlatformUserEnabled(user) &&
          resolvePlatformUserRole(user) === "PLATFORM_ADMIN",
      ).length,
    [users],
  );

  const pressureCount = React.useMemo(
    () =>
      buildTenantPressureList(tenants).filter(
        ({ seatUsage }) => seatUsage.nearLimit || seatUsage.overLimit,
      ).length,
    [tenants],
  );

  const planDistribution = React.useMemo(
    () => buildPlanDistribution(tenants),
    [tenants],
  );

  const timezoneLabel = findLabel(
    TIMEZONE_OPTIONS,
    DEFAULT_ORGANIZATION_SETTINGS.timezone,
    DEFAULT_ORGANIZATION_SETTINGS.timezone,
  );
  const currencyLabel = findLabel(
    CURRENCY_OPTIONS,
    DEFAULT_ORGANIZATION_SETTINGS.currency,
    DEFAULT_ORGANIZATION_SETTINGS.currency,
  );
  const landingPageLabel = findLabel(
    LANDING_PAGE_OPTIONS,
    DEFAULT_USER_PREFERENCES.landingPage,
    DEFAULT_USER_PREFERENCES.landingPage,
  );
  const themeLabel = findLabel(
    THEME_OPTIONS,
    DEFAULT_USER_PREFERENCES.themePreference,
    DEFAULT_USER_PREFERENCES.themePreference,
  );

  const planCards = React.useMemo(
    () =>
      PLAN_TIER_CONFIG.map((plan) => {
        const tenantCount = tenants.filter((tenant) => String(tenant?.plan || "").toUpperCase() === plan.id).length;
        const activeCount = tenants.filter(
          (tenant) =>
            String(tenant?.plan || "").toUpperCase() === plan.id &&
            String(tenant?.status || "").toUpperCase() === "ACTIVE",
        ).length;
        const featureRows = PLAN_FEATURE_MATRIX.filter((feature) => feature.minPlan === plan.id).slice(
          0,
          plan.id === "ENTERPRISE" ? 6 : 4,
        );

        return {
          ...plan,
          tenantCount,
          activeCount,
          memberLimit: getTenantMemberLimit(plan.id),
          featureRows,
        };
      }),
    [tenants],
  );

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-blue-500/15 via-violet-500/10 to-emerald-500/10 p-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
              Platform Settings
            </div>
            <div className="mt-1 text-sm text-[var(--atlas-text-strong)]">
              Live policy defaults, commercial guardrails, and access boundaries for the control plane.
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
        <SummaryTile
          icon={Shield}
          label="Active Admin Coverage"
          value={formatNumber(activeAdmins)}
          hint="Enabled platform administrators protecting the control plane."
        />
        <SummaryTile
          icon={Users}
          label="Enabled Users"
          value={formatNumber(enabledUsers)}
          hint={`${formatNumber(overview.totalUsers || 0)} total platform users loaded.`}
        />
        <SummaryTile
          icon={Globe2}
          label="Default Workspace Locale"
          value={DEFAULT_ORGANIZATION_SETTINGS.currency}
          hint={`${timezoneLabel} · ${currencyLabel}`}
        />
        <SummaryTile
          icon={LockKeyhole}
          label="Seat Guardrails"
          value={formatNumber(pressureCount)}
          hint="Tenants currently near or above their seat cap."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_380px]">
        <div className="space-y-4">
          <Card className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
                Plan Enforcement
              </h2>
              <p className="mt-1 text-sm text-[var(--atlas-muted)]">
                Current commercial tiers, seat ceilings, and the features unlocked at each level.
              </p>
            </div>

            <div className="space-y-3">
              {planCards.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge kind="plan" value={plan.id} />
                        <span className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                          {plan.name}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[var(--atlas-muted)]">{plan.tagline}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                        {formatNumber(plan.tenantCount)} tenant(s)
                      </div>
                      <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                        {formatNumber(plan.activeCount)} active
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-strong)] px-3 py-3">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                        Seat limit
                      </div>
                      <div className="mt-2 text-lg font-semibold text-[var(--atlas-text-strong)]">
                        {plan.memberLimit ?? "Unlimited"}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-strong)] px-3 py-3">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                        Organizations
                      </div>
                      <div className="mt-2 text-lg font-semibold text-[var(--atlas-text-strong)]">
                        {plan.limits.find((limit) => limit.label === "Organizations")?.value || "-"}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-strong)] px-3 py-3">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                        Pricing
                      </div>
                      <div className="mt-2 text-lg font-semibold text-[var(--atlas-text-strong)]">
                        {plan.priceLabel}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                        Highlights
                      </div>
                      <div className="mt-2 space-y-2">
                        {plan.highlights.slice(0, 3).map((highlight) => (
                          <div
                            key={highlight}
                            className="rounded-lg border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-strong)] px-3 py-2 text-sm text-[var(--atlas-text)]"
                          >
                            {highlight}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                        Features introduced here
                      </div>
                      <div className="mt-2 space-y-2">
                        {plan.featureRows.map((feature) => (
                          <div
                            key={feature.id}
                            className="rounded-lg border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-strong)] px-3 py-2 text-sm text-[var(--atlas-text)]"
                          >
                            {feature.feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
                Workspace Defaults
              </h2>
              <p className="mt-1 text-sm text-[var(--atlas-muted)]">
                The baseline experience new tenants inherit when they onboard.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { label: "Timezone", value: timezoneLabel },
                { label: "Currency", value: currencyLabel },
                { label: "Theme preference", value: themeLabel },
                { label: "Landing page", value: landingPageLabel },
                {
                  label: "Weekly summary",
                  value: DEFAULT_USER_PREFERENCES.weeklySummary ? "Enabled" : "Disabled",
                },
                {
                  label: "Email notifications",
                  value: DEFAULT_USER_PREFERENCES.emailNotifications ? "Enabled" : "Disabled",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 py-3"
                >
                  <span className="text-sm text-[var(--atlas-muted)]">{row.label}</span>
                  <span className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
                Access Guardrails
              </h2>
              <p className="mt-1 text-sm text-[var(--atlas-muted)]">
                Current identity posture and the operational boundaries we are enforcing.
              </p>
            </div>

            <div className="space-y-2">
              {[
                {
                  label: "Platform admins",
                  value: formatNumber(activeAdmins),
                  detail: "Global control-plane management",
                },
                {
                  label: "Enabled users",
                  value: formatNumber(enabledUsers),
                  detail: "Platform sign-in access",
                },
                {
                  label: "Tenant-scoped workspaces",
                  value: formatNumber(overview.totalTenants || 0),
                  detail: "Operational records isolated per tenant",
                },
                {
                  label: "Tenants under seat pressure",
                  value: formatNumber(pressureCount),
                  detail: "Commercial limits still requiring attention",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                      {item.label}
                    </div>
                    <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                      {item.value}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-[var(--atlas-muted)]">{item.detail}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
                Live Plan Mix
              </h2>
              <p className="mt-1 text-sm text-[var(--atlas-muted)]">
                How the current tenant base is distributed across tiers.
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
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500"
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center gap-2 text-[var(--atlas-text-strong)]">
              <SlidersHorizontal size={16} />
              <h2 className="text-lg font-semibold">Policy Notes</h2>
            </div>
            <div className="space-y-2 text-sm text-[var(--atlas-text)]">
              <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 py-3">
                Tenant operational APIs are expected to execute with tenant context so records do not leak across organizations.
              </div>
              <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 py-3">
                Platform APIs remain global and are reserved for `PLATFORM_ADMIN` accounts only.
              </div>
              <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 py-3">
                Commercial guardrails should be reviewed whenever seat pressure rises or a tenant is suspended.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

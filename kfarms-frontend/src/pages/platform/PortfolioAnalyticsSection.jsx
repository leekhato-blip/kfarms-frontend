import React from "react";
import {
  BarChart3,
  CircleDollarSign,
  Layers3,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import Card from "../../components/Card";
import {
  formatCompactCurrencyValue,
  formatCurrencyValue,
  formatNumber,
} from "../../utils/formatters";
import { getAppLifecycleLabel } from "./appHub";

const LIFE_CYCLE_COLORS = {
  LIVE: "#7c3aed",
  PILOT: "#8b5cf6",
  PLANNED: "#2563eb",
};

const FOOTPRINT_COLORS = {
  tenantCount: "#7c3aed",
  operatorCount: "#60a5fa",
};

function truncateLabel(value, maxLength = 18) {
  const label = String(value || "").trim();
  if (!label) return "Unnamed";
  if (label.length <= maxLength) return label;
  return `${label.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function getPrimaryCurrency(apps = []) {
  const currency = apps.find((app) => String(app?.revenueCurrency || "").trim())?.revenueCurrency;
  return String(currency || "NGN").trim().toUpperCase() || "NGN";
}

function buildRevenueSeries(apps = []) {
  return [...apps]
    .map((app, index) => ({
      id: app.id || `app-${index}`,
      name: app.name || "Unnamed App",
      shortName: truncateLabel(app.name || "Unnamed App", 20),
      revenue: Number(app.revenueGenerated || 0),
      tenantCount: Number(app.tenantCount || 0),
      operatorCount: Number(app.operatorCount || 0),
      lifecycle: String(app.lifecycle || "PLANNED").toUpperCase(),
    }))
    .sort((left, right) => {
      if (right.revenue !== left.revenue) return right.revenue - left.revenue;
      if (right.operatorCount !== left.operatorCount) return right.operatorCount - left.operatorCount;
      return right.tenantCount - left.tenantCount;
    });
}

function buildFootprintSeries(apps = []) {
  return [...apps]
    .map((app, index) => ({
      id: app.id || `app-${index}`,
      name: app.name || "Unnamed App",
      shortName: truncateLabel(app.name || "Unnamed App", 18),
      tenantCount: Number(app.tenantCount || 0),
      operatorCount: Number(app.operatorCount || 0),
      suspendedTenantCount: Number(app.suspendedTenantCount || 0),
      lifecycle: String(app.lifecycle || "PLANNED").toUpperCase(),
    }))
    .sort((left, right) => {
      const liveLeft = left.lifecycle === "LIVE" ? 1 : 0;
      const liveRight = right.lifecycle === "LIVE" ? 1 : 0;
      if (liveRight !== liveLeft) return liveRight - liveLeft;
      if (right.operatorCount !== left.operatorCount) return right.operatorCount - left.operatorCount;
      return right.tenantCount - left.tenantCount;
    });
}

function buildLifecycleSeries(apps = []) {
  const counts = apps.reduce((accumulator, app) => {
    const lifecycle = String(app.lifecycle || "PLANNED").toUpperCase();
    accumulator[lifecycle] = (accumulator[lifecycle] || 0) + 1;
    return accumulator;
  }, {});

  return ["LIVE", "PILOT", "PLANNED"]
    .map((lifecycle) => ({
      id: lifecycle,
      label: getAppLifecycleLabel(lifecycle),
      value: counts[lifecycle] || 0,
      color: LIFE_CYCLE_COLORS[lifecycle] || LIFE_CYCLE_COLORS.PLANNED,
    }))
    .filter((item) => item.value > 0);
}

function ChartTooltip({ active, payload, label, currency = "NGN" }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[180px] rounded-[1rem] border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface)] px-3 py-2.5 text-xs shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:shadow-[0_20px_45px_rgba(5,8,18,0.55)]">
      {label ? (
        <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
          {label}
        </div>
      ) : null}

      <div className="space-y-1.5">
        {payload.map((entry) => {
          const dataKey = String(entry.dataKey || "");
          const isRevenue = dataKey.toLowerCase().includes("revenue");
          const formattedValue = isRevenue
            ? formatCurrencyValue(entry.value, currency)
            : formatNumber(entry.value);

          return (
            <div key={`${dataKey}-${entry.name || ""}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[var(--atlas-text)]">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color || entry.fill || "#7c3aed" }}
                />
                <span>{entry.name || dataKey}</span>
              </div>
              <span className="font-semibold text-[var(--atlas-text-strong)]">{formattedValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChartEmptyState({ message }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-[1.3rem] border border-dashed border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)]/55 px-4 text-center text-sm text-[var(--atlas-muted)]">
      {message}
    </div>
  );
}

function ChartFrame({ icon, eyebrow, title, subtitle, footer, children, compact = false }) {
  const IconComponent = icon;

  return (
    <Card className={`atlas-stage-card flex h-full flex-col p-5 ${compact ? "min-h-[330px]" : "min-h-[360px]"}`}>
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--atlas-muted)]">
            {eyebrow}
          </div>
          <h3 className="mt-1 font-header text-lg font-semibold text-[var(--atlas-text-strong)] sm:text-xl">
            {title}
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--atlas-muted)]">
            {subtitle}
          </p>
        </div>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)] text-violet-700 dark:text-violet-200 sm:h-10 sm:w-10">
          {IconComponent ? <IconComponent size={18} /> : null}
        </span>
      </div>

      <div className="relative z-10 mt-5 flex-1">
        {children}
      </div>

      {footer ? (
        <div className="relative z-10 mt-4 border-t border-[color:var(--atlas-border)] pt-4">
          {footer}
        </div>
      ) : null}
    </Card>
  );
}

function AnalyticsHighlights({ apps = [], currency = "NGN" }) {
  const totalRevenue = apps.reduce((sum, app) => sum + Number(app.revenueGenerated || 0), 0);
  const totalWorkspaces = apps.reduce((sum, app) => sum + Number(app.tenantCount || 0), 0);
  const liveApps = apps.filter((app) => String(app.lifecycle || "").toUpperCase() === "LIVE");
  const topRevenueApp = buildRevenueSeries(apps).find((app) => app.revenue > 0) || null;

  const highlightItems = [
    {
      label: "Recurring revenue",
      value: formatCompactCurrencyValue(totalRevenue, currency, {
        maximumFractionDigits: 1,
      }),
      detail: `${formatNumber(totalWorkspaces)} workspace${totalWorkspaces === 1 ? "" : "s"} contributing to recurring billing`,
    },
    {
      label: "Top billing app",
      value: topRevenueApp?.name || "Not live yet",
      detail: topRevenueApp
        ? formatCurrencyValue(topRevenueApp.revenue, currency)
        : "Recurring billing appears when an app starts serving paying workspaces",
    },
    {
      label: "Live coverage",
      value: `${formatNumber(liveApps.length)}/${formatNumber(apps.length || 0)}`,
      detail: `${formatNumber(Math.max(apps.length - liveApps.length, 0))} app lane${apps.length - liveApps.length === 1 ? "" : "s"} still in the pipeline`,
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {highlightItems.map((item) => (
        <div
          key={item.label}
          className="rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/72 p-3"
        >
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
            {item.label}
          </div>
          <div className="mt-2 text-lg font-semibold text-[var(--atlas-text-strong)]">
            {item.value}
          </div>
          <div className="mt-1 text-xs leading-5 text-[var(--atlas-muted)]">
            {item.detail}
          </div>
        </div>
      ))}
    </div>
  );
}

function RevenueByAppChart({ apps = [], compact = false }) {
  const chartId = React.useId();
  const currency = React.useMemo(() => getPrimaryCurrency(apps), [apps]);
  const data = React.useMemo(() => buildRevenueSeries(apps), [apps]);
  const hasRevenue = data.some((item) => item.revenue > 0);
  const leader = data[0] || null;
  const barHeight = compact ? 230 : 260;

  return (
    <ChartFrame
      icon={CircleDollarSign}
      eyebrow="Commercial"
      title="Revenue by app"
      subtitle="Recurring billing by app across ROOTS."
      compact={compact}
      footer={
        hasRevenue && leader ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-[var(--atlas-muted)]">Leading app</span>
            <span className="font-semibold text-[var(--atlas-text-strong)]">
              {leader.name} · {formatCurrencyValue(leader.revenue, currency)}
            </span>
          </div>
        ) : null
      }
    >
      {!hasRevenue ? (
        <ChartEmptyState message="Recurring revenue will appear here as soon as an app begins serving paying workspaces." />
      ) : (
        <div className="h-[230px] sm:h-[250px]" style={{ height: barHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 18, left: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`${chartId}-revenue-bar`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#5b21b6" />
                  <stop offset="55%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal={false} stroke="rgba(148,163,184,0.14)" />
              <XAxis
                type="number"
                tick={{ fill: "var(--atlas-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) =>
                  formatCompactCurrencyValue(value, currency, {
                    maximumFractionDigits: 1,
                  })
                }
              />
              <YAxis
                type="category"
                dataKey="shortName"
                width={118}
                tick={{ fill: "var(--atlas-text-strong)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip content={<ChartTooltip currency={currency} />} cursor={{ fill: "rgba(124,58,237,0.08)" }} />
              <Bar
                dataKey="revenue"
                name="Revenue"
                radius={[0, 10, 10, 0]}
                fill={`url(#${chartId}-revenue-bar)`}
                barSize={compact ? 20 : 24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartFrame>
  );
}

function PortfolioFootprintChart({ apps = [], compact = false }) {
  const data = React.useMemo(() => buildFootprintSeries(apps), [apps]);
  const hasVolume = data.some((item) => item.tenantCount > 0 || item.operatorCount > 0);

  return (
    <ChartFrame
      icon={BarChart3}
      eyebrow="Adoption"
      title="Workspace and operator load"
      subtitle="See which apps carry the most workspace and operator activity."
      compact={compact}
      footer={
        <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--atlas-muted)]">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: FOOTPRINT_COLORS.tenantCount }} />
            Workspaces
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: FOOTPRINT_COLORS.operatorCount }} />
            Operators
          </span>
        </div>
      }
    >
      {!hasVolume ? (
        <ChartEmptyState message="Workspace and operator analytics will deepen here once the portfolio has active tenant traffic." />
      ) : (
        <div className={`w-full ${compact ? "h-[230px]" : "h-[260px]"}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 6, right: 10, left: -8, bottom: 6 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.14)" vertical={false} />
              <XAxis
                dataKey="shortName"
                tick={{ fill: "var(--atlas-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--atlas-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatNumber}
              />
              <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: "rgba(96,165,250,0.08)" }} />
              <Bar dataKey="tenantCount" name="Workspaces" fill={FOOTPRINT_COLORS.tenantCount} radius={[10, 10, 0, 0]} />
              <Bar dataKey="operatorCount" name="Operators" fill={FOOTPRINT_COLORS.operatorCount} radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartFrame>
  );
}

function LifecycleMixChart({ apps = [], compact = false }) {
  const data = React.useMemo(() => buildLifecycleSeries(apps), [apps]);
  const totalApps = apps.length;

  return (
    <ChartFrame
      icon={Layers3}
      eyebrow="Lifecycle"
      title="Portfolio stage mix"
      subtitle="A quick split between live apps and planned apps."
      compact={compact}
      footer={data.length > 0 ? (
        <div className="space-y-2">
          {data.map((item) => {
            const ratio = totalApps > 0 ? item.value / totalApps : 0;

            return (
              <div key={item.id}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-[var(--atlas-text-strong)]">{item.label}</span>
                  <span className="text-[var(--atlas-muted)]">
                    {formatNumber(item.value)} app{item.value === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[color:var(--atlas-border)]">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${ratio * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    >
      {totalApps === 0 ? (
        <ChartEmptyState message="Add portfolio apps and the lifecycle mix will appear here." />
      ) : (
        <div className="grid h-full gap-4 md:grid-cols-[minmax(0,240px)_1fr] md:items-center">
          <div className={`relative ${compact ? "h-[210px]" : "h-[240px]"}`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={4}
                  stroke="var(--atlas-surface)"
                  strokeWidth={3}
                >
                  {data.map((item) => (
                    <Cell key={item.id} fill={item.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--atlas-muted)]">
                Portfolio
              </div>
              <div className="mt-2 text-3xl font-semibold text-[var(--atlas-text-strong)]">
                {formatNumber(totalApps)}
              </div>
              <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                total apps
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {data.map((item) => (
              <div
                key={item.id}
                className="rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/72 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm text-[var(--atlas-muted)]">
                    {formatNumber(item.value)}
                  </span>
                </div>
                <div className="mt-2 text-xs leading-5 text-[var(--atlas-muted)]">
                  {item.id === "LIVE" ? "Serving live workspaces right now." : "Reserved for the next stage of platform expansion."}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartFrame>
  );
}

export function PortfolioMiniRevenueChart({ apps = [], loading = false }) {
  const chartId = React.useId();
  const currency = React.useMemo(() => getPrimaryCurrency(apps), [apps]);
  const data = React.useMemo(() => buildRevenueSeries(apps).slice(0, 4), [apps]);
  const hasRevenue = data.some((item) => item.revenue > 0);

  if (loading) {
    return (
      <div className="flex h-[190px] items-center justify-center rounded-[1.35rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/70 text-sm text-[var(--atlas-muted)]">
        Syncing live analytics...
      </div>
    );
  }

  if (!hasRevenue) {
    return (
      <div className="flex h-[190px] items-center justify-center rounded-[1.35rem] border border-dashed border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)]/56 px-4 text-center text-sm text-[var(--atlas-muted)]">
        Recurring revenue bars will appear here once a live app starts serving paying workspaces.
      </div>
    );
  }

  return (
    <div className="h-[190px] rounded-[1.35rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/68 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 4 }}>
          <defs>
            <linearGradient id={`${chartId}-mini-revenue`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis
            dataKey="shortName"
            tick={{ fill: "var(--atlas-muted)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--atlas-muted)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) =>
              formatCompactCurrencyValue(value, currency, {
                maximumFractionDigits: 1,
              })
            }
          />
          <RechartsTooltip content={<ChartTooltip currency={currency} />} cursor={{ fill: "rgba(124,58,237,0.08)" }} />
          <Bar dataKey="revenue" name="Revenue" fill={`url(#${chartId}-mini-revenue)`} radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function PortfolioAnalyticsSection({
  apps = [],
  loading = false,
  compact = false,
  title = "Portfolio analytics",
  subtitle = "Clear chart views for revenue, adoption, and app lifecycle across the suite.",
}) {
  const currency = React.useMemo(() => getPrimaryCurrency(apps), [apps]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="font-header text-2xl font-semibold text-[var(--atlas-text-strong)]">
            {title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)]">
            {subtitle}
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={`portfolio-analytics-loading-${index}`} className="atlas-stage-card min-h-[330px] p-5 text-sm text-[var(--atlas-muted)]">
              Loading analytics...
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-header text-2xl font-semibold text-[var(--atlas-text-strong)]">
            {title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--atlas-muted)]">
            {subtitle}
          </p>
        </div>
      </div>

      <AnalyticsHighlights apps={apps} currency={currency} />

      <div className="grid gap-4 xl:grid-cols-3">
        <RevenueByAppChart apps={apps} compact={compact} />
        <PortfolioFootprintChart apps={apps} compact={compact} />
        <LifecycleMixChart apps={apps} compact={compact} />
      </div>
    </section>
  );
}

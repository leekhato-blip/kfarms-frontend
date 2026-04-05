import React from "react";
import {
  AlertTriangle,
  Building2,
  Egg,
  Fish,
  LineChart,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Button from "../components/Button";
import Card from "../components/Card";
import GlassToast from "../components/GlassToast";
import {
  createEnterpriseSite,
  deleteEnterpriseSite,
  getEnterpriseOverview,
  listEnterpriseSites,
  updateEnterpriseSite,
} from "../services/enterpriseService";
import { useTenant } from "../tenant/TenantContext";
import { formatNumber } from "../utils/formatters";
import {
  WORKSPACE_PERMISSIONS,
  hasWorkspacePermission,
} from "../utils/workspacePermissions";

const EMPTY_SITE_FORM = Object.freeze({
  name: "",
  code: "",
  location: "",
  managerName: "",
  active: true,
  poultryEnabled: true,
  fishEnabled: false,
  poultryHouseCount: 0,
  pondCount: 0,
  activeBirdCount: 0,
  fishStockCount: 0,
  currentMonthRevenue: 0,
  currentMonthExpenses: 0,
  currentFeedUsageKg: 0,
  projectedEggOutput30d: 0,
  projectedFishHarvestKg: 0,
  currentMortalityRate: 0,
  notes: "",
});

const inputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 dark:border-white/10 dark:bg-darkCard/70 dark:text-darkText";

function formatMoney(value, currency = "NGN") {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return `${currency} 0`;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(parsed);
}

function formatPercent(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "0%";
  return `${parsed.toFixed(1)}%`;
}

function SummaryCard({ icon, label, value, detail }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
            {label}
          </div>
          <div className="mt-2 text-2xl font-semibold text-[var(--atlas-text-strong)]">
            {value}
          </div>
          {detail ? (
            <div className="mt-1 text-xs text-[var(--atlas-muted)]">{detail}</div>
          ) : null}
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-primary/12 text-accent-primary">
          {React.createElement(icon, { size: 18 })}
        </span>
      </div>
    </Card>
  );
}

export default function EnterprisePage() {
  const { activeTenant } = useTenant();
  const currency = activeTenant?.currency || "NGN";
  const canManageEnterprise = hasWorkspacePermission(
    activeTenant,
    WORKSPACE_PERMISSIONS.ENTERPRISE_MANAGE,
  );

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState(null);
  const [editingSiteId, setEditingSiteId] = React.useState(null);
  const [siteForm, setSiteForm] = React.useState(EMPTY_SITE_FORM);
  const [overview, setOverview] = React.useState({
    overview: {},
    forecasts: {},
    sitePerformance: [],
    modulePerformance: [],
    teamMix: [],
    poultryBatchHighlights: [],
    fishPondHighlights: [],
    alerts: [],
  });
  const [sites, setSites] = React.useState([]);
  const [toast, setToast] = React.useState({ message: "", type: "info" });

  const loadEnterpriseData = React.useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [overviewPayload, siteRows] = await Promise.all([
        getEnterpriseOverview(),
        listEnterpriseSites(),
      ]);
      setOverview(overviewPayload);
      setSites(siteRows);
    } catch (error) {
      setToast({
        message: error?.message || "Could not load enterprise controls right now.",
        type: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadEnterpriseData();
  }, [loadEnterpriseData]);

  function handleFieldChange(field, value) {
    setSiteForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setEditingSiteId(null);
    setSiteForm(EMPTY_SITE_FORM);
  }

  function startEdit(site) {
    setEditingSiteId(site.id);
    setSiteForm({
      ...EMPTY_SITE_FORM,
      ...site,
    });
  }

  async function handleSaveSite(event) {
    event.preventDefault();
    if (!canManageEnterprise || saving) return;

    setSaving(true);
    try {
      if (editingSiteId) {
        await updateEnterpriseSite(editingSiteId, siteForm);
        setToast({ message: "Site updated.", type: "success" });
      } else {
        await createEnterpriseSite(siteForm);
        setToast({ message: "Site added to the enterprise portfolio.", type: "success" });
      }
      resetForm();
      await loadEnterpriseData({ silent: true });
    } catch (error) {
      setToast({
        message: error?.message || "Could not save the site right now.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSite(site) {
    if (!canManageEnterprise || !site?.id) return;
    setDeletingId(site.id);
    try {
      await deleteEnterpriseSite(site.id);
      if (editingSiteId === site.id) {
        resetForm();
      }
      setToast({ message: `${site.name} removed from the portfolio.`, type: "success" });
      await loadEnterpriseData({ silent: true });
    } catch (error) {
      setToast({
        message: error?.message || "Could not remove the site right now.",
        type: "error",
      });
    } finally {
      setDeletingId(null);
    }
  }

  const overviewCards = [
    {
      icon: Building2,
      label: "Active Sites",
      value: formatNumber(overview.overview.activeSites),
      detail: `${formatNumber(overview.overview.totalSites)} total sites`,
    },
    {
      icon: LineChart,
      label: "Projected Cashflow",
      value: formatMoney(overview.overview.projectedCashflow30d, currency),
      detail: "Next 30 days",
    },
    {
      icon: Egg,
      label: "Egg Forecast",
      value: formatNumber(overview.forecasts.eggOutput30d),
      detail: "Projected eggs in 30 days",
    },
    {
      icon: Fish,
      label: "Fish Harvest",
      value: `${formatNumber(overview.forecasts.fishHarvest60dKg)} kg`,
      detail: "Projected harvest in 60 days",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4 font-body animate-fadeIn">
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-accent-primary/25 bg-accent-primary/10 px-3 py-1 text-xs font-semibold text-accent-primary">
                <ShieldCheck className="h-4 w-4" />
                Enterprise command center
              </div>
              <h1 className="mt-3 text-2xl font-semibold text-[var(--atlas-text-strong)]">
                Multi-branch operations
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-[var(--atlas-muted)]">
                Run site-level planning, branch rollups, and forward-looking farm
                forecasts from one tenant workspace.
              </p>
            </div>

            <Button variant="outline" onClick={() => loadEnterpriseData({ silent: true })} disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((card) => (
            <SummaryCard key={card.label} {...card} />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
                  Branch portfolio
                </h2>
                <p className="mt-1 text-sm text-[var(--atlas-muted)]">
                  Define each farm site, track operating scale, and keep a live roll-up.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {loading ? (
                <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-4 py-8 text-sm text-[var(--atlas-muted)]">
                  Loading sites...
                </div>
              ) : sites.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[color:var(--atlas-border-strong)] px-4 py-8 text-sm text-[var(--atlas-muted)]">
                  No enterprise sites yet. Add your first branch below.
                </div>
              ) : (
                sites.map((site) => (
                  <div
                    key={site.id}
                    className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-base font-semibold text-[var(--atlas-text-strong)]">
                            {site.name}
                          </div>
                          <div className="rounded-full border border-[color:var(--atlas-border-strong)] px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] text-[var(--atlas-muted)]">
                            {site.code}
                          </div>
                          <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            {site.active ? "Active" : "Paused"}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-[var(--atlas-muted)]">
                          {site.location || "Location not added"} · {site.managerName || "Manager not set"}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--atlas-text)]">
                          <span className="rounded-full bg-[color:var(--atlas-surface)] px-3 py-1">
                            Birds: {formatNumber(site.activeBirdCount)}
                          </span>
                          <span className="rounded-full bg-[color:var(--atlas-surface)] px-3 py-1">
                            Fish: {formatNumber(site.fishStockCount)}
                          </span>
                          <span className="rounded-full bg-[color:var(--atlas-surface)] px-3 py-1">
                            Houses: {formatNumber(site.poultryHouseCount)}
                          </span>
                          <span className="rounded-full bg-[color:var(--atlas-surface)] px-3 py-1">
                            Ponds: {formatNumber(site.pondCount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => startEdit(site)}>
                          Edit
                        </Button>
                        {canManageEnterprise ? (
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={deletingId === site.id}
                            onClick={() => handleDeleteSite(site)}
                          >
                            <Trash2 size={14} />
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div>
              <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
                Forecast watch
              </h2>
              <p className="mt-1 text-sm text-[var(--atlas-muted)]">
                Forward-looking operational indicators based on current farm and branch data.
              </p>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                  Feed demand
                </div>
                <div className="mt-2 text-xl font-semibold text-[var(--atlas-text-strong)]">
                  {formatNumber(overview.forecasts.feedDemand30dKg)} kg
                </div>
              </div>
              <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                  Poultry mortality
                </div>
                <div className="mt-2 text-xl font-semibold text-[var(--atlas-text-strong)]">
                  {formatPercent(overview.forecasts.poultryMortalityRate)}
                </div>
              </div>
              <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                  Fish mortality
                </div>
                <div className="mt-2 text-xl font-semibold text-[var(--atlas-text-strong)]">
                  {formatPercent(overview.forecasts.fishMortalityRate)}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                Live alerts
              </div>
              <div className="mt-3 space-y-2">
                {overview.alerts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[color:var(--atlas-border-strong)] px-4 py-4 text-sm text-[var(--atlas-muted)]">
                    No critical enterprise alerts right now.
                  </div>
                ) : (
                  overview.alerts.map((alert, index) => (
                    <div
                      key={`${alert.type}-${index}`}
                      className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                            {alert.type}
                          </div>
                          <div className="mt-1">{alert.message}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
                  Add or edit a site
                </h2>
                <p className="mt-1 text-sm text-[var(--atlas-muted)]">
                  Capture site-level capacity, revenue, feed pressure, and forecast targets.
                </p>
              </div>
              {editingSiteId ? (
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  New site
                </Button>
              ) : null}
            </div>

            <form onSubmit={handleSaveSite} className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-[var(--atlas-muted)]">Site name</label>
                <input
                  value={siteForm.name}
                  onChange={(event) => handleFieldChange("name", event.target.value)}
                  className={inputClassName}
                  placeholder="North layer unit"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--atlas-muted)]">Site code</label>
                <input
                  value={siteForm.code}
                  onChange={(event) => handleFieldChange("code", event.target.value)}
                  className={inputClassName}
                  placeholder="NORTH-01"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--atlas-muted)]">Location</label>
                <input
                  value={siteForm.location}
                  onChange={(event) => handleFieldChange("location", event.target.value)}
                  className={inputClassName}
                  placeholder="Kaduna North"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--atlas-muted)]">Manager</label>
                <input
                  value={siteForm.managerName}
                  onChange={(event) => handleFieldChange("managerName", event.target.value)}
                  className={inputClassName}
                  placeholder="Amina Yusuf"
                />
              </div>

              {[
                ["poultryHouseCount", "Poultry houses"],
                ["pondCount", "Fish ponds"],
                ["activeBirdCount", "Active birds"],
                ["fishStockCount", "Fish stock"],
                ["currentMonthRevenue", "Revenue this month"],
                ["currentMonthExpenses", "Expenses this month"],
                ["currentFeedUsageKg", "Feed usage (kg)"],
                ["projectedEggOutput30d", "Egg forecast (30d)"],
                ["projectedFishHarvestKg", "Fish harvest (kg)"],
                ["currentMortalityRate", "Mortality rate %"],
              ].map(([field, label]) => (
                <div key={field}>
                  <label className="mb-1 block text-xs text-[var(--atlas-muted)]">{label}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={siteForm[field]}
                    onChange={(event) => handleFieldChange(field, Number(event.target.value))}
                    className={inputClassName}
                  />
                </div>
              ))}

              <div className="md:col-span-2 grid gap-2 sm:grid-cols-3">
                <label className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={siteForm.active}
                    onChange={(event) => handleFieldChange("active", event.target.checked)}
                  />
                  Active site
                </label>
                <label className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={siteForm.poultryEnabled}
                    onChange={(event) =>
                      handleFieldChange("poultryEnabled", event.target.checked)
                    }
                  />
                  Poultry
                </label>
                <label className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={siteForm.fishEnabled}
                    onChange={(event) => handleFieldChange("fishEnabled", event.target.checked)}
                  />
                  Fish farming
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs text-[var(--atlas-muted)]">Notes</label>
                <textarea
                  rows={3}
                  value={siteForm.notes}
                  onChange={(event) => handleFieldChange("notes", event.target.value)}
                  className={inputClassName}
                  placeholder="Anything leadership should keep in view for this site."
                />
              </div>

              <div className="md:col-span-2 flex flex-wrap gap-2">
                <Button type="submit" disabled={!canManageEnterprise || saving}>
                  {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  {editingSiteId ? "Update site" : "Save site"}
                </Button>
                <Button variant="outline" onClick={resetForm} disabled={saving}>
                  Reset
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-5">
            <div>
              <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
                Site performance
              </h2>
              <p className="mt-1 text-sm text-[var(--atlas-muted)]">
                A simple branch-by-branch view of revenue, margin, and feed pressure.
              </p>
            </div>

            <div className="mt-4 space-y-4">
              {overview.sitePerformance.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[color:var(--atlas-border-strong)] px-4 py-5 text-sm text-[var(--atlas-muted)]">
                  Add a branch to start tracking branch-level performance here.
                </div>
              ) : (
                overview.sitePerformance.slice(0, 4).map((site) => (
                  <div
                    key={site.id || site.code || site.name}
                    className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[var(--atlas-text-strong)]">
                          {site.name}
                        </div>
                        <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                          {site.location || "Location not added"} · {site.managerName || "Manager not set"}
                        </div>
                      </div>
                      <div className="text-right text-xs text-[var(--atlas-muted)]">
                        <div>Revenue {formatMoney(site.currentMonthRevenue, currency)}</div>
                        <div>Margin {formatMoney(site.currentMonthMargin, currency)}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--atlas-muted)]">
                      <span className="rounded-full bg-[color:var(--atlas-surface)] px-3 py-1">
                        Feed {formatNumber(site.currentFeedUsageKg)} kg
                      </span>
                      <span className="rounded-full bg-[color:var(--atlas-surface)] px-3 py-1">
                        Mortality {formatPercent(site.currentMortalityRate)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
              Poultry batch highlights
            </h2>
            <div className="mt-3 space-y-2">
              {overview.poultryBatchHighlights.map((batch) => (
                <div
                  key={batch.batchName}
                  className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-[var(--atlas-text-strong)]">
                        {batch.batchName}
                      </div>
                      <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                        {batch.type} · {formatNumber(batch.currentStock)} active birds
                      </div>
                    </div>
                    <div className="text-right text-xs text-[var(--atlas-muted)]">
                      <div>Mortality {formatNumber(batch.mortality)}</div>
                      <div>{batch.risk}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold text-[var(--atlas-text-strong)]">
              Fish pond highlights
            </h2>
            <div className="mt-3 space-y-2">
              {overview.fishPondHighlights.map((pond) => (
                <div
                  key={pond.pondName}
                  className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-[var(--atlas-text-strong)]">
                        {pond.pondName}
                      </div>
                      <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                        {pond.status} · {formatNumber(pond.currentStock)} fish
                      </div>
                    </div>
                    <div className="text-xs text-[var(--atlas-muted)]">
                      Mortality {formatNumber(pond.mortality)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <GlassToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />
    </DashboardLayout>
  );
}

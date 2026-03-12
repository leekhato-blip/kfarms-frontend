import React from "react";
import {
  Building2,
  Radar,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import Card from "../../components/Card";
import Table from "../../components/Table";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import { useToast } from "../../components/ToastProvider";
import { cleanQueryParams, PLATFORM_ENDPOINTS } from "../../api/endpoints";
import {
  getApiErrorMessage,
  platformAxios,
  unwrapApiResponse,
} from "../../api/platformClient";
import {
  formatDateTime,
  formatNumber,
  normalizePagination,
} from "../../utils/formatters";
import { PLAN_IDS } from "../../constants/plans";
import {
  buildTenantPressureList,
  formatPercentLabel,
  getSeatUsageSummary,
  getTenantId,
} from "./platformInsights";

const PLAN_OPTIONS = ["", ...PLAN_IDS];
const STATUS_OPTIONS = ["", "ACTIVE", "SUSPENDED"];

function SnapshotTile({ icon, label, value, hint }) {
  const IconComponent = icon;

  return (
    <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
          {label}
        </div>
        <IconComponent size={16} className="text-[var(--atlas-muted)]" />
      </div>
      <div className="mt-2 text-2xl font-semibold text-[var(--atlas-text-strong)]">
        {value}
      </div>
      <div className="mt-1 text-xs text-[var(--atlas-muted)]">{hint}</div>
    </div>
  );
}

function TenantDetailSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`tenant-detail-skeleton-${index}`}
          className="h-24 rounded-xl bg-[color:var(--atlas-surface-soft)]"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default function PlatformTenantsPage() {
  const { notify } = useToast();

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [plan, setPlan] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [tenants, setTenants] = React.useState([]);
  const [totalItems, setTotalItems] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);

  const [selectedTenantId, setSelectedTenantId] = React.useState(null);
  const [selectedTenant, setSelectedTenant] = React.useState(null);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const [detailsError, setDetailsError] = React.useState("");
  const [planDraft, setPlanDraft] = React.useState("FREE");
  const [statusDraft, setStatusDraft] = React.useState("ACTIVE");
  const [savingPlan, setSavingPlan] = React.useState(false);
  const [savingStatus, setSavingStatus] = React.useState(false);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 320);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const fetchTenants = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = cleanQueryParams({ search, plan, status, page, size });
      const response = await platformAxios.get(PLATFORM_ENDPOINTS.tenants, { params });
      const payload = unwrapApiResponse(response.data, "Failed to load tenants");
      const normalized = normalizePagination(payload, { page, size });

      setTenants(normalized.items);
      setTotalItems(normalized.totalItems);
      setTotalPages(normalized.totalPages);
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, "Failed to load tenants"));
      setTenants([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, plan, search, size, status]);

  React.useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  React.useEffect(() => {
    if (selectedTenantId || tenants.length === 0) return;
    setSelectedTenantId(getTenantId(tenants[0]));
  }, [selectedTenantId, tenants]);

  const loadTenantDetails = React.useCallback(
    async (tenantId) => {
      if (!tenantId) {
        setSelectedTenant(null);
        setDetailsError("");
        return;
      }

      setDetailsLoading(true);
      setDetailsError("");

      try {
        const response = await platformAxios.get(PLATFORM_ENDPOINTS.tenantDetails(tenantId));
        const payload = unwrapApiResponse(response.data, "Failed to load tenant details");
        setSelectedTenant(payload);
        setPlanDraft(String(payload?.plan || "FREE").toUpperCase());
        setStatusDraft(String(payload?.status || "ACTIVE").toUpperCase());
      } catch (detailError) {
        setSelectedTenant(null);
        setDetailsError(getApiErrorMessage(detailError, "Failed to load tenant details"));
      } finally {
        setDetailsLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    loadTenantDetails(selectedTenantId);
  }, [loadTenantDetails, selectedTenantId]);

  const savePlan = React.useCallback(async () => {
    if (!selectedTenantId || !planDraft) return;

    setSavingPlan(true);
    try {
      const response = await platformAxios.patch(
        PLATFORM_ENDPOINTS.tenantPlan(selectedTenantId),
        { plan: planDraft },
      );
      unwrapApiResponse(response.data, "Failed to update tenant plan");
      notify("Tenant plan updated", "success");
      await Promise.all([fetchTenants(), loadTenantDetails(selectedTenantId)]);
    } catch (mutationError) {
      notify(getApiErrorMessage(mutationError, "Failed to update plan"), "error");
    } finally {
      setSavingPlan(false);
    }
  }, [fetchTenants, loadTenantDetails, notify, planDraft, selectedTenantId]);

  const saveStatus = React.useCallback(async () => {
    if (!selectedTenantId || !statusDraft) return;

    setSavingStatus(true);
    try {
      const response = await platformAxios.patch(
        PLATFORM_ENDPOINTS.tenantStatus(selectedTenantId),
        { status: statusDraft },
      );
      unwrapApiResponse(response.data, "Failed to update tenant status");
      notify("Tenant status updated", "success");
      await Promise.all([fetchTenants(), loadTenantDetails(selectedTenantId)]);
    } catch (mutationError) {
      notify(getApiErrorMessage(mutationError, "Failed to update status"), "error");
    } finally {
      setSavingStatus(false);
    }
  }, [fetchTenants, loadTenantDetails, notify, selectedTenantId, statusDraft]);

  const activeTenantsOnPage = React.useMemo(
    () =>
      tenants.filter((tenant) => String(tenant?.status || "").toUpperCase() === "ACTIVE").length,
    [tenants],
  );

  const pressuredTenantsOnPage = React.useMemo(
    () =>
      buildTenantPressureList(tenants).filter(
        ({ seatUsage }) => seatUsage.nearLimit || seatUsage.overLimit,
      ).length,
    [tenants],
  );

  const selectedTenantSummary = React.useMemo(
    () => tenants.find((tenant) => getTenantId(tenant) === selectedTenantId) || null,
    [selectedTenantId, tenants],
  );

  const selectedSeatUsage = React.useMemo(
    () => getSeatUsageSummary(selectedTenant || selectedTenantSummary || {}),
    [selectedTenant, selectedTenantSummary],
  );

  const memberRows = Array.isArray(selectedTenant?.members) ? selectedTenant.members : [];

  const columns = [
    { key: "name", label: "Tenant", className: "min-w-[180px]" },
    { key: "plan", label: "Plan", className: "min-w-[120px]" },
    { key: "status", label: "Status", className: "min-w-[120px]" },
    { key: "ownerEmail", label: "Owner", className: "min-w-[260px]" },
    { key: "memberCount", label: "Members", className: "min-w-[110px]" },
    { key: "createdAt", label: "Created", className: "min-w-[180px]" },
    { key: "lastActivityAt", label: "Last Activity", className: "min-w-[180px]" },
    { key: "actions", label: "Inspect", className: "min-w-[120px] text-right", align: "right" },
  ];

  const selectedTenantName =
    selectedTenant?.name || selectedTenantSummary?.name || "Select a tenant";

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-violet-500/15 via-blue-500/10 to-emerald-500/10 p-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
              Tenant Control
            </div>
            <div className="mt-1 text-sm text-[var(--atlas-text-strong)]">
              Inspect organizations, tune plans, and confirm each tenant stays inside its own lane.
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTenants}>
            <RefreshCw size={14} />
            Refresh
          </Button>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SnapshotTile
          icon={Building2}
          label="Filtered Tenants"
          value={formatNumber(totalItems)}
          hint="Based on the current search and plan filters."
        />
        <SnapshotTile
          icon={Radar}
          label="Active On Page"
          value={formatNumber(activeTenantsOnPage)}
          hint="Workspaces currently in active service."
        />
        <SnapshotTile
          icon={Users}
          label="Capacity Pressure"
          value={formatNumber(pressuredTenantsOnPage)}
          hint="Tenants approaching or exceeding their seat limits."
        />
        <SnapshotTile
          icon={ShieldAlert}
          label="Selected Scope"
          value={selectedSeatUsage.label}
          hint={`${selectedTenantName} team seats in use right now.`}
        />
      </div>

      {error && (
        <div className="rounded-md border border-violet-300/60 bg-violet-50 px-3 py-2 text-sm text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/20 dark:text-violet-100">
          {error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_420px]">
        <div className="space-y-4">
          <Card>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
              <label className="relative block">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--atlas-muted)]"
                />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search name, slug, owner email"
                  className="h-10 w-full rounded-md border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] pl-9 pr-3 text-sm text-[var(--atlas-text-strong)] outline-none placeholder:text-[var(--atlas-muted-soft)] focus:border-blue-400/50"
                />
              </label>

              <select
                value={plan}
                onChange={(event) => {
                  setPlan(event.target.value);
                  setPage(0);
                }}
                className="h-10 rounded-md border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] px-3 text-sm text-[var(--atlas-text-strong)] outline-none"
              >
                {PLAN_OPTIONS.map((option) => (
                  <option key={option || "all-plan"} value={option}>
                    {option || "All Plans"}
                  </option>
                ))}
              </select>

              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(0);
                }}
                className="h-10 rounded-md border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] px-3 text-sm text-[var(--atlas-text-strong)] outline-none"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option || "all-status"} value={option}>
                    {option || "All Status"}
                  </option>
                ))}
              </select>

              <Button variant="outline" onClick={fetchTenants}>
                <RefreshCw size={14} />
                Refresh List
              </Button>
            </div>
          </Card>

          <Table
            columns={columns}
            data={tenants}
            loading={loading}
            tableClassName="min-w-[1420px]"
            rowKey={(tenant) => getTenantId(tenant)}
            onRowClick={(tenant) => setSelectedTenantId(getTenantId(tenant))}
            rowClassName="hover:bg-[color:var(--atlas-surface-hover)]"
            renderRow={(tenant) => {
              const tenantId = getTenantId(tenant);
              const seatUsage = getSeatUsageSummary(tenant);
              const isSelected = tenantId === selectedTenantId;

              return (
                <>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[var(--atlas-text-strong)]">
                      {tenant.name || "-"}
                    </div>
                    <div className="text-xs text-[var(--atlas-muted)]">{tenant.slug || "-"}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge kind="plan" value={tenant.plan || "FREE"} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge kind="status" value={tenant.status || "ACTIVE"} />
                  </td>
                  <td className="max-w-[280px] px-4 py-3 text-[var(--atlas-muted)]">
                    <div className="truncate" title={tenant.ownerEmail || tenant.owner?.email || "-"}>
                      {tenant.ownerEmail || tenant.owner?.email || "-"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--atlas-muted)]">
                    <div>{formatNumber(tenant.memberCount ?? tenant.membersCount ?? 0)}</div>
                    <div className="text-xs text-[var(--atlas-muted-soft)]">
                      {seatUsage.label} seats
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--atlas-muted)]">
                    {formatDateTime(tenant.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--atlas-muted)]">
                    {formatDateTime(tenant.lastActivityAt || tenant.lastActivity)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant={isSelected ? "primary" : "outline"}
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedTenantId(tenantId);
                      }}
                    >
                      {isSelected ? "Inspecting" : "Inspect"}
                    </Button>
                  </td>
                </>
              );
            }}
            emptyTitle="No tenants found"
            emptyMessage="Try a broader search or clear filters."
          />

          {!loading && tenants.length === 0 && !error && (
            <EmptyState
              title="No tenants found"
              message="No organizations match your current filters."
            />
          )}

          <Card className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-[var(--atlas-muted)]">
              Page <span className="font-semibold text-[var(--atlas-text-strong)]">{page + 1}</span>
              {" "}of{" "}
              <span className="font-semibold text-[var(--atlas-text-strong)]">
                {Math.max(totalPages, 1)}
              </span>
              {" · "}
              {formatNumber(totalItems)} total
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--atlas-muted)]">
                Size
                <select
                  value={size}
                  onChange={(event) => {
                    setSize(Number(event.target.value));
                    setPage(0);
                  }}
                  className="ml-2 rounded-md border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] px-2 py-1 text-sm text-[var(--atlas-text-strong)]"
                >
                  {[10, 20, 50].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <Button
                variant="outline"
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={loading || page <= 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setPage((prev) => Math.min(Math.max(totalPages - 1, 0), prev + 1))
                }
                disabled={loading || page + 1 >= totalPages}
              >
                Next
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                  Tenant Inspection
                </div>
                <h2 className="mt-1 text-xl font-semibold text-[var(--atlas-text-strong)]">
                  {selectedTenantName}
                </h2>
              </div>
              {selectedTenantId ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadTenantDetails(selectedTenantId)}
                  disabled={detailsLoading}
                >
                  <RefreshCw size={14} />
                  Reload
                </Button>
              ) : null}
            </div>

            {!selectedTenantId && (
              <EmptyState
                title="Select a tenant"
                message="Choose any row from the left to inspect members, plan posture, and module activity."
              />
            )}

            {selectedTenantId && detailsLoading && <TenantDetailSkeleton />}

            {selectedTenantId && detailsError && (
              <div className="rounded-md border border-violet-300/60 bg-violet-50 px-3 py-2 text-sm text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/20 dark:text-violet-100">
                {detailsError}
              </div>
            )}

            {selectedTenantId && !detailsLoading && !detailsError && selectedTenant && (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge kind="plan" value={selectedTenant.plan || "FREE"} />
                  <Badge kind="status" value={selectedTenant.status || "ACTIVE"} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] p-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                      Owner
                    </div>
                    <div className="mt-2 text-sm font-semibold text-[var(--atlas-text-strong)]">
                      {selectedTenant.ownerEmail || "Not available"}
                    </div>
                    <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                      Created {formatDateTime(selectedTenant.createdAt)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] p-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                      Tenant Scope
                    </div>
                    <div className="mt-2 text-sm font-semibold text-[var(--atlas-text-strong)]">
                      {selectedSeatUsage.label} active seats
                    </div>
                    <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                      Last activity {formatDateTime(selectedTenant.lastActivityAt)}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <SnapshotTile
                    icon={Users}
                    label="Members"
                    value={formatNumber(selectedTenant.memberCount ?? memberRows.length)}
                    hint="Owner, admins, managers, and staff."
                  />
                  <SnapshotTile
                    icon={Building2}
                    label="Records"
                    value={formatNumber(selectedTenant.salesCount ?? 0)}
                    hint="Sales already logged for this tenant."
                  />
                  <SnapshotTile
                    icon={Radar}
                    label="Poultry"
                    value={formatNumber(selectedTenant.livestockCount ?? 0)}
                    hint="Tracked poultry groups or flocks."
                  />
                  <SnapshotTile
                    icon={ShieldAlert}
                    label="Fish / Feed"
                    value={`${formatNumber(selectedTenant.fishPondCount ?? 0)} / ${formatNumber(
                      selectedTenant.feedItemCount ?? 0,
                    )}`}
                    hint="Ponds and feed records inside this tenant."
                  />
                </div>

                <div className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                        Plan pressure
                      </div>
                      <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                        {selectedSeatUsage.hasFiniteLimit
                          ? `${selectedSeatUsage.label} seats in use`
                          : "Enterprise workspace with no seat cap"}
                      </div>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        selectedSeatUsage.overLimit
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200"
                          : selectedSeatUsage.nearLimit
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                      }`}
                    >
                      {selectedSeatUsage.overLimit
                        ? "Over limit"
                        : selectedSeatUsage.nearLimit
                          ? "Near limit"
                          : "Healthy"}
                    </div>
                  </div>

                  {selectedSeatUsage.hasFiniteLimit ? (
                    <>
                      <div className="mt-3 h-2 rounded-full bg-[color:var(--atlas-border)]">
                        <div
                          className={`h-2 rounded-full ${
                            selectedSeatUsage.overLimit
                              ? "bg-rose-500"
                              : selectedSeatUsage.nearLimit
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min(selectedSeatUsage.usageRatio, 1) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-[var(--atlas-muted)]">
                        {formatPercentLabel(selectedSeatUsage.usageRatio, 0)} of available seats used.
                      </div>
                    </>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2 text-sm text-[var(--atlas-muted)]">
                    <span>Plan</span>
                    <select
                      value={planDraft}
                      onChange={(event) => setPlanDraft(event.target.value)}
                      className="h-10 w-full rounded-md border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] px-3 text-sm text-[var(--atlas-text-strong)] outline-none"
                    >
                      {PLAN_IDS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={savePlan}
                      disabled={savingPlan || planDraft === String(selectedTenant.plan || "FREE").toUpperCase()}
                    >
                      <Save size={14} />
                      {savingPlan ? "Saving..." : "Save plan"}
                    </Button>
                  </label>

                  <label className="space-y-2 text-sm text-[var(--atlas-muted)]">
                    <span>Status</span>
                    <select
                      value={statusDraft}
                      onChange={(event) => setStatusDraft(event.target.value)}
                      className="h-10 w-full rounded-md border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] px-3 text-sm text-[var(--atlas-text-strong)] outline-none"
                    >
                      {STATUS_OPTIONS.filter(Boolean).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={saveStatus}
                      disabled={
                        savingStatus ||
                        statusDraft === String(selectedTenant.status || "ACTIVE").toUpperCase()
                      }
                    >
                      <Save size={14} />
                      {savingStatus ? "Saving..." : "Save status"}
                    </Button>
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                      Members
                    </div>
                    <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                      Live membership list for this tenant workspace.
                    </div>
                  </div>

                  {memberRows.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[color:var(--atlas-border-strong)] px-3 py-5 text-center text-sm text-[var(--atlas-muted)]">
                      No member records were returned for this tenant yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {memberRows.map((member) => (
                        <div
                          key={member.id}
                          className="rounded-xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-3 py-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                                {member.fullName || member.email || "Member"}
                              </div>
                              <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                                {member.email || "No email"}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge kind="role" value={member.role || "STAFF"} />
                              <Badge
                                kind="active"
                                value={member.active ? "ENABLED" : "DISABLED"}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

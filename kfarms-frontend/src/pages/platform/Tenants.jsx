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
import { useOutletContext, useSearchParams } from "react-router-dom";
import Card from "../../components/Card";
import Table from "../../components/Table";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import PlatformMetricCard from "../../components/PlatformMetricCard";
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
import { getEnabledModuleOptions } from "../../tenant/tenantModules";
import {
  getWorkspaceRoleLabel,
  normalizeWorkspaceRole,
} from "../../utils/workspaceRoles";
import {
  buildTenantPressureList,
  formatPercentLabel,
  getSeatUsageSummary,
  getTenantId,
} from "./platformInsights";
import { buildPlatformDemoSnapshot, buildPlatformLiveSnapshot } from "./platformWorkbench";

const PLAN_OPTIONS = ["", ...PLAN_IDS];
const STATUS_OPTIONS = ["", "ACTIVE", "SUSPENDED"];

function paginateItems(items, page, size) {
  const safePage = Math.max(Number(page) || 0, 0);
  const safeSize = Math.max(Number(size) || 0, 1);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safeSize));
  const start = safePage * safeSize;

  return {
    items: items.slice(start, start + safeSize),
    totalItems,
    totalPages,
  };
}

function filterDemoTenants(tenants, { search = "", plan = "", status = "" } = {}) {
  const query = String(search || "").trim().toLowerCase();
  const normalizedPlan = String(plan || "").trim().toUpperCase();
  const normalizedStatus = String(status || "").trim().toUpperCase();

  return tenants.filter((tenant) => {
    if (normalizedPlan && String(tenant?.plan || "").toUpperCase() !== normalizedPlan) {
      return false;
    }

    if (normalizedStatus && String(tenant?.status || "").toUpperCase() !== normalizedStatus) {
      return false;
    }

    if (!query) return true;

    const haystack = [
      tenant?.name,
      tenant?.slug,
      tenant?.ownerEmail,
      tenant?.owner?.email,
      tenant?.appName,
    ]
      .map((value) => String(value || "").toLowerCase())
      .join(" ");

    return haystack.includes(query);
  });
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

function DetailTabButton({ active = false, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-between gap-2 rounded-[1rem] px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-[color:var(--atlas-surface)] text-[var(--atlas-text-strong)] shadow-[0_10px_30px_rgba(15,23,42,0.18)]"
          : "text-[var(--atlas-muted)] hover:bg-[color:var(--atlas-surface-soft)]/70 hover:text-[var(--atlas-text-strong)]"
      }`}
    >
      <span>{label}</span>
      {count !== undefined ? (
        <span
          className={`inline-flex min-w-[1.6rem] items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            active
              ? "bg-[color:var(--atlas-surface-soft)] text-[var(--atlas-text-strong)]"
              : "bg-[color:var(--atlas-surface-soft)]/85 text-[var(--atlas-muted)]"
          }`}
        >
          {typeof count === "number" ? formatNumber(count) : count}
        </span>
      ) : null}
    </button>
  );
}

function getTenantMemberRolePillClass(role) {
  switch (normalizeWorkspaceRole(role, "STAFF")) {
    case "OWNER":
      return "border-amber-300/45 bg-amber-400/14 text-amber-200";
    case "ADMIN":
      return "border-fuchsia-300/35 bg-fuchsia-400/12 text-fuchsia-200";
    case "MANAGER":
      return "border-emerald-300/35 bg-emerald-400/12 text-emerald-200";
    default:
      return "border-sky-300/35 bg-sky-400/12 text-sky-200";
  }
}

function getTenantMemberStatusPillClass(active) {
  return active
    ? "border-emerald-300/35 bg-emerald-400/18 text-emerald-100"
    : "border-rose-300/35 bg-rose-400/16 text-rose-100";
}

export default function PlatformTenantsPage() {
  const { notify } = useToast();
  const {
    customApps = [],
    platformDataMode = "live",
    platformLimitedAccess = false,
  } = useOutletContext() || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamValue = searchParams.get("search")?.trim() || "";
  const demoSnapshot = React.useMemo(
    () => buildPlatformDemoSnapshot(customApps),
    [customApps],
  );
  const liveSnapshot = React.useMemo(() => buildPlatformLiveSnapshot(), []);

  const [searchInput, setSearchInput] = React.useState(
    () => searchParamValue,
  );
  const [search, setSearch] = React.useState(
    () => searchParamValue,
  );
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
  const [detailTab, setDetailTab] = React.useState("overview");
  const [memberSearchInput, setMemberSearchInput] = React.useState("");
  const deferredMemberSearch = React.useDeferredValue(memberSearchInput.trim());

  const selectTenant = React.useCallback((tenantId) => {
    React.startTransition(() => {
      setSelectedTenantId(tenantId);
      setDetailTab("overview");
      setMemberSearchInput("");
    });
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 320);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  React.useEffect(() => {
    setSearchInput((current) => (current === searchParamValue ? current : searchParamValue));
    setSearch((current) => (current === searchParamValue ? current : searchParamValue));
    setPage(0);
  }, [searchParamValue]);

  React.useEffect(() => {
    if (search === searchParamValue) return;

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (search) {
          next.set("search", search);
        } else {
          next.delete("search");
        }
        return next;
      },
      { replace: true },
    );
  }, [search, searchParamValue, setSearchParams]);

  const fetchTenants = React.useCallback(async () => {
    setLoading(true);
    setError("");

    if (platformDataMode === "demo") {
      const filteredTenants = filterDemoTenants(demoSnapshot.tenants, {
        search,
        plan,
        status,
      });
      const paginatedTenants = paginateItems(filteredTenants, page, size);
      setTenants(paginatedTenants.items);
      setTotalItems(paginatedTenants.totalItems);
      setTotalPages(paginatedTenants.totalPages);
      setLoading(false);
      return;
    }

    try {
      const params = cleanQueryParams({ search, plan, status, page, size });
      const response = await platformAxios.get(PLATFORM_ENDPOINTS.tenants, { params });
      const payload = unwrapApiResponse(response.data, "Failed to load tenants");
      const normalized = normalizePagination(payload, { page, size });
      const nextTenants = normalized.items || [];
      setTenants(nextTenants);
      setTotalItems(normalized.totalItems);
      setTotalPages(normalized.totalPages);
    } catch (fetchError) {
      setError(
        platformLimitedAccess ? "" : getApiErrorMessage(fetchError, "Failed to load tenants"),
      );
      setTenants(liveSnapshot.tenants);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [demoSnapshot.tenants, liveSnapshot.tenants, page, plan, platformDataMode, platformLimitedAccess, search, size, status]);

  React.useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  React.useEffect(() => {
    if (page <= totalPages - 1) return;
    setPage(Math.max(totalPages - 1, 0));
  }, [page, totalPages]);

  React.useEffect(() => {
    if (tenants.length === 0) {
      setSelectedTenantId(null);
      setSelectedTenant(null);
      return;
    }

    const selectionExists = tenants.some((tenant) => getTenantId(tenant) === selectedTenantId);
    if (!selectionExists) {
      setSelectedTenantId(getTenantId(tenants[0]));
    }
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

      if (platformDataMode === "demo") {
        const fallbackTenant =
          demoSnapshot.tenants.find((tenant) => getTenantId(tenant) === tenantId) ||
          tenants.find((tenant) => getTenantId(tenant) === tenantId) ||
          null;
        setSelectedTenant(fallbackTenant);
        setPlanDraft(String(fallbackTenant?.plan || "FREE").toUpperCase());
        setStatusDraft(String(fallbackTenant?.status || "ACTIVE").toUpperCase());
        setDetailsLoading(false);
        return;
      }

      try {
        const response = await platformAxios.get(PLATFORM_ENDPOINTS.tenantDetails(tenantId));
        const payload = unwrapApiResponse(response.data, "Failed to load tenant details");
        setSelectedTenant(payload);
        setPlanDraft(String(payload?.plan || "FREE").toUpperCase());
        setStatusDraft(String(payload?.status || "ACTIVE").toUpperCase());
      } catch (detailError) {
        const fallbackTenant =
          tenants.find((tenant) => getTenantId(tenant) === tenantId) || null;
        setSelectedTenant(fallbackTenant);
        setPlanDraft(String(fallbackTenant?.plan || "FREE").toUpperCase());
        setStatusDraft(String(fallbackTenant?.status || "ACTIVE").toUpperCase());
        setDetailsError(
          platformLimitedAccess
            ? ""
            : getApiErrorMessage(detailError, "Failed to load tenant details"),
        );
      } finally {
        setDetailsLoading(false);
      }
    },
    [demoSnapshot.tenants, platformDataMode, platformLimitedAccess, tenants],
  );

  React.useEffect(() => {
    loadTenantDetails(selectedTenantId);
  }, [loadTenantDetails, selectedTenantId]);

  const savePlan = React.useCallback(async () => {
    if (!selectedTenantId || !planDraft) return;
    if (platformDataMode === "demo") {
      notify("Demo preview is read-only for tenant plan changes.", "info");
      return;
    }

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
  }, [fetchTenants, loadTenantDetails, notify, planDraft, platformDataMode, selectedTenantId]);

  const saveStatus = React.useCallback(async () => {
    if (!selectedTenantId || !statusDraft) return;
    if (platformDataMode === "demo") {
      notify("Demo preview is read-only for tenant status changes.", "info");
      return;
    }

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
  }, [fetchTenants, loadTenantDetails, notify, platformDataMode, selectedTenantId, statusDraft]);

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

  const memberRows = React.useMemo(
    () => (Array.isArray(selectedTenant?.members) ? selectedTenant.members : []),
    [selectedTenant?.members],
  );
  const filteredMemberRows = React.useMemo(() => {
    const query = deferredMemberSearch.toLowerCase();
    if (!query) return memberRows;
    return memberRows.filter((member) => {
      const haystack = [
        member?.fullName,
        member?.email,
        member?.role,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");
      return haystack.includes(query);
    });
  }, [deferredMemberSearch, memberRows]);
  const enabledMemberCount = React.useMemo(
    () => memberRows.filter((member) => member?.active).length,
    [memberRows],
  );
  const disabledMemberCount = React.useMemo(
    () => memberRows.filter((member) => !member?.active).length,
    [memberRows],
  );
  const selectedModuleOptions = React.useMemo(
    () => getEnabledModuleOptions({ enabledModules: selectedTenant?.enabledModules }),
    [selectedTenant?.enabledModules],
  );

  const columns = [
    { key: "name", label: "Tenant", className: "min-w-[180px]" },
    { key: "appName", label: "App", className: "min-w-[140px]" },
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
  const seatHealthLabel = selectedSeatUsage.overLimit
    ? "Over limit"
    : selectedSeatUsage.nearLimit
      ? "Near limit"
      : "Healthy";
  const seatHealthClasses = selectedSeatUsage.overLimit
    ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200"
    : selectedSeatUsage.nearLimit
      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200";

  return (
    <div className="space-y-4">
      <Card className="atlas-stage-card p-5">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="atlas-signal-chip w-fit">
              <Building2 size={12} />
              Tenant Workspaces
            </div>
            <h1 className="mt-5 font-header text-3xl font-semibold leading-tight text-[var(--atlas-text-strong)] md:text-[2.35rem]">
              ROOTS workspace network.
            </h1>
            <div className="mt-3 text-sm leading-7 text-[var(--atlas-muted)]">
              Track plans, team limits, and live status.
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTenants}>
            <RefreshCw size={14} />
            Refresh
          </Button>
        </div>
      </Card>

      <div className="atlas-platform-metric-grid-compact">
        <PlatformMetricCard
          icon={Building2}
          label="Filtered Tenants"
          value={formatNumber(totalItems)}
          hint="Matches current filters."
          tone="purple"
        />
        <PlatformMetricCard
          icon={Radar}
          label="Active On Page"
          value={formatNumber(activeTenantsOnPage)}
          hint="Serving now."
          tone="blue"
        />
        <PlatformMetricCard
          icon={Users}
          label="Team Limit Watch"
          value={formatNumber(pressuredTenantsOnPage)}
          hint="Near team limit."
          tone="green"
        />
        <PlatformMetricCard
          icon={ShieldAlert}
          label="Selected Scope"
          value={selectedSeatUsage.label}
          hint={`${selectedTenantName} seats in use.`}
          tone="blue"
        />
      </div>

      {error && (
        <div className="rounded-md border border-violet-300/60 bg-violet-50 px-3 py-2 text-sm text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/20 dark:text-violet-100">
          {error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.72fr)_minmax(360px,0.98fr)]">
        <div className="space-y-4">
          <Card className="atlas-data-shell">
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
                  placeholder="Search name, slug, or owner"
                  className="h-11 w-full rounded-xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] pl-9 pr-3 text-sm text-[var(--atlas-text-strong)] outline-none placeholder:text-[var(--atlas-muted-soft)] focus:border-violet-400/50"
                />
              </label>

              <select
                value={plan}
                onChange={(event) => {
                  setPlan(event.target.value);
                  setPage(0);
                }}
                className="h-11 rounded-xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] px-3 text-sm text-[var(--atlas-text-strong)] outline-none"
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
                className="h-11 rounded-xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] px-3 text-sm text-[var(--atlas-text-strong)] outline-none"
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

          <div className="space-y-3 xl:hidden">
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <Card
                    key={`tenant-mobile-skeleton-${index}`}
                    className="atlas-data-shell space-y-4 p-4"
                  >
                    <div className="h-5 w-1/2 rounded-full bg-[color:var(--atlas-surface-strong)]" aria-hidden="true" />
                    <div className="h-3 w-1/3 rounded-full bg-[color:var(--atlas-surface-strong)]" aria-hidden="true" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-20 rounded-[1rem] bg-[color:var(--atlas-surface-soft)]" aria-hidden="true" />
                      <div className="h-20 rounded-[1rem] bg-[color:var(--atlas-surface-soft)]" aria-hidden="true" />
                    </div>
                  </Card>
                ))
              : tenants.map((tenant) => {
                  const tenantId = getTenantId(tenant);
                  const seatUsage = getSeatUsageSummary(tenant);
                  const isSelected = tenantId === selectedTenantId;

                  return (
                    <Card
                      key={tenantId}
                      className={`atlas-data-shell p-4 transition-colors ${
                        isSelected
                          ? "border-violet-400/40 bg-[color:var(--atlas-surface-hover)]"
                          : ""
                      }`}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        className="space-y-4 outline-none"
                        onClick={() => selectTenant(tenantId)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            selectTenant(tenantId);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-base font-semibold text-[var(--atlas-text-strong)]">
                              {tenant.name || "-"}
                            </div>
                            <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                              {tenant.slug || "-"}
                            </div>
                          </div>
                          <Button
                            variant={isSelected ? "primary" : "outline"}
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              selectTenant(tenantId);
                            }}
                          >
                            {isSelected ? "Inspecting" : "Inspect"}
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex rounded-full border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--atlas-text-strong)]">
                            {tenant.appName || "KFarms"}
                          </span>
                          <span className="inline-flex rounded-full border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--atlas-muted)]">
                            {String(tenant.appLifecycle || "LIVE").toUpperCase()}
                          </span>
                          <Badge kind="plan" value={tenant.plan || "FREE"} />
                          <Badge kind="status" value={tenant.status || "ACTIVE"} />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[1rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                              Owner
                            </div>
                            <div className="mt-2 break-all text-sm font-medium text-[var(--atlas-text-strong)]">
                              {tenant.ownerEmail || tenant.owner?.email || "-"}
                            </div>
                          </div>

                          <div className="rounded-[1rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                              Members
                            </div>
                            <div className="mt-2 text-sm font-medium text-[var(--atlas-text-strong)]">
                              {formatNumber(tenant.memberCount ?? tenant.membersCount ?? 0)}
                            </div>
                            <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                              Team limit {seatUsage.label}
                            </div>
                          </div>

                          <div className="rounded-[1rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                              Created
                            </div>
                            <div className="mt-2 text-sm font-medium text-[var(--atlas-text-strong)]">
                              {formatDateTime(tenant.createdAt)}
                            </div>
                          </div>

                          <div className="rounded-[1rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                              Last activity
                            </div>
                            <div className="mt-2 text-sm font-medium text-[var(--atlas-text-strong)]">
                              {formatDateTime(tenant.lastActivityAt || tenant.lastActivity)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
          </div>

          <div className="hidden xl:block">
            <Table
              columns={columns}
              data={tenants}
              loading={loading}
              tableClassName="min-w-[1540px] border-separate [border-spacing:0_12px] [&_thead_th]:border-y [&_thead_th]:border-[color:var(--atlas-border)] [&_thead_th]:bg-[color:var(--atlas-surface-strong)] [&_thead_th]:font-header [&_thead_th]:tracking-[0.18em] [&_thead_th]:first:rounded-l-[18px] [&_thead_th]:last:rounded-r-[18px] [&_tbody_td]:border-y [&_tbody_td]:border-[color:var(--atlas-border)] [&_tbody_td]:bg-[color:var(--atlas-surface-soft)]/85 [&_tbody_td]:backdrop-blur-xl [&_tbody_tr>td:first-child]:border-l [&_tbody_tr>td:last-child]:border-r [&_tbody_tr>td:first-child]:rounded-l-[20px] [&_tbody_tr>td:last-child]:rounded-r-[20px] [&_tbody_tr:hover>td]:border-violet-400/30 [&_tbody_tr:hover>td]:bg-[color:var(--atlas-surface-hover)]"
              wrapperClassName="border-0 bg-transparent shadow-none overflow-visible"
              scrollClassName="px-1 pb-1"
              headClassName="bg-transparent"
              bodyClassName="divide-y-0"
              rowKey={(tenant) => getTenantId(tenant)}
              onRowClick={(tenant) => selectTenant(getTenantId(tenant))}
              rowClassName="atlas-premium-row"
              renderRow={(tenant) => {
                const tenantId = getTenantId(tenant);
                const seatUsage = getSeatUsageSummary(tenant);
                const isSelected = tenantId === selectedTenantId;
                const cellAccentClass = isSelected
                  ? "border-violet-400/55 bg-[color:var(--atlas-surface-hover)]"
                  : "";

                return (
                  <>
                    <td className={`px-4 py-3 ${cellAccentClass}`}>
                      <div className="font-semibold text-[var(--atlas-text-strong)]">
                        {tenant.name || "-"}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-[var(--atlas-muted)]">
                        {isSelected ? (
                          <span className="inline-flex h-2 w-2 rounded-full bg-violet-400" aria-hidden="true" />
                        ) : null}
                        <span>{tenant.slug || "-"}</span>
                      </div>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 text-[var(--atlas-text)] ${cellAccentClass}`}>
                      <div className="font-medium text-[var(--atlas-text-strong)]">
                        {tenant.appName || "KFarms"}
                      </div>
                      <div className="text-xs text-[var(--atlas-muted)]">
                        {String(tenant.appLifecycle || "LIVE").toUpperCase()}
                      </div>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 ${cellAccentClass}`}>
                      <Badge kind="plan" value={tenant.plan || "FREE"} />
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 ${cellAccentClass}`}>
                      <Badge kind="status" value={tenant.status || "ACTIVE"} />
                    </td>
                    <td className={`max-w-[280px] px-4 py-3 text-[var(--atlas-muted)] ${cellAccentClass}`}>
                      <div className="truncate" title={tenant.ownerEmail || tenant.owner?.email || "-"}>
                        {tenant.ownerEmail || tenant.owner?.email || "-"}
                      </div>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 text-[var(--atlas-muted)] ${cellAccentClass}`}>
                      <div>{formatNumber(tenant.memberCount ?? tenant.membersCount ?? 0)}</div>
                      <div className="text-xs text-[var(--atlas-muted-soft)]">
                        Team limit {seatUsage.label}
                      </div>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 text-[var(--atlas-muted)] ${cellAccentClass}`}>
                      {formatDateTime(tenant.createdAt)}
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 text-[var(--atlas-muted)] ${cellAccentClass}`}>
                      {formatDateTime(tenant.lastActivityAt || tenant.lastActivity)}
                    </td>
                    <td className={`px-4 py-3 text-right ${cellAccentClass}`}>
                      <Button
                        variant={isSelected ? "primary" : "outline"}
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          selectTenant(tenantId);
                        }}
                      >
                        {isSelected ? "Inspecting" : "Inspect"}
                      </Button>
                    </td>
                  </>
                );
              }}
              emptyTitle="No tenants found"
              emptyMessage="Try a wider search."
            />
          </div>

          {!loading && tenants.length === 0 && !error && (
            <EmptyState
              title="No tenants found"
              message="No workspaces match this filter."
            />
          )}

          <Card className="atlas-data-shell flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-[var(--atlas-muted)]">
              Page <span className="font-semibold text-[var(--atlas-text-strong)]">{page + 1}</span>
              {" "}of{" "}
              <span className="font-semibold text-[var(--atlas-text-strong)]">
                {Math.max(totalPages, 1)}
              </span>
              {" · "}
              {formatNumber(totalItems)} total
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              <label className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-[var(--atlas-muted)]">
                Size
                <select
                  value={size}
                  onChange={(event) => {
                    setSize(Number(event.target.value));
                    setPage(0);
                  }}
                  className="rounded-xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] px-3 py-1.5 text-sm text-[var(--atlas-text-strong)]"
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
                size="sm"
                className="min-w-[5.75rem]"
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={loading || page <= 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-w-[4.75rem]"
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

        <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <Card className="atlas-data-shell flex min-h-[34rem] flex-col overflow-hidden xl:max-h-[calc(100vh-8.5rem)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                  Tenant Inspection
                </div>
                <h2 className="mt-1 text-xl font-semibold text-[var(--atlas-text-strong)]">
                  {selectedTenantName}
                </h2>
                {selectedTenantId ? (
                  <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                    Review members, plan, and controls.
                  </div>
                ) : null}
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

            {selectedTenantId ? (
              <div className="mt-4 rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/72 p-1">
                <div className="grid grid-cols-2 gap-1">
                  <DetailTabButton
                    active={detailTab === "overview"}
                    label="Overview"
                    onClick={() => setDetailTab("overview")}
                  />
                  <DetailTabButton
                    active={detailTab === "members"}
                    label="Members"
                    count={memberRows.length}
                    onClick={() => setDetailTab("members")}
                  />
                </div>
              </div>
            ) : null}

            {!selectedTenantId && (
              <EmptyState
                title="Select a tenant"
                message="Pick a workspace to review members, plan, and modules."
              />
            )}

            {selectedTenantId && detailsLoading && (
              <div className="mt-4 flex-1 overflow-y-auto">
                <TenantDetailSkeleton />
              </div>
            )}

            {selectedTenantId && detailsError && (
              <div className="mt-4 rounded-md border border-violet-300/60 bg-violet-50 px-3 py-2 text-sm text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/20 dark:text-violet-100">
                {detailsError}
              </div>
            )}

            {selectedTenantId && !detailsLoading && !detailsError && selectedTenant && (
              <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-700 dark:border-indigo-400/50 dark:bg-indigo-500/20 dark:text-indigo-200">
                    {selectedTenant.appName || "KFarms"}
                  </span>
                  <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-700 dark:border-violet-400/50 dark:bg-violet-500/20 dark:text-violet-200">
                    {String(selectedTenant.appLifecycle || "LIVE").toUpperCase()}
                  </span>
                  <Badge kind="plan" value={selectedTenant.plan || "FREE"} />
                    <Badge kind="status" value={selectedTenant.status || "ACTIVE"} />
                </div>

                <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
                  {detailTab === "overview" ? (
                    <div className="space-y-4">
                      <div className="rounded-[1.25rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-4">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--atlas-muted)]">
                          <span className="font-semibold text-[var(--atlas-text-strong)]">
                            {selectedTenant.appName || "KFarms"}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{selectedTenant.slug || "No slug"}</span>
                          <span aria-hidden="true">·</span>
                          <span>{String(selectedTenant.appLifecycle || "LIVE").toUpperCase()}</span>
                        </div>

                        {selectedModuleOptions.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedModuleOptions.map((moduleOption) => (
                              <span
                                key={moduleOption.id}
                                className="inline-flex rounded-full border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--atlas-text-strong)]"
                              >
                                {moduleOption.shortLabel}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[1.2rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                            Owner
                          </div>
                          <div className="mt-2 break-all text-sm font-semibold leading-5 text-[var(--atlas-text-strong)]">
                            {selectedTenant.ownerEmail || "Not available"}
                          </div>
                          <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                            Created {formatDateTime(selectedTenant.createdAt)}
                          </div>
                        </div>

                        <div className="rounded-[1.2rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                                Team limit
                              </div>
                              <div className="mt-2 text-sm font-semibold text-[var(--atlas-text-strong)]">
                                {selectedSeatUsage.label} in use
                              </div>
                              <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                                {selectedSeatUsage.hasFiniteLimit
                                  ? `${formatPercentLabel(selectedSeatUsage.usageRatio, 0)} of team limit used`
                                  : "No team limit on this plan"}
                              </div>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${seatHealthClasses}`}>
                              {seatHealthLabel}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-[1.2rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                            Members
                          </div>
                          <div className="mt-2 text-2xl font-semibold leading-none text-[var(--atlas-text-strong)]">
                            {formatNumber(selectedTenant.memberCount ?? memberRows.length)}
                          </div>
                          <div className="mt-2 text-xs text-[var(--atlas-muted)]">
                            Active people inside this workspace.
                          </div>
                        </div>

                        <div className="rounded-[1.2rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                            Last activity
                          </div>
                          <div className="mt-2 text-sm font-semibold text-[var(--atlas-text-strong)]">
                            {formatDateTime(selectedTenant.lastActivityAt)}
                          </div>
                          <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                            Most recent tenant activity timestamp.
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[1.25rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-4">
                        <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                          Admin controls
                        </div>
                        <div className="mt-1 text-xs text-[var(--atlas-muted)]">
                          Update plan and status without leaving tenant inspection.
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <label className="space-y-2 text-sm text-[var(--atlas-muted)]">
                            <span>Plan</span>
                            <select
                              value={planDraft}
                              onChange={(event) => setPlanDraft(event.target.value)}
                              className="h-11 w-full rounded-xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] px-3 text-sm text-[var(--atlas-text-strong)] outline-none"
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
                              className="h-11 w-full rounded-xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] px-3 text-sm text-[var(--atlas-text-strong)] outline-none"
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
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[1.1rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                            Total members
                          </div>
                          <div className="mt-2 text-2xl font-semibold leading-none text-[var(--atlas-text-strong)]">
                            {formatNumber(memberRows.length)}
                          </div>
                        </div>
                        <div className="rounded-[1.1rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                            Enabled
                          </div>
                          <div className="mt-2 text-2xl font-semibold leading-none text-[var(--atlas-text-strong)]">
                            {formatNumber(enabledMemberCount)}
                          </div>
                        </div>
                        <div className="rounded-[1.1rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                            Disabled
                          </div>
                          <div className="mt-2 text-2xl font-semibold leading-none text-[var(--atlas-text-strong)]">
                            {formatNumber(disabledMemberCount)}
                          </div>
                        </div>
                      </div>

                      <label className="relative block">
                        <Search
                          size={15}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--atlas-muted)]"
                        />
                        <input
                          type="text"
                          value={memberSearchInput}
                          onChange={(event) => setMemberSearchInput(event.target.value)}
                          placeholder="Search member name, email, or role"
                          className="h-11 w-full rounded-xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] pl-9 pr-3 text-sm text-[var(--atlas-text-strong)] outline-none placeholder:text-[var(--atlas-muted-soft)] focus:border-violet-400/50"
                        />
                      </label>

                      {memberRows.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[color:var(--atlas-border-strong)] px-3 py-5 text-center text-sm text-[var(--atlas-muted)]">
                          No member records were returned for this tenant yet.
                        </div>
                      ) : filteredMemberRows.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[color:var(--atlas-border-strong)] px-3 py-5 text-center text-sm text-[var(--atlas-muted)]">
                          No members match the current search.
                        </div>
                      ) : (
                        <div className="rounded-[1.2rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/55 p-2">
                          <div className="mb-2 flex items-center justify-between gap-3 px-2 py-1 text-xs text-[var(--atlas-muted)]">
                            <span>Tenant members</span>
                            <span>{formatNumber(filteredMemberRows.length)} shown</span>
                          </div>
                          <div className="max-h-[25rem] space-y-2 overflow-y-auto pr-1">
                            {filteredMemberRows.map((member) => (
                              <div
                                key={member.id}
                                className="rounded-[1rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface)]/78 px-3 py-3"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="break-words text-sm font-semibold text-[var(--atlas-text-strong)]">
                                      {member.fullName || member.email || "Member"}
                                    </div>
                                    <div className="mt-1 break-all text-xs text-[var(--atlas-muted)]">
                                      {member.email || "No email"}
                                    </div>
                                  </div>
                                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                                    <span
                                      className={`inline-flex min-h-[1.9rem] items-center rounded-full border px-3 py-1 text-[11px] font-semibold leading-none ${getTenantMemberRolePillClass(member.role)}`}
                                    >
                                      {getWorkspaceRoleLabel(member.role || "STAFF")}
                                    </span>
                                    <span
                                      className={`inline-flex min-h-[1.9rem] items-center rounded-full border px-3 py-1 text-[11px] font-semibold leading-none ${getTenantMemberStatusPillClass(member.active)}`}
                                    >
                                      {member.active ? "ENABLED" : "DISABLED"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

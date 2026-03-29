import React from "react";
import {
  Activity,
  BellRing,
  Mail,
  RefreshCw,
  Save,
  Search,
  Shield,
  ShieldCheck,
  Users as UsersIcon,
} from "lucide-react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import Card from "../../components/Card";
import Table from "../../components/Table";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import ConfirmDialog from "../../components/ConfirmDialog";
import EmptyState from "../../components/EmptyState";
import PlatformMetricCard from "../../components/PlatformMetricCard";
import { usePlatformAuth } from "../../auth/AuthProvider";
import { useToast } from "../../components/ToastProvider";
import { PLATFORM_ENDPOINTS, cleanQueryParams } from "../../api/endpoints";
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
import {
  canAssignPlatformFunction,
  canManagePlatformAvailability,
  canManagePlatformRole,
  comparePlatformUsersByAuthority,
  filterPlatformUsers,
  getUserId,
  resolvePlatformAccessTier,
  resolvePlatformUserEnabled,
} from "./platformInsights";
import { buildPlatformDemoSnapshot } from "./platformWorkbench";
import {
  ROOTS_FUNCTION_OPTIONS,
  assignRootsFunction,
  getRootsFunctionLabel,
  getRootsFunctionMeta,
  readStoredRootsUserFunctions,
  resolveRootsFunction,
  writeStoredRootsUserFunctions,
} from "../../utils/rootsUserFunctions";
import { getPlatformRoleLabel } from "../../utils/platformRoles";

function UserDetailSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`user-detail-skeleton-${index}`}
          className="h-24 rounded-xl bg-[color:var(--atlas-surface-soft)]"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function RootsFunctionBadge({ value }) {
  const meta = getRootsFunctionMeta(value);

  if (!meta) {
    return (
      <span className="inline-flex rounded-full border border-dashed border-[color:var(--atlas-border-strong)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--atlas-muted)]">
        Unassigned
      </span>
    );
  }

  return (
    <span className="atlas-premium-badge" data-tone={meta.tone}>
      {meta.label}
    </span>
  );
}

const DEFAULT_FUNCTION_EXPERIENCE = Object.freeze({
  label: "Unassigned",
  summary: "Assign a function to sharpen ownership.",
  focusAreas: ["Claim an ownership lane", "Match work to role", "Cut overlap"],
  notificationTopics: [
    "No alert lane yet",
    "Escalations stay manual",
    "Assign a function to shape alerts",
  ],
});

const PLATFORM_USERS_FETCH_SIZE = 1000;

function filterDemoUsers(users, search = "") {
  const query = String(search || "").trim().toLowerCase();
  const rankedUsers = filterPlatformUsers(users).sort(comparePlatformUsersByAuthority);

  if (!query) return rankedUsers;

  return rankedUsers.filter((user) => {
    const haystack = [user?.username, user?.email, user?.displayName]
      .map((value) => String(value || "").toLowerCase())
      .join(" ");

    return haystack.includes(query);
  });
}

export default function PlatformUsersPage() {
  const { user: currentPlatformUser } = usePlatformAuth();
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

  const [searchInput, setSearchInput] = React.useState(() => searchParamValue);
  const [search, setSearch] = React.useState(() => searchParamValue);
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [users, setUsers] = React.useState([]);
  const [selectedUserId, setSelectedUserId] = React.useState(null);
  const [rootsFunctionAssignments, setRootsFunctionAssignments] = React.useState(() =>
    readStoredRootsUserFunctions(),
  );
  const [rootsFunctionDraft, setRootsFunctionDraft] = React.useState("");

  const [confirm, setConfirm] = React.useState({
    open: false,
    title: "",
    message: "",
    userId: null,
    type: "",
    value: false,
  });
  const [mutating, setMutating] = React.useState(false);

  const selectUser = React.useCallback((userId) => {
    React.startTransition(() => {
      setSelectedUserId(userId);
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

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    setError("");

    if (platformDataMode === "demo") {
      setUsers(filterDemoUsers(demoSnapshot.users, search));
      setLoading(false);
      return;
    }

    try {
      const params = cleanQueryParams({
        search,
        page: 0,
        size: PLATFORM_USERS_FETCH_SIZE,
        platformOnly: true,
      });
      const response = await platformAxios.get(PLATFORM_ENDPOINTS.users, { params });
      const payload = unwrapApiResponse(response.data, "Failed to load platform users");
      const normalized = normalizePagination(payload, { page: 0, size: PLATFORM_USERS_FETCH_SIZE });
      const platformUsers = filterPlatformUsers(normalized.items).sort(
        comparePlatformUsersByAuthority,
      );

      setUsers(
        platformUsers.length === 0
          ? filterDemoUsers(demoSnapshot.users, search)
          : platformUsers,
      );
    } catch (fetchError) {
      setError(
        platformLimitedAccess ? "" : getApiErrorMessage(fetchError, "Failed to load users"),
      );
      setUsers(filterDemoUsers(demoSnapshot.users, search));
    } finally {
      setLoading(false);
    }
  }, [demoSnapshot.users, platformDataMode, platformLimitedAccess, search]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  React.useEffect(() => {
    writeStoredRootsUserFunctions(rootsFunctionAssignments);
  }, [rootsFunctionAssignments]);

  const totalItems = users.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(size, 1)));
  const visibleUsers = React.useMemo(
    () => users.slice(page * size, page * size + size),
    [page, size, users],
  );

  React.useEffect(() => {
    if (page <= totalPages - 1) return;
    setPage(Math.max(totalPages - 1, 0));
  }, [page, totalPages]);

  React.useEffect(() => {
    if (visibleUsers.length === 0) {
      setSelectedUserId(null);
      return;
    }

    const selectionExists = visibleUsers.some(
      (user) => String(getUserId(user)) === String(selectedUserId),
    );

    if (!selectionExists) {
      setSelectedUserId(getUserId(visibleUsers[0]));
    }
  }, [selectedUserId, visibleUsers]);

  const enabledUsersOnPage = React.useMemo(
    () => visibleUsers.filter((user) => resolvePlatformUserEnabled(user)).length,
    [visibleUsers],
  );

  const platformAdminsOnPage = React.useMemo(
    () => visibleUsers.filter((user) => resolvePlatformAccessTier(user) === "PLATFORM_ADMIN").length,
    [visibleUsers],
  );

  const selectedUser = React.useMemo(
    () => visibleUsers.find((user) => String(getUserId(user)) === String(selectedUserId)) || null,
    [selectedUserId, visibleUsers],
  );

  const selectedAccessTier = React.useMemo(
    () => resolvePlatformAccessTier(selectedUser || {}),
    [selectedUser],
  );

  const selectedEnabled = React.useMemo(
    () => resolvePlatformUserEnabled(selectedUser || {}),
    [selectedUser],
  );
  const currentAccessTier = React.useMemo(
    () => resolvePlatformAccessTier(currentPlatformUser || {}),
    [currentPlatformUser],
  );

  const selectedTenantCount = React.useMemo(
    () => Number(selectedUser?.tenantCount ?? selectedUser?.tenantsCount ?? 0),
    [selectedUser],
  );

  const selectedCreatedAt = selectedUser?.createdAt
    ? formatDateTime(selectedUser.createdAt)
    : "Not available";

  const selectedUpdatedAt = selectedUser?.updatedAt
    ? formatDateTime(selectedUser.updatedAt)
    : "No update timestamp";

  const selectedDisplayName =
    selectedUser?.username || selectedUser?.email || "Select a ROOTS operator";
  const selectedRootsFunction = React.useMemo(
    () => resolveRootsFunction(selectedUser, rootsFunctionAssignments),
    [rootsFunctionAssignments, selectedUser],
  );
  const previewRootsFunctionMeta = React.useMemo(
    () => getRootsFunctionMeta(rootsFunctionDraft || selectedRootsFunction),
    [rootsFunctionDraft, selectedRootsFunction],
  );
  const functionExperience = previewRootsFunctionMeta || DEFAULT_FUNCTION_EXPERIENCE;

  React.useEffect(() => {
    setRootsFunctionDraft(selectedRootsFunction);
  }, [selectedRootsFunction]);

  const isCurrentPlatformUser = React.useCallback(
    (user) => Number(getUserId(user)) === Number(currentPlatformUser?.id),
    [currentPlatformUser?.id],
  );

  const describeAccessRestriction = React.useCallback(
    (targetUser) => {
      if (isCurrentPlatformUser(targetUser)) {
        return "Current session cannot edit itself.";
      }

      const targetLabel = getPlatformRoleLabel(resolvePlatformAccessTier(targetUser));

      if (currentAccessTier === "PLATFORM_ADMIN") {
        return "ROOTS Admin can only manage ROOTS Ops and lower lanes here.";
      }

      if (currentAccessTier === "PLATFORM_STAFF") {
        return `ROOTS Ops can review this account but cannot change ${targetLabel} access.`;
      }

      return `${targetLabel} changes are restricted in this view.`;
    },
    [currentAccessTier, isCurrentPlatformUser],
  );

  const describeFunctionRestriction = React.useCallback(
    (targetUser) => {
      if (currentAccessTier === "PLATFORM_STAFF") {
        return canAssignPlatformFunction(currentPlatformUser, targetUser)
          ? "ROOTS Ops can assign functions within ops lanes."
          : "ROOTS Ops cannot assign functions to ROOTS Prime or ROOTS Admin.";
      }

      if (currentAccessTier === "PLATFORM_ADMIN") {
        return "ROOTS Admin can assign functions below the admin lane.";
      }

      if (currentAccessTier === "PLATFORM_OWNER") {
        return "ROOTS Prime can assign functions across the platform.";
      }

      return "This ROOTS lane cannot assign operator functions.";
    },
    [currentAccessTier, currentPlatformUser],
  );

  const assignedFunctionsOnPage = React.useMemo(
    () =>
      visibleUsers.filter((user) => Boolean(resolveRootsFunction(user, rootsFunctionAssignments)))
        .length,
    [rootsFunctionAssignments, visibleUsers],
  );

  const activeFunctionCount = React.useMemo(
    () =>
      new Set(
        visibleUsers
          .map((user) => resolveRootsFunction(user, rootsFunctionAssignments))
          .filter(Boolean),
      ).size,
    [rootsFunctionAssignments, visibleUsers],
  );

  const askToggleAdmin = (user) => {
    if (isCurrentPlatformUser(user)) {
      notify("Use another ROOTS admin account to change your own platform role.", "info");
      return;
    }

    if (!canManagePlatformRole(currentPlatformUser, user)) {
      notify(describeAccessRestriction(user), "info");
      return;
    }

    const userId = getUserId(user);
    const current = resolvePlatformAccessTier(user) === "PLATFORM_ADMIN";

    setConfirm({
      open: true,
      title: current ? "Remove ROOTS admin access" : "Promote to ROOTS admin",
      message: current
        ? "This user will lose ROOTS admin permissions. Continue?"
        : "Grant ROOTS admin permissions to this user?",
      userId,
      type: "admin",
      value: !current,
    });
  };

  const askToggleEnabled = (user) => {
    if (isCurrentPlatformUser(user)) {
      notify("Use another ROOTS admin account to change your own sign-in access.", "info");
      return;
    }

    if (!canManagePlatformAvailability(currentPlatformUser, user)) {
      notify(describeAccessRestriction(user), "info");
      return;
    }

    const userId = getUserId(user);
    const current = resolvePlatformUserEnabled(user);

    setConfirm({
      open: true,
      title: current ? "Disable user" : "Enable user",
      message: current ? "Disable this user account?" : "Enable this user account?",
      userId,
      type: "enabled",
      value: !current,
    });
  };

  const executeConfirm = async () => {
    if (!confirm.userId || !confirm.type) return;
    if (platformDataMode === "demo") {
      setConfirm({ open: false, title: "", message: "", userId: null, type: "", value: false });
      notify("Demo preview is read-only for ROOTS access changes.", "info");
      return;
    }

    setMutating(true);
    try {
      if (confirm.type === "admin") {
        const response = await platformAxios.patch(
          PLATFORM_ENDPOINTS.userPlatformAdmin(confirm.userId),
          null,
          {
            params: { value: Boolean(confirm.value) },
          },
        );
        unwrapApiResponse(response.data, "Failed to update ROOTS admin role");
        notify("ROOTS access updated", "success");
      }

      if (confirm.type === "enabled") {
        const response = await platformAxios.patch(
          PLATFORM_ENDPOINTS.userEnabled(confirm.userId),
          null,
          {
            params: { value: Boolean(confirm.value) },
          },
        );
        unwrapApiResponse(response.data, "Failed to update user status");
        notify("User status updated", "success");
      }

      setConfirm({ open: false, title: "", message: "", userId: null, type: "", value: false });
      await fetchUsers();
    } catch (mutationError) {
      notify(getApiErrorMessage(mutationError, "Failed to update user"), "error");
    } finally {
      setMutating(false);
    }
  };

  const saveRootsFunction = React.useCallback(() => {
    if (!selectedUser || !rootsFunctionDraft) return;
    if (!canAssignPlatformFunction(currentPlatformUser, selectedUser)) {
      notify(describeFunctionRestriction(selectedUser), "info");
      return;
    }

    const nextAssignments = assignRootsFunction(
      selectedUser,
      rootsFunctionDraft,
      rootsFunctionAssignments,
    );
    setRootsFunctionAssignments(nextAssignments);
    notify(
      `${getRootsFunctionLabel(rootsFunctionDraft)} assigned to ${selectedDisplayName}.`,
      "success",
    );
  }, [
    currentPlatformUser,
    describeFunctionRestriction,
    notify,
    rootsFunctionAssignments,
    rootsFunctionDraft,
    selectedDisplayName,
    selectedUser,
  ]);

  const columns = [
    { key: "username", label: "User", className: "min-w-[220px]" },
    { key: "rootsFunction", label: "Function", className: "min-w-[150px]" },
    { key: "role", label: "ROOTS Tier", className: "min-w-[180px]" },
    { key: "active", label: "Status", className: "min-w-[140px]" },
    { key: "tenantCount", label: "Tenants", className: "min-w-[110px]" },
    { key: "email", label: "Email", className: "min-w-[260px]" },
    { key: "actions", label: "Actions", className: "min-w-[230px] text-right", align: "right" },
  ];

  return (
    <div className="space-y-4">
      <Card className="atlas-stage-card p-5">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="atlas-signal-chip w-fit">
              <UsersIcon size={12} />
              ROOTS Access
            </div>
            <h1 className="mt-5 font-header text-3xl font-semibold leading-tight text-[var(--atlas-text-strong)] md:text-[2.35rem]">
              Steer who carries ROOTS forward.
            </h1>
            <div className="mt-3 text-sm leading-7 text-[var(--atlas-muted)]">
              Keep roles, reach, and sign-in clean across the network.
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={fetchUsers}>
            <RefreshCw size={14} />
            Refresh
          </Button>
        </div>
      </Card>

      <div className="atlas-platform-metric-grid-compact">
        <PlatformMetricCard
          icon={UsersIcon}
          label="ROOTS Users"
          value={formatNumber(totalItems)}
          hint="Users in view."
          tone="purple"
        />
        <PlatformMetricCard
          icon={ShieldCheck}
          label="Enabled On Page"
          value={formatNumber(enabledUsersOnPage)}
          hint="Can sign in now."
          tone="green"
        />
        <PlatformMetricCard
          icon={Shield}
          label="ROOTS Admins"
          value={formatNumber(platformAdminsOnPage)}
          hint="Admins in view."
          tone="blue"
        />
        <PlatformMetricCard
          icon={Activity}
          label="Assigned Functions"
          value={formatNumber(assignedFunctionsOnPage)}
          hint={`${formatNumber(activeFunctionCount)} function lane${activeFunctionCount === 1 ? "" : "s"} in view.`}
          tone="blue"
        />
      </div>

      {error ? (
        <div className="rounded-md border border-violet-300/60 bg-violet-50 px-3 py-2 text-sm text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/20 dark:text-violet-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.72fr)_minmax(340px,0.98fr)]">
        <div className="space-y-4">
          <Card className="atlas-data-shell">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <label className="relative block">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--atlas-muted)]"
                />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search username or email"
                  className="h-11 w-full rounded-xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] pl-9 pr-3 text-sm text-[var(--atlas-text-strong)] outline-none placeholder:text-[var(--atlas-muted-soft)] focus:border-violet-400/50"
                />
              </label>

              <Button
                variant="outline"
                className="w-full md:w-auto"
                onClick={fetchUsers}
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Refresh
              </Button>
            </div>
          </Card>

          <div className="space-y-3 xl:hidden">
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <Card
                    key={`platform-user-mobile-skeleton-${index}`}
                    className="atlas-data-shell space-y-4 p-4"
                  >
                    <div
                      className="h-5 w-1/2 rounded-full bg-[color:var(--atlas-surface-strong)]"
                      aria-hidden="true"
                    />
                    <div
                      className="h-3 w-2/3 rounded-full bg-[color:var(--atlas-surface-strong)]"
                      aria-hidden="true"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className="h-20 rounded-[1rem] bg-[color:var(--atlas-surface-soft)]"
                        aria-hidden="true"
                      />
                      <div
                        className="h-20 rounded-[1rem] bg-[color:var(--atlas-surface-soft)]"
                        aria-hidden="true"
                      />
                    </div>
                  </Card>
                ))
              : visibleUsers.map((user) => {
                  const userId = getUserId(user);
                  const accessTier = resolvePlatformAccessTier(user);
                  const active = resolvePlatformUserEnabled(user);
                  const selfRow = isCurrentPlatformUser(user);
                  const canManageUserAccess = canManagePlatformRole(currentPlatformUser, user);
                  const isSelected = String(userId) === String(selectedUserId);

                  return (
                    <Card
                      key={userId}
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
                        onClick={() => selectUser(userId)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            selectUser(userId);
                          }
                        }}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="truncate text-base font-semibold text-[var(--atlas-text-strong)]">
                              {user.username || user.email || "User"}
                            </div>
                            <div className="mt-1 break-words text-xs text-[var(--atlas-muted)]">
                              {user.email || "No email"}
                            </div>
                          </div>
                          <Button
                            variant={isSelected ? "primary" : "outline"}
                            size="sm"
                            className="w-full shrink-0 sm:w-auto sm:min-w-[7rem]"
                            onClick={(event) => {
                              event.stopPropagation();
                              selectUser(userId);
                            }}
                          >
                            {isSelected ? "Selected" : "Select"}
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <RootsFunctionBadge
                            value={resolveRootsFunction(user, rootsFunctionAssignments)}
                          />
                          <Badge kind="platform-role" value={accessTier} />
                          <Badge kind="active" value={active ? "ENABLED" : "DISABLED"} />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[1rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                              Tenant reach
                            </div>
                            <div className="mt-2 text-sm font-medium text-[var(--atlas-text-strong)]">
                              {formatNumber(user.tenantCount ?? user.tenantsCount ?? 0)}
                            </div>
                          </div>

                          <div className="rounded-[1rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-3">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                              Created
                            </div>
                            <div className="mt-2 text-sm font-medium text-[var(--atlas-text-strong)]">
                              {formatDateTime(user.createdAt)}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:flex-1"
                            disabled={selfRow || !canManageUserAccess}
                            onClick={(event) => {
                              event.stopPropagation();
                              askToggleAdmin(user);
                            }}
                          >
                            {accessTier === "PLATFORM_ADMIN" ? "Demote" : "Promote"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:flex-1"
                            disabled={selfRow || !canManageUserAccess}
                            onClick={(event) => {
                              event.stopPropagation();
                              askToggleEnabled(user);
                            }}
                          >
                            {active ? "Disable" : "Enable"}
                          </Button>
                        </div>

                        {selfRow || !canManageUserAccess ? (
                          <div className="text-xs text-[var(--atlas-muted)]">
                            {selfRow ? "Current session cannot edit itself." : describeAccessRestriction(user)}
                          </div>
                        ) : null}
                      </div>
                    </Card>
                  );
                })}
          </div>

          <div className="hidden xl:block">
              <Table
              columns={columns}
              data={visibleUsers}
              loading={loading}
              tableClassName="min-w-[1380px] border-separate [border-spacing:0_12px] [&_thead_th]:border-y [&_thead_th]:border-[color:var(--atlas-border)] [&_thead_th]:bg-[color:var(--atlas-surface-strong)] [&_thead_th]:font-header [&_thead_th]:tracking-[0.18em] [&_thead_th]:first:rounded-l-[18px] [&_thead_th]:last:rounded-r-[18px] [&_tbody_td]:border-y [&_tbody_td]:border-[color:var(--atlas-border)] [&_tbody_td]:bg-[color:var(--atlas-surface-soft)]/85 [&_tbody_td]:backdrop-blur-xl [&_tbody_tr>td:first-child]:border-l [&_tbody_tr>td:last-child]:border-r [&_tbody_tr>td:first-child]:rounded-l-[20px] [&_tbody_tr>td:last-child]:rounded-r-[20px] [&_tbody_tr:hover>td]:border-violet-400/30 [&_tbody_tr:hover>td]:bg-[color:var(--atlas-surface-hover)]"
              wrapperClassName="border-0 bg-transparent shadow-none overflow-visible"
              scrollClassName="px-1 pb-1"
              headClassName="bg-transparent"
              bodyClassName="divide-y-0"
              rowClassName="atlas-premium-row"
              rowKey={(user) => getUserId(user)}
              onRowClick={(user) => selectUser(getUserId(user))}
              renderRow={(user) => {
                const accessTier = resolvePlatformAccessTier(user);
                const active = resolvePlatformUserEnabled(user);
                const selfRow = isCurrentPlatformUser(user);
                const canManageUserAccess = canManagePlatformRole(currentPlatformUser, user);
                const isSelected = String(getUserId(user)) === String(selectedUserId);
                const cellAccentClass = isSelected
                  ? "border-violet-400/55 bg-[color:var(--atlas-surface-hover)]"
                  : "";

                return (
                  <>
                    <td className={`px-4 py-3 ${cellAccentClass}`}>
                      <div className="font-semibold text-[var(--atlas-text-strong)]">
                        {user.username || user.email || "User"}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-[var(--atlas-muted)]">
                        {isSelected ? (
                          <span
                            className="inline-flex h-2 w-2 rounded-full bg-violet-400"
                            aria-hidden="true"
                          />
                        ) : null}
                        <span className="truncate">{user.email || "No email"}</span>
                      </div>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 ${cellAccentClass}`}>
                      <RootsFunctionBadge
                        value={resolveRootsFunction(user, rootsFunctionAssignments)}
                      />
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 ${cellAccentClass}`}>
                      <Badge kind="platform-role" value={accessTier} />
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 ${cellAccentClass}`}>
                      <Badge kind="active" value={active ? "ENABLED" : "DISABLED"} />
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 text-[var(--atlas-muted)] ${cellAccentClass}`}>
                      {formatNumber(user.tenantCount ?? user.tenantsCount ?? 0)}
                    </td>
                    <td className={`max-w-[280px] px-4 py-3 text-[var(--atlas-muted)] ${cellAccentClass}`}>
                      <div className="truncate" title={user.email || "-"}>
                        {user.email || "-"}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right ${cellAccentClass}`}>
                      <div className="flex flex-col items-stretch gap-2 2xl:flex-row 2xl:justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full 2xl:w-auto"
                          disabled={selfRow || !canManageUserAccess}
                          onClick={(event) => {
                            event.stopPropagation();
                            askToggleAdmin(user);
                          }}
                        >
                          {accessTier === "PLATFORM_ADMIN" ? "Demote" : "Promote"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full 2xl:w-auto"
                          disabled={selfRow || !canManageUserAccess}
                          onClick={(event) => {
                            event.stopPropagation();
                            askToggleEnabled(user);
                          }}
                        >
                          {active ? "Disable" : "Enable"}
                        </Button>
                      </div>
                      {selfRow || !canManageUserAccess ? (
                        <div className="mt-2 text-right text-xs text-[var(--atlas-muted)]">
                          {selfRow ? "Current session" : "Restricted"}
                        </div>
                      ) : null}
                    </td>
                  </>
                );
              }}
              emptyTitle="No operators found"
              emptyMessage="Try a different search."
            />
          </div>

          {!loading && visibleUsers.length === 0 && !error ? (
            <EmptyState
              title="No users found"
              message="No users match this filter."
            />
          ) : null}

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
                className="min-w-[6rem]"
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={loading || page <= 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-w-[5rem]"
                onClick={() => setPage((prev) => Math.min(Math.max(totalPages - 1, 0), prev + 1))}
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
                  ROOTS Access Card
                </div>
                <h2 className="mt-1 text-xl font-semibold text-[var(--atlas-text-strong)]">
                  {selectedDisplayName}
                </h2>
                {selectedUser ? (
                  <div className="mt-1 break-all text-xs text-[var(--atlas-muted)]">
                    {selectedUser.email || "No email on record"}
                  </div>
                ) : null}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={fetchUsers}
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Reload
              </Button>
            </div>

            {!selectedUser && !loading ? (
              <div className="mt-4">
                <EmptyState
                  title="Select a ROOTS operator"
                  message="Pick a user to review access and actions."
                />
              </div>
            ) : null}

            {loading ? (
              <div className="mt-4 flex-1 overflow-y-auto">
                <UserDetailSkeleton />
              </div>
            ) : null}

            {selectedUser && !loading ? (
              <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex flex-wrap gap-2">
                  <RootsFunctionBadge value={selectedRootsFunction} />
                  <Badge kind="platform-role" value={selectedAccessTier} />
                  <Badge kind="active" value={selectedEnabled ? "ENABLED" : "DISABLED"} />
                  {isCurrentPlatformUser(selectedUser) ? (
                    <span className="inline-flex rounded-full border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--atlas-text-strong)]">
                      Current session
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-4">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                        <Mail size={13} />
                        Email
                      </div>
                      <div className="mt-3 break-all text-sm font-semibold text-[var(--atlas-text-strong)]">
                        {selectedUser.email || "No email on record"}
                      </div>
                    </div>

                    <div className="rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-4">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                        Tenant reach
                      </div>
                      <div className="mt-3 text-2xl font-semibold leading-none text-[var(--atlas-text-strong)]">
                        {formatNumber(selectedTenantCount)}
                      </div>
                      <div className="mt-2 text-xs text-[var(--atlas-muted)]">
                        Workspaces currently connected to this operator.
                      </div>
                    </div>

                    <div className="rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-4">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                        Created
                      </div>
                      <div className="mt-3 text-sm font-semibold text-[var(--atlas-text-strong)]">
                        {selectedCreatedAt}
                      </div>
                    </div>

                    <div className="rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-4">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                        Last change
                      </div>
                      <div className="mt-3 text-sm font-semibold text-[var(--atlas-text-strong)]">
                        {selectedUpdatedAt}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.2rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-4">
                    <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                      ROOTS function
                    </div>
                    <div className="mt-1 text-xs leading-6 text-[var(--atlas-muted)]">
                      Assign the operator's working lane separately from their access tier. This is
                      stored locally now and is ready for future live sync.
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <label className="space-y-2 text-sm text-[var(--atlas-muted)]">
                        <span>Function lane</span>
                        <select
                          value={rootsFunctionDraft}
                          onChange={(event) => setRootsFunctionDraft(event.target.value)}
                          disabled={!canAssignPlatformFunction(currentPlatformUser, selectedUser)}
                          className="h-11 w-full rounded-xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] px-3 text-sm text-[var(--atlas-text-strong)] outline-none"
                        >
                          <option value="">Select ROOTS function</option>
                          {ROOTS_FUNCTION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <Button
                        variant="outline"
                        className="w-full sm:w-auto sm:self-end"
                        onClick={saveRootsFunction}
                        disabled={
                          !canAssignPlatformFunction(currentPlatformUser, selectedUser) ||
                          !rootsFunctionDraft ||
                          rootsFunctionDraft === selectedRootsFunction
                        }
                      >
                        <Save size={14} />
                        Save function
                      </Button>
                    </div>

                    <div className="mt-3 rounded-[1rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface)]/70 px-3 py-3 text-xs leading-6 text-[var(--atlas-muted)]">
                      {!canAssignPlatformFunction(currentPlatformUser, selectedUser)
                        ? describeFunctionRestriction(selectedUser)
                        : previewRootsFunctionMeta
                        ? previewRootsFunctionMeta.description
                        : "Pick a ROOTS function to clarify what this operator owns."}
                    </div>
                  </div>

                  <div className="rounded-[1.2rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                          Function fit
                        </div>
                        <div className="mt-1 text-xs leading-6 text-[var(--atlas-muted)]">
                          {functionExperience.summary}
                        </div>
                      </div>
                      {previewRootsFunctionMeta ? (
                        <RootsFunctionBadge value={previewRootsFunctionMeta.value} />
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-[1rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface)]/70 p-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                          Primary focus
                        </div>
                        <div className="mt-3 space-y-2">
                          {functionExperience.focusAreas.map((item) => (
                            <div
                              key={item}
                              className="rounded-[0.9rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/90 px-3 py-2 text-xs font-medium text-[var(--atlas-text-strong)]"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[1rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface)]/70 p-3">
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                          <BellRing size={13} />
                          Notification flow
                        </div>
                        <div className="mt-3 space-y-2">
                          {functionExperience.notificationTopics.map((item) => (
                            <div
                              key={item}
                              className="rounded-[0.9rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/90 px-3 py-2 text-xs font-medium text-[var(--atlas-text-strong)]"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.2rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/75 p-4">
                    <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                      Access controls
                    </div>
                    <div className="mt-1 text-xs leading-6 text-[var(--atlas-muted)]">
                      {isCurrentPlatformUser(selectedUser) ||
                      !canManagePlatformRole(currentPlatformUser, selectedUser)
                        ? describeAccessRestriction(selectedUser)
                        : "Adjust access safely without leaving the operator list."}
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <Button
                        variant="outline"
                        className="w-full sm:flex-1"
                        disabled={
                          isCurrentPlatformUser(selectedUser) ||
                          !canManagePlatformRole(currentPlatformUser, selectedUser)
                        }
                        onClick={() => askToggleAdmin(selectedUser)}
                      >
                        {selectedAccessTier === "PLATFORM_ADMIN"
                          ? "Remove ROOTS admin"
                          : "Promote to ROOTS admin"}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full sm:flex-1"
                        disabled={
                          isCurrentPlatformUser(selectedUser) ||
                          !canManagePlatformAvailability(currentPlatformUser, selectedUser)
                        }
                        onClick={() => askToggleEnabled(selectedUser)}
                      >
                        {selectedEnabled ? "Disable sign-in" : "Enable sign-in"}
                      </Button>
                    </div>
                  </div>

                  <Card className="atlas-data-shell">
                    <div className="text-sm leading-6 text-[var(--atlas-muted)]">
                      ROOTS safety is active here. Higher lanes manage lower lanes, and ROOTS Ops
                      cannot change ROOTS Prime or ROOTS Admin controls from this screen.
                    </div>
                  </Card>
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        loading={mutating}
        confirmLabel="Confirm"
        onCancel={() =>
          setConfirm({ open: false, title: "", message: "", userId: null, type: "", value: false })
        }
        onConfirm={executeConfirm}
      />
    </div>
  );
}

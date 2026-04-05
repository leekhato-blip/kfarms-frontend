import React from "react";
<<<<<<< HEAD
import {
  Activity,
  Copy,
  ExternalLink,
  Mail,
  RefreshCw,
  Save,
  Search,
  Shield,
  ShieldCheck,
  UserPlus,
  Users as UsersIcon,
} from "lucide-react";
import { useOutletContext, useSearchParams } from "react-router-dom";
=======
>>>>>>> 0babf4d (Update frontend application)
import Card from "../../components/Card";
import Table from "../../components/Table";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import ConfirmDialog from "../../components/ConfirmDialog";
import EmptyState from "../../components/EmptyState";
<<<<<<< HEAD
import PlatformMetricCard from "../../components/PlatformMetricCard";
import PlatformMobileSheet from "../../components/PlatformMobileSheet";
import {
  PlatformInspectSection,
  PlatformInspectStatCard,
} from "../../components/PlatformInspectPrimitives";
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
import { buildPlatformDemoSnapshot, buildPlatformLiveSnapshot } from "./platformWorkbench";
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
import PlatformUserModal from "./PlatformUserModal";

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

function buildPlatformInviteLink(token) {
  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) return "";

  const invitePath = `/platform/setup?token=${encodeURIComponent(normalizedToken)}`;
  if (typeof window === "undefined") return invitePath;

  return `${window.location.origin.replace(/\/+$/, "")}${invitePath}`;
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
  const liveSnapshot = React.useMemo(() => buildPlatformLiveSnapshot(), []);

  const [searchInput, setSearchInput] = React.useState(() => searchParamValue);
  const [search, setSearch] = React.useState(() => searchParamValue);
=======
import { useToast } from "../../components/ToastProvider";
import { PLATFORM_ENDPOINTS, cleanQueryParams } from "../../api/endpoints";
import { getApiErrorMessage, platformAxios, unwrapApiResponse } from "../../api/platformClient";
import { formatDateTime, formatNumber, normalizePagination } from "../../utils/formatters";

function getUserId(user) {
  return user?.userId ?? user?.id;
}

function getRole(user) {
  if (user?.role) return String(user.role).toUpperCase();
  return user?.platformAdmin ? "PLATFORM_ADMIN" : "USER";
}

function isEnabled(user) {
  if (typeof user?.enabled === "boolean") return user.enabled;
  if (typeof user?.active === "boolean") return user.active;
  return true;
}

export default function PlatformUsersPage() {
  const { notify } = useToast();

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
>>>>>>> 0babf4d (Update frontend application)
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [users, setUsers] = React.useState([]);
<<<<<<< HEAD
  const [selectedUserId, setSelectedUserId] = React.useState(null);
  const [rootsFunctionAssignments, setRootsFunctionAssignments] = React.useState(() =>
    readStoredRootsUserFunctions(),
  );
  const [rootsFunctionDraft, setRootsFunctionDraft] = React.useState("");
=======
  const [totalItems, setTotalItems] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
>>>>>>> 0babf4d (Update frontend application)

  const [confirm, setConfirm] = React.useState({
    open: false,
    title: "",
    message: "",
    userId: null,
    type: "",
    value: false,
  });
  const [mutating, setMutating] = React.useState(false);
<<<<<<< HEAD
  const [createUserOpen, setCreateUserOpen] = React.useState(false);
  const [creatingUser, setCreatingUser] = React.useState(false);
  const [latestInvite, setLatestInvite] = React.useState(null);
  const [mobileInspectOpen, setMobileInspectOpen] = React.useState(false);

  const selectUser = React.useCallback((userId) => {
    React.startTransition(() => {
      setSelectedUserId(userId);
    });
  }, []);
  const openMobileInspect = React.useCallback((userId) => {
    selectUser(userId);
    setMobileInspectOpen(true);
  }, [selectUser]);
=======
>>>>>>> 0babf4d (Update frontend application)

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 320);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

<<<<<<< HEAD
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

  const fetchUsers = React.useCallback(async ({ searchOverride } = {}) => {
    const activeSearch = typeof searchOverride === "string" ? searchOverride.trim() : search;

    setLoading(true);
    setError("");

    if (platformDataMode === "demo") {
      const demoUsers = filterDemoUsers(demoSnapshot.users, activeSearch);
      setUsers(demoUsers);
      setLoading(false);
      return demoUsers;
    }

    try {
      const params = cleanQueryParams({
        search: activeSearch,
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
      setUsers(platformUsers);
      return platformUsers;
    } catch (fetchError) {
      setError(
        platformLimitedAccess ? "" : getApiErrorMessage(fetchError, "Failed to load users"),
      );
      const fallbackUsers = filterPlatformUsers(liveSnapshot.users).sort(comparePlatformUsersByAuthority);
      setUsers(fallbackUsers);
      return fallbackUsers;
    } finally {
      setLoading(false);
    }
  }, [demoSnapshot.users, liveSnapshot.users, platformDataMode, platformLimitedAccess, search]);
=======
  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = cleanQueryParams({ search, page, size });
      const response = await platformAxios.get(PLATFORM_ENDPOINTS.users, { params });
      const payload = unwrapApiResponse(response.data, "Failed to load platform users");
      const normalized = normalizePagination(payload, { page, size });

      setUsers(normalized.items);
      setTotalItems(normalized.totalItems);
      setTotalPages(normalized.totalPages);
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, "Failed to load users"));
      setUsers([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search, size]);
>>>>>>> 0babf4d (Update frontend application)

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

<<<<<<< HEAD
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
  const canCreatePlatformUsers =
    currentAccessTier === "PLATFORM_OWNER" || currentAccessTier === "PLATFORM_ADMIN";

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

  React.useEffect(() => {
    if (!selectedUser && !loading) {
      setMobileInspectOpen(false);
    }
  }, [loading, selectedUser]);

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
=======
  const askToggleAdmin = (user) => {
    const userId = getUserId(user);
    const current = getRole(user) === "PLATFORM_ADMIN";

    setConfirm({
      open: true,
      title: current ? "Remove platform admin" : "Promote to platform admin",
      message: current
        ? "This user will lose platform admin permissions. Continue?"
        : "Grant platform admin permissions to this user?",
>>>>>>> 0babf4d (Update frontend application)
      userId,
      type: "admin",
      value: !current,
    });
  };

  const askToggleEnabled = (user) => {
<<<<<<< HEAD
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
=======
    const userId = getUserId(user);
    const current = isEnabled(user);
>>>>>>> 0babf4d (Update frontend application)

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
<<<<<<< HEAD
    if (platformDataMode === "demo") {
      setConfirm({ open: false, title: "", message: "", userId: null, type: "", value: false });
      notify("Demo preview is read-only for ROOTS access changes.", "info");
      return;
    }
=======
>>>>>>> 0babf4d (Update frontend application)

    setMutating(true);
    try {
      if (confirm.type === "admin") {
<<<<<<< HEAD
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
=======
        const response = await platformAxios.patch(PLATFORM_ENDPOINTS.userPlatformAdmin(confirm.userId), null, {
          params: { value: Boolean(confirm.value) },
        });
        unwrapApiResponse(response.data, "Failed to update platform admin role");
        notify("Platform role updated", "success");
      }

      if (confirm.type === "enabled") {
        const response = await platformAxios.patch(PLATFORM_ENDPOINTS.userEnabled(confirm.userId), null, {
          params: { value: Boolean(confirm.value) },
        });
>>>>>>> 0babf4d (Update frontend application)
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

<<<<<<< HEAD
  const handleCreatePlatformUser = React.useCallback(
    async (payload) => {
      if (platformDataMode === "demo") {
        notify("Demo preview is read-only for platform invites.", "info");
        return;
      }

      if (!canCreatePlatformUsers) {
        notify("This ROOTS lane cannot invite new platform users.", "info");
        return;
      }

      setCreatingUser(true);
      try {
        const response = await platformAxios.post(PLATFORM_ENDPOINTS.userInvites, payload);
        const invitePayload = unwrapApiResponse(response.data, "Failed to send platform invite");
        const inviteLink = buildPlatformInviteLink(invitePayload?.token);
        const nextInvite = {
          ...invitePayload,
          inviteLink,
        };

        setLatestInvite(nextInvite);
        setCreateUserOpen(false);

        let copied = false;
        if (inviteLink && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          try {
            await navigator.clipboard.writeText(inviteLink);
            copied = true;
          } catch {
            copied = false;
          }
        }

        notify(
          copied
            ? `${invitePayload?.email || "Platform invite"} is ready and the link is copied.`
            : `${invitePayload?.email || "Platform invite"} is ready.`,
          "success",
        );
      } catch (createError) {
        notify(getApiErrorMessage(createError, "Failed to send platform invite"), "error");
      } finally {
        setCreatingUser(false);
      }
    },
    [canCreatePlatformUsers, notify, platformDataMode],
  );

  const handleCopyInviteLink = React.useCallback(async () => {
    const inviteLink = String(latestInvite?.inviteLink || "").trim();
    if (!inviteLink) {
      notify("No invite link is ready yet.", "info");
      return;
    }

    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      notify("Copy is not available in this browser right now.", "info");
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      notify("Invite link copied.", "success");
    } catch {
      notify("Copy did not work here. Open the setup link directly instead.", "info");
    }
  }, [latestInvite?.inviteLink, notify]);

  const handleOpenInviteLink = React.useCallback(() => {
    const inviteLink = String(latestInvite?.inviteLink || "").trim();
    if (!inviteLink) {
      notify("No invite link is ready yet.", "info");
      return;
    }

    if (typeof window === "undefined") return;
    window.open(inviteLink, "_blank", "noopener,noreferrer");
  }, [latestInvite?.inviteLink, notify]);

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

  const renderSelectedUserInspectContent = () => {
    if (!selectedUser && !loading) {
      return (
        <div className="mt-4">
          <EmptyState
            title="Select a ROOTS operator"
            message="Pick a user to review access and actions."
          />
        </div>
      );
    }

    if (loading) {
      return (
        <div className="mt-4 flex-1 overflow-y-auto">
          <UserDetailSkeleton />
        </div>
      );
    }

    if (!selectedUser) return null;

    return (
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
          <PlatformInspectSection
            title="Profile"
          >
            <div className="sm:hidden">
              <div className="rounded-[1.08rem] border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface)]/58 p-2">
                <div className="space-y-2">
                  <div className="rounded-[0.96rem] border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-strong)]/30 px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                      Email address
                    </div>
                    <div className="mt-1 break-all text-sm font-semibold leading-5 text-[var(--atlas-text-strong)]">
                      {selectedUser.email || "No email on record"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-[0.96rem] border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-strong)]/30 px-3 py-3">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                        Workspaces
                      </div>
                      <div className="mt-1 text-lg font-semibold leading-none text-[var(--atlas-text-strong)]">
                        {formatNumber(selectedTenantCount)}
                      </div>
                    </div>

                    <div className="rounded-[0.96rem] border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-strong)]/30 px-3 py-3">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                        Created
                      </div>
                      <div className="mt-1 text-sm font-semibold leading-5 text-[var(--atlas-text-strong)]">
                        {selectedCreatedAt}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[0.96rem] border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-strong)]/30 px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                      Last updated
                    </div>
                    <div className="mt-1 text-sm font-semibold leading-5 text-[var(--atlas-text-strong)]">
                      {selectedUpdatedAt}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden gap-3 sm:grid sm:grid-cols-2">
              <PlatformInspectStatCard
                label="Email address"
                value={selectedUser.email || "No email on record"}
                valueClassName="break-all text-sm leading-5"
                badge={
                  <span className="rounded-full border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)] px-2.5 py-1 text-[11px] text-[var(--atlas-muted)]">
                    <Mail size={13} className="inline-block align-[-2px]" />
                  </span>
                }
              />
              <PlatformInspectStatCard
                label="Connected workspaces"
                value={formatNumber(selectedTenantCount)}
                valueClassName="text-[1.75rem] leading-none"
              />
              <PlatformInspectStatCard
                label="Created"
                value={selectedCreatedAt}
              />
              <PlatformInspectStatCard
                label="Last updated"
                value={selectedUpdatedAt}
              />
            </div>
          </PlatformInspectSection>

          <PlatformInspectSection
            title="Function"
          >
            <div className="sm:hidden space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[0.96rem] border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface)]/66 px-3 py-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                    Access level
                  </div>
                  <div className="mt-1 text-sm font-semibold leading-5 text-[var(--atlas-text-strong)]">
                    {getPlatformRoleLabel(selectedAccessTier)}
                  </div>
                </div>

                <div className="rounded-[0.96rem] border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface)]/66 px-3 py-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                    Function
                  </div>
                  <div className="mt-1 text-sm font-semibold leading-5 text-[var(--atlas-text-strong)]">
                    {getRootsFunctionLabel(selectedRootsFunction) || "Not assigned"}
                  </div>
                </div>
              </div>

              <div className="rounded-[0.96rem] border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface)]/66 px-3 py-3">
                <label className="space-y-2 text-sm text-[var(--atlas-muted)]">
                  <span>Choose a function lane</span>
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
                  className="mt-3 w-full"
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
            </div>

            <div className="hidden gap-3 sm:grid sm:grid-cols-2">
              <PlatformInspectStatCard
                label="Access level"
                value={getPlatformRoleLabel(selectedAccessTier)}
              />
              <PlatformInspectStatCard
                label="Current function"
                value={getRootsFunctionLabel(selectedRootsFunction) || "Not assigned yet"}
              />
            </div>

            <div className="mt-4 hidden gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="space-y-2 text-sm text-[var(--atlas-muted)]">
                <span>Choose a function lane</span>
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

            {!canAssignPlatformFunction(currentPlatformUser, selectedUser) ? (
              <div className="mt-3 rounded-[1rem] border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface)]/70 px-3 py-3 text-sm leading-6 text-[var(--atlas-muted)]">
                {describeFunctionRestriction(selectedUser)}
              </div>
            ) : null}
          </PlatformInspectSection>

          <PlatformInspectSection
            title="Focus"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[0.96rem] bg-[color:var(--atlas-surface)]/66 px-3.5 py-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                  Primary focus
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {functionExperience.focusAreas.map((item) => (
                    <div
                      key={item}
                      className="inline-flex rounded-full bg-[color:var(--atlas-surface-strong)]/40 px-3 py-2 text-xs font-medium text-[var(--atlas-text-strong)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[0.96rem] bg-[color:var(--atlas-surface)]/66 px-3.5 py-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                  Notification flow
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {functionExperience.notificationTopics.map((item) => (
                    <div
                      key={item}
                      className="inline-flex rounded-full bg-[color:var(--atlas-surface-strong)]/40 px-3 py-2 text-xs font-medium text-[var(--atlas-text-strong)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PlatformInspectSection>

          <PlatformInspectSection
            title="Access controls"
          >
            {isCurrentPlatformUser(selectedUser) ||
            !canManagePlatformRole(currentPlatformUser, selectedUser) ? (
              <div className="mb-3 text-sm leading-6 text-[var(--atlas-muted)]">
                {describeAccessRestriction(selectedUser)}
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[0.96rem] bg-[color:var(--atlas-surface)]/66 px-3.5 py-3">
                <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                  ROOTS admin access
                </div>
                <Button
                  variant="outline"
                  className="mt-3 w-full"
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
              </div>

              <div className="rounded-[0.96rem] bg-[color:var(--atlas-surface)]/66 px-3.5 py-3">
                <div className="text-sm font-semibold text-[var(--atlas-text-strong)]">
                  Sign-in access
                </div>
                <Button
                  variant="outline"
                  className="mt-3 w-full"
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
          </PlatformInspectSection>

          <div className="rounded-[1.05rem] border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface)]/64 px-4 py-3 text-sm leading-6 text-[var(--atlas-muted)]">
            Higher lanes can manage lower lanes.
          </div>
        </div>
      </div>
    );
  };

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
              ROOTS access control.
            </h1>
            <div className="mt-3 text-sm leading-7 text-[var(--atlas-muted)]">
              Manage roles, reach, and sign-in.
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {canCreatePlatformUsers ? (
              <Button
                variant="primary"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => setCreateUserOpen(true)}
              >
                <UserPlus size={14} />
                Invite user
              </Button>
            ) : null}
            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={fetchUsers}>
              <RefreshCw size={14} />
              Refresh
            </Button>
          </div>
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

      {latestInvite?.inviteLink ? (
        <Card className="atlas-data-shell border-emerald-400/25 bg-emerald-500/[0.06] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/85">
                Invite Ready
              </div>
              <div className="mt-2 text-base font-semibold text-[var(--atlas-text-strong)]">
                {latestInvite?.username || latestInvite?.email || "Platform user"} can finish setup now.
              </div>
              <div className="mt-1 text-sm leading-6 text-[var(--atlas-muted)]">
                Share this link with the teammate. The account goes live after they set a password.
              </div>
              <div className="mt-3 rounded-[1rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/80 px-3 py-3 text-xs leading-6 text-[var(--atlas-text)]">
                <div className="break-all">{latestInvite.inviteLink}</div>
                {latestInvite?.expiresAt ? (
                  <div className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[var(--atlas-muted)]">
                    Expires {formatDateTime(latestInvite.expiresAt)}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:w-auto lg:flex-col">
              <Button variant="primary" size="sm" className="w-full sm:w-auto" onClick={handleCopyInviteLink}>
                <Copy size={14} />
                Copy link
              </Button>
              <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={handleOpenInviteLink}>
                <ExternalLink size={14} />
                Open setup
              </Button>
            </div>
          </div>
        </Card>
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
                        onClick={() => openMobileInspect(userId)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openMobileInspect(userId);
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
                              openMobileInspect(userId);
                            }}
                          >
                            {isSelected ? "Inspecting" : "Inspect"}
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

        <div className="hidden xl:block xl:sticky xl:top-4 xl:self-start">
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
            {renderSelectedUserInspectContent()}
          </Card>
        </div>
      </div>

      <PlatformMobileSheet
        open={mobileInspectOpen}
        title={selectedDisplayName}
        subtitle={selectedUser?.email || "Review access and actions."}
        onClose={() => setMobileInspectOpen(false)}
      >
        {selectedUser || loading ? (
          <div className="pt-1">
            <div className="mb-3 flex justify-end">
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
            {renderSelectedUserInspectContent()}
          </div>
        ) : null}
      </PlatformMobileSheet>
=======
  const columns = [
    { key: "username", label: "Username", width: "140px" },
    { key: "email", label: "Email", width: "320px" },
    { key: "role", label: "Role", width: "190px" },
    { key: "active", label: "Active", width: "140px" },
    { key: "tenantCount", label: "Tenant Count", width: "130px" },
    { key: "createdAt", label: "Created", width: "210px" },
    { key: "actions", label: "Actions", width: "200px", align: "right", className: "text-right" },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search username or email"
            className="h-10 rounded-md border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] px-3 text-sm text-[var(--atlas-text-strong)] outline-none placeholder:text-[var(--atlas-muted-soft)] focus:border-blue-400/50"
          />
          <Button variant="outline" onClick={fetchUsers}>Refresh</Button>
        </div>
      </Card>

      {error && <div className="rounded-md border border-violet-300/60 bg-violet-50 px-3 py-2 text-sm text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/20 dark:text-violet-100">{error}</div>}

      <Table
        columns={columns}
        data={users}
        loading={loading}
        tableClassName="min-w-[1330px]"
        rowKey={(user) => getUserId(user)}
        renderRow={(user) => {
          const role = getRole(user);
          const active = isEnabled(user);

          return (
            <>
              <td className="whitespace-nowrap px-4 py-3 font-semibold text-[var(--atlas-text-strong)]">
                {user.username || "-"}
              </td>
              <td className="px-4 py-3 text-[var(--atlas-muted)]">
                <div className="truncate" title={user.email || "-"}>
                  {user.email || "-"}
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3"><Badge kind="role" value={role} /></td>
              <td className="whitespace-nowrap px-4 py-3"><Badge kind="active" value={active ? "ENABLED" : "DISABLED"} /></td>
              <td className="whitespace-nowrap px-4 py-3 text-[var(--atlas-muted)]">
                {formatNumber(user.tenantCount ?? user.tenantsCount ?? 0)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-[var(--atlas-muted)]">
                {formatDateTime(user.createdAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-nowrap justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      askToggleAdmin(user);
                    }}
                  >
                    {role === "PLATFORM_ADMIN" ? "Demote" : "Promote"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      askToggleEnabled(user);
                    }}
                  >
                    {active ? "Disable" : "Enable"}
                  </Button>
                </div>
              </td>
            </>
          );
        }}
        emptyTitle="No operators found"
        emptyMessage="Try another search query."
      />

      {!loading && users.length === 0 && !error && (
        <EmptyState title="No users found" message="No operators match your current filter." />
      )}

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-[var(--atlas-muted)]">
          Page <span className="font-semibold text-[var(--atlas-text-strong)]">{page + 1}</span> of{" "}
          <span className="font-semibold text-[var(--atlas-text-strong)]">{Math.max(totalPages, 1)}</span>
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
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <Button variant="outline" onClick={() => setPage((prev) => Math.max(0, prev - 1))} disabled={loading || page <= 0}>
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((prev) => Math.min(Math.max(totalPages - 1, 0), prev + 1))}
            disabled={loading || page + 1 >= totalPages}
          >
            Next
          </Button>
        </div>
      </Card>
>>>>>>> 0babf4d (Update frontend application)

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        loading={mutating}
        confirmLabel="Confirm"
<<<<<<< HEAD
        onCancel={() =>
          setConfirm({ open: false, title: "", message: "", userId: null, type: "", value: false })
        }
        onConfirm={executeConfirm}
      />
      <PlatformUserModal
        open={createUserOpen}
        loading={creatingUser}
        onClose={() => {
          if (creatingUser) return;
          setCreateUserOpen(false);
        }}
        onSubmit={handleCreatePlatformUser}
      />
=======
        onCancel={() => setConfirm({ open: false, title: "", message: "", userId: null, type: "", value: false })}
        onConfirm={executeConfirm}
      />
>>>>>>> 0babf4d (Update frontend application)
    </div>
  );
}

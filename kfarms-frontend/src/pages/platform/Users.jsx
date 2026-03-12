import React from "react";
import Card from "../../components/Card";
import Table from "../../components/Table";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import ConfirmDialog from "../../components/ConfirmDialog";
import EmptyState from "../../components/EmptyState";
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
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [users, setUsers] = React.useState([]);
  const [totalItems, setTotalItems] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);

  const [confirm, setConfirm] = React.useState({
    open: false,
    title: "",
    message: "",
    userId: null,
    type: "",
    value: false,
  });
  const [mutating, setMutating] = React.useState(false);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 320);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

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

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const askToggleAdmin = (user) => {
    const userId = getUserId(user);
    const current = getRole(user) === "PLATFORM_ADMIN";

    setConfirm({
      open: true,
      title: current ? "Remove platform admin" : "Promote to platform admin",
      message: current
        ? "This user will lose platform admin permissions. Continue?"
        : "Grant platform admin permissions to this user?",
      userId,
      type: "admin",
      value: !current,
    });
  };

  const askToggleEnabled = (user) => {
    const userId = getUserId(user);
    const current = isEnabled(user);

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

    setMutating(true);
    try {
      if (confirm.type === "admin") {
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

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        loading={mutating}
        confirmLabel="Confirm"
        onCancel={() => setConfirm({ open: false, title: "", message: "", userId: null, type: "", value: false })}
        onConfirm={executeConfirm}
      />
    </div>
  );
}

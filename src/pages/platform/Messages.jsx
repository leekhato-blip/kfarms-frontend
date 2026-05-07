import React from "react";
import {
  Building2,
  FilterX,
  Info,
  LifeBuoy,
  Megaphone,
  MessageSquareText,
  RefreshCw,
  SendHorizontal,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import PlatformInlineLoader from "../../components/PlatformInlineLoader";
import PlatformMetricCard from "../../components/PlatformMetricCard";
import { useToast } from "../../components/ToastProvider";
import { PLATFORM_ENDPOINTS, cleanQueryParams } from "../../api/endpoints";
import { getApiErrorMessage, platformAxios, unwrapApiResponse } from "../../api/platformClient";
import { formatDateTime, formatNumber } from "../../utils/formatters";

const STATUS_OPTIONS = ["ALL", "OPEN", "PENDING", "RESOLVED"];
const LANE_OPTIONS = ["ALL", "STANDARD", "PRIORITY", "DEDICATED"];
const ANNOUNCEMENT_AUDIENCE_OPTIONS = [
  { value: "ALL_ACTIVE", label: "All active workspaces" },
  { value: "SPECIFIC", label: "Selected workspaces" },
];
const QUICK_REPLY_TEMPLATES = [
  {
    id: "request-context",
    label: "Ask for detail",
    body:
      "Thanks for reaching out. Please share the steps, screenshots, and time so we can investigate fast.",
  },
  {
    id: "confirm-review",
    label: "Confirm review",
    body:
      "We reviewed this and escalated it. We will update you after the next check.",
  },
  {
    id: "resolve-confirmation",
    label: "Mark resolved",
    body:
      "This looks resolved on our side. Please confirm it is working so we can close the thread.",
  },
];

function laneBadgeClasses(lane) {
  const normalized = String(lane || "").toUpperCase();
  if (normalized === "DEDICATED") {
    return "atlas-lane-badge atlas-lane-badge--dedicated";
  }
  if (normalized === "PRIORITY") {
    return "atlas-lane-badge atlas-lane-badge--priority";
  }
  return "atlas-lane-badge atlas-lane-badge--standard";
}

function laneLabel(lane) {
  const normalized = String(lane || "").toUpperCase();
  if (normalized === "DEDICATED") return "Dedicated";
  if (normalized === "PRIORITY") return "Priority";
  return "Standard";
}

function displayLaneLabel(lane, laneDisplay) {
  const normalizedDisplay = String(laneDisplay || "").trim();
  if (normalizedDisplay) {
    return normalizedDisplay.replace(/\s+lane$/i, "");
  }
  return laneLabel(lane);
}

function normalizeItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

function getTicketMessages(ticket) {
  return Array.isArray(ticket?.messages) ? ticket.messages : [];
}

function getLastTicketMessage(ticket) {
  const messages = getTicketMessages(ticket);
  return messages.length ? messages[messages.length - 1] : null;
}

function priorityBadgeClasses(priority) {
  const normalized = String(priority || "").toUpperCase();
  if (normalized === "HIGH" || normalized === "CRITICAL") {
    return "atlas-priority-badge atlas-priority-badge--urgent";
  }
  if (normalized === "LOW") {
    return "atlas-priority-badge atlas-priority-badge--low";
  }
  return "atlas-priority-badge atlas-priority-badge--normal";
}

function priorityLabel(priority) {
  const normalized = String(priority || "").toUpperCase();
  if (normalized === "HIGH" || normalized === "CRITICAL") return "Urgent";
  if (normalized === "LOW") return "Low";
  return "Normal";
}

function statusActionButtonClasses(nextStatus, currentStatus) {
  const normalizedNext = String(nextStatus || "").toUpperCase();
  const normalizedCurrent = String(currentStatus || "").toUpperCase();
  const active = normalizedNext === normalizedCurrent;
  const tone =
    normalizedNext === "RESOLVED"
      ? "resolved"
      : normalizedNext === "PENDING"
        ? "pending"
        : "open";
  return `atlas-thread-action atlas-thread-action--${tone}${active ? " is-active" : ""}`;
}

export default function PlatformMessagesPage() {
  const { notify } = useToast();
  const { platformDataMode = "live" } = useOutletContext() || {};
  const [search, setSearch] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  const [status, setStatus] = React.useState("ALL");
  const [statusInput, setStatusInput] = React.useState("ALL");
  const [lane, setLane] = React.useState("ALL");
  const [laneInput, setLaneInput] = React.useState("ALL");
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [tickets, setTickets] = React.useState([]);
  const [selectedTicketId, setSelectedTicketId] = React.useState("");
  const [statusCounts, setStatusCounts] = React.useState({});
  const [laneCounts, setLaneCounts] = React.useState({});
  const [replyBody, setReplyBody] = React.useState("");
  const [replying, setReplying] = React.useState(false);
  const [updatingStatus, setUpdatingStatus] = React.useState(false);
  const [announcementTitle, setAnnouncementTitle] = React.useState("");
  const [announcementMessage, setAnnouncementMessage] = React.useState("");
  const [announcementAudience, setAnnouncementAudience] = React.useState("ALL_ACTIVE");
  const [announcementTenantIds, setAnnouncementTenantIds] = React.useState([]);
  const [announcementTenants, setAnnouncementTenants] = React.useState([]);
  const [announcementTenantsLoading, setAnnouncementTenantsLoading] = React.useState(false);
  const [sendingAnnouncement, setSendingAnnouncement] = React.useState(false);

  const fetchAnnouncementTenants = React.useCallback(async () => {
    if (platformDataMode === "demo") {
      setAnnouncementTenants([]);
      setAnnouncementTenantsLoading(false);
      return;
    }

    setAnnouncementTenantsLoading(true);
    try {
      const response = await platformAxios.get(PLATFORM_ENDPOINTS.tenants, {
        params: cleanQueryParams({
          status: "ACTIVE",
          page: 0,
          size: 200,
        }),
      });
      const payload = unwrapApiResponse(response.data, "Failed to load workspaces");
      setAnnouncementTenants(normalizeItems(payload));
    } catch (tenantError) {
      setAnnouncementTenants([]);
      notify(getApiErrorMessage(tenantError, "Failed to load workspaces"), "error");
    } finally {
      setAnnouncementTenantsLoading(false);
    }
  }, [notify, platformDataMode]);

  const fetchTickets = React.useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    if (platformDataMode === "demo") {
      setTickets([]);
      setStatusCounts({});
      setLaneCounts({});
      setSelectedTicketId("");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const response = await platformAxios.get(PLATFORM_ENDPOINTS.supportTickets, {
        params: cleanQueryParams({
          search: search.trim() || undefined,
          status: status === "ALL" ? undefined : status,
          lane: lane === "ALL" ? undefined : lane,
        }),
      });
      const payload = unwrapApiResponse(response.data, "Failed to load platform messages");
      const nextItems = normalizeItems(payload);
      setTickets(nextItems);
      setStatusCounts(payload?.statusCounts || {});
      setLaneCounts(payload?.laneCounts || {});

      if (!selectedTicketId || !nextItems.some((ticket) => ticket.ticketId === selectedTicketId)) {
        setSelectedTicketId(nextItems[0]?.ticketId || "");
      }
    } catch (fetchError) {
      setTickets([]);
      setStatusCounts({});
      setLaneCounts({});
      setError(getApiErrorMessage(fetchError, "Failed to load platform messages"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lane, platformDataMode, search, selectedTicketId, status]);

  React.useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  React.useEffect(() => {
    fetchAnnouncementTenants().catch(() => {});
  }, [fetchAnnouncementTenants]);

  const selectedTicket = React.useMemo(
    () => tickets.find((ticket) => ticket.ticketId === selectedTicketId) || tickets[0] || null,
    [selectedTicketId, tickets],
  );
  const selectedTicketMessages = React.useMemo(() => getTicketMessages(selectedTicket), [selectedTicket]);
  const selectedTicketLastMessage = React.useMemo(
    () => getLastTicketMessage(selectedTicket),
    [selectedTicket],
  );
  const hasActiveFilters = Boolean(search || status !== "ALL" || lane !== "ALL");
  const hasPendingFilterChanges =
    searchInput.trim() !== search || statusInput !== status || laneInput !== lane;
  const selectedAnnouncementTenantCount = announcementTenantIds.length;

  function handleApplyFilters() {
    setSearch(searchInput.trim());
    setStatus(statusInput);
    setLane(laneInput);
  }

  function handleClearFilters() {
    setSearchInput("");
    setStatusInput("ALL");
    setLaneInput("ALL");
    setSearch("");
    setStatus("ALL");
    setLane("ALL");
  }

  function handleUseTemplate(templateBody) {
    setReplyBody((current) => (current.trim() ? `${current.trim()}\n\n${templateBody}` : templateBody));
  }

  async function handleSendAnnouncement(event) {
    event.preventDefault();
    if (
      sendingAnnouncement ||
      !announcementTitle.trim() ||
      !announcementMessage.trim() ||
      (announcementAudience === "SPECIFIC" && announcementTenantIds.length === 0)
    ) {
      return;
    }

    if (platformDataMode === "demo") {
      notify("Demo preview is read-only for announcements.", "info");
      return;
    }

    setSendingAnnouncement(true);
    try {
      const response = await platformAxios.post(PLATFORM_ENDPOINTS.announcements, {
        title: announcementTitle.trim(),
        message: announcementMessage.trim(),
        audience: announcementAudience,
        tenantIds:
          announcementAudience === "SPECIFIC"
            ? announcementTenantIds.map((tenantId) => Number(tenantId)).filter(Number.isFinite)
            : [],
      });
      const payload = unwrapApiResponse(response.data, "Failed to send announcement");
      const audienceCount = Number(payload?.tenantCount || 0);
      setAnnouncementTitle("");
      setAnnouncementMessage("");
      setAnnouncementAudience("ALL_ACTIVE");
      setAnnouncementTenantIds([]);
      notify(
        audienceCount > 0
          ? `Announcement sent to ${formatNumber(audienceCount)} workspace${audienceCount === 1 ? "" : "s"}.`
          : "Announcement sent.",
        "success",
      );
    } catch (announcementError) {
      notify(getApiErrorMessage(announcementError, "Failed to send announcement"), "error");
    } finally {
      setSendingAnnouncement(false);
    }
  }

  function toggleAnnouncementTenant(tenantId) {
    const normalizedId = String(tenantId || "").trim();
    if (!normalizedId) return;
    setAnnouncementTenantIds((current) =>
      current.includes(normalizedId)
        ? current.filter((value) => value !== normalizedId)
        : [...current, normalizedId],
    );
  }

  async function handleSendReply(event) {
    event.preventDefault();
    if (!selectedTicket || !replyBody.trim() || replying) return;
    if (platformDataMode === "demo") {
      notify("Demo preview is read-only for support replies.", "info");
      return;
    }

    setReplying(true);
    try {
      const response = await platformAxios.post(
        PLATFORM_ENDPOINTS.supportTicketMessages(selectedTicket.ticketId),
        { body: replyBody.trim() },
      );
      const payload = unwrapApiResponse(response.data, "Failed to send reply");
      const nextTicket = payload?.ticket || payload;
      setTickets((current) =>
        current.map((ticket) => (ticket.ticketId === nextTicket.ticketId ? nextTicket : ticket)),
      );
      setReplyBody("");
      notify("Reply sent", "success");
    } catch (replyError) {
      notify(getApiErrorMessage(replyError, "Failed to send reply"), "error");
    } finally {
      setReplying(false);
    }
  }

  async function handleStatusChange(nextStatus) {
    if (!selectedTicket || updatingStatus) return;
    if (platformDataMode === "demo") {
      notify("Demo preview is read-only for support status changes.", "info");
      return;
    }

    setUpdatingStatus(true);
    try {
      const response = await platformAxios.patch(
        PLATFORM_ENDPOINTS.supportTicketStatus(selectedTicket.ticketId),
        { status: nextStatus },
      );
      const payload = unwrapApiResponse(response.data, "Failed to update ticket");
      const nextTicket = payload?.ticket || payload;
      setTickets((current) =>
        current.map((ticket) => (ticket.ticketId === nextTicket.ticketId ? nextTicket : ticket)),
      );
      notify(`Ticket marked ${String(nextStatus).toLowerCase()}`, "success");
      fetchTickets({ silent: true }).catch(() => {});
    } catch (statusError) {
      notify(getApiErrorMessage(statusError, "Failed to update ticket"), "error");
    } finally {
      setUpdatingStatus(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="atlas-stage-card p-5">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="atlas-signal-chip w-fit">
              <MessageSquareText size={12} />
              Support Inbox
            </div>
            <h1 className="mt-5 font-header text-3xl font-semibold leading-tight text-[var(--atlas-text-strong)] md:text-[2.35rem]">
              ROOTS support inbox.
            </h1>
            <div className="mt-3 text-sm leading-7 text-[var(--atlas-muted)]">
              Handle tenant issues fast.
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={refreshing}
            onClick={() => fetchTickets({ silent: true })}
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </Card>

      <Card className="atlas-stage-card overflow-hidden p-0">
        <div className="border-b border-[color:var(--atlas-border)] bg-[linear-gradient(135deg,rgba(219,234,254,0.94),rgba(239,246,255,0.98))] px-5 py-5 dark:bg-[linear-gradient(135deg,rgba(30,64,175,0.18),rgba(15,23,42,0.9))]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="atlas-signal-chip w-fit">
                <Megaphone size={12} />
                App Announcement
              </div>
              <h2 className="mt-4 font-header text-2xl font-semibold leading-tight text-[var(--atlas-text-strong)]">
                Send promo and update banners to app users.
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--atlas-muted)]">
                This sends a slim GitHub-style announcement bar across the workspace so users see promos, updates, and important notices fast.
              </p>
            </div>
            <div className="rounded-2xl border border-blue-300/50 bg-white/70 px-4 py-3 text-xs leading-6 text-blue-950 shadow-[0_14px_34px_rgba(37,99,235,0.12)] dark:border-blue-300/15 dark:bg-white/5 dark:text-blue-100">
              <div className="font-semibold uppercase tracking-[0.16em]">Delivery</div>
                <div className="mt-1">
                  {announcementAudience === "SPECIFIC"
                    ? selectedAnnouncementTenantCount > 0
                      ? `${formatNumber(selectedAnnouncementTenantCount)} workspace${selectedAnnouncementTenantCount === 1 ? "" : "s"} selected`
                      : "Choose one or more workspaces"
                    : "All active workspaces"}
                </div>
              </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-blue-300/65 bg-[#dbeafe] shadow-[0_16px_34px_rgba(37,99,235,0.16)] dark:border-blue-300/18 dark:bg-[linear-gradient(135deg,rgba(30,64,175,0.24),rgba(15,23,42,0.96))]">
            <div className="flex items-start gap-3 px-4 py-3">
              <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-blue-300/60 bg-blue-600 text-white dark:border-blue-300/20 dark:bg-blue-500/90">
                <Info size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-6 text-blue-950 dark:text-blue-50">
                  <span className="font-semibold">
                    {announcementTitle.trim() || "Your announcement title will show here"}
                  </span>
                  {announcementMessage.trim()
                    ? ` ${announcementMessage.trim()}`
                    : " Add a short message so app users immediately understand the update."}
                </p>
              </div>
              <button
                type="button"
                disabled
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-blue-800/80 dark:text-blue-100/80"
                aria-label="Announcement close preview"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSendAnnouncement} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
              <input
                type="text"
                value={announcementTitle}
                onChange={(event) => setAnnouncementTitle(event.target.value)}
                placeholder="Announcement title"
                className="atlas-input"
                maxLength={120}
              />
              <textarea
                value={announcementMessage}
                onChange={(event) => setAnnouncementMessage(event.target.value)}
                placeholder="Short message for promo, update, or maintenance notice"
                className="atlas-input min-h-[116px] resize-none"
                maxLength={280}
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <select
                value={announcementAudience}
                onChange={(event) => setAnnouncementAudience(event.target.value)}
                className="atlas-input"
              >
                {ANNOUNCEMENT_AUDIENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="rounded-[1.15rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/55 p-3">
                {announcementAudience !== "SPECIFIC" ? (
                  <div className="text-sm text-[var(--atlas-muted)]">
                    This banner will go to every active workspace.
                  </div>
                ) : announcementTenantsLoading ? (
                  <PlatformInlineLoader label="Loading workspaces..." className="border-0 bg-transparent px-0 py-0" />
                ) : announcementTenants.length === 0 ? (
                  <div className="text-sm text-[var(--atlas-muted)]">
                    No active workspaces are ready for targeted delivery.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--atlas-muted)]">
                      Choose one or more workspaces
                    </div>
                    <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                      {announcementTenants.map((tenant) => {
                        const checked = announcementTenantIds.includes(String(tenant.id));
                        return (
                          <label
                            key={tenant.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-2.5 transition ${
                              checked
                                ? "border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface)]/88"
                                : "border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface)]/50 hover:bg-[color:var(--atlas-surface)]/70"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleAnnouncementTenant(tenant.id)}
                              className="mt-1 h-4 w-4 rounded border-[color:var(--atlas-border-strong)]"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-[var(--atlas-text-strong)]">
                                {tenant.name}
                              </span>
                              <span className="block text-xs text-[var(--atlas-muted)]">
                                {tenant.plan || "FREE"}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-[1.4rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/65 p-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--atlas-muted)]">
                Send Rules
              </div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--atlas-muted)]">
                <p>Keep it short so it fits the workspace banner naturally.</p>
                <p>Use this for promos, release notes, downtime alerts, and quick reminders.</p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={
                sendingAnnouncement ||
                !announcementTitle.trim() ||
                !announcementMessage.trim() ||
                (announcementAudience === "SPECIFIC" && announcementTenantIds.length === 0)
              }
            >
              <SendHorizontal size={14} />
              {sendingAnnouncement ? "Sending..." : "Send banner"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="atlas-platform-metric-grid-compact">
        <PlatformMetricCard
          icon={MessageSquareText}
          label="Visible Threads"
          value={formatNumber(tickets.length)}
          hint="Threads in view."
          tone="purple"
        />
        <PlatformMetricCard
          icon={ShieldAlert}
          label="Priority Lane"
          value={formatNumber(Number(laneCounts.PRIORITY || 0) + Number(laneCounts.DEDICATED || 0))}
          hint="High-touch threads."
          tone="amber"
        />
        <PlatformMetricCard
          icon={Sparkles}
          label="Open Threads"
          value={formatNumber(Number(statusCounts.OPEN || 0))}
          hint="Need a platform reply."
          tone="green"
        />
        <PlatformMetricCard
          icon={LifeBuoy}
          label="Pending Threads"
          value={formatNumber(Number(statusCounts.PENDING || 0))}
          hint="Waiting on the next move."
          tone="blue"
        />
      </div>

      <Card className="atlas-glass-card p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_190px_auto_auto]">
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleApplyFilters();
            }}
            placeholder="Search ticket, tenant, subject, or email"
            className="atlas-input"
          />
          <select
            value={statusInput}
            onChange={(event) => setStatusInput(event.target.value)}
            className="atlas-input"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All statuses" : option}
              </option>
            ))}
          </select>
          <select
            value={laneInput}
            onChange={(event) => setLaneInput(event.target.value)}
            className="atlas-input"
          >
            {LANE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All lanes" : laneLabel(option)}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            className="atlas-message-toolbar-button"
            disabled={!hasPendingFilterChanges}
            onClick={handleApplyFilters}
          >
            Apply filters
          </Button>
          <Button
            variant="ghost"
            className="atlas-message-toolbar-button"
            disabled={!hasActiveFilters && !hasPendingFilterChanges}
            onClick={handleClearFilters}
          >
            <FilterX size={14} />
            Clear
          </Button>
        </div>
        <div className="mt-3 text-xs text-[var(--atlas-muted)]">
          Apply filters when you are ready so the thread list stays stable while you type.
        </div>
      </Card>

      {error ? (
        <Card className="atlas-glass-card p-6">
          <EmptyState title="Inbox unavailable" message={error} />
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card className="atlas-glass-card min-h-[520px] p-3">
            {loading ? (
              <PlatformInlineLoader label="Loading platform messages..." className="h-full min-h-[420px]" />
            ) : tickets.length === 0 ? (
              <EmptyState
                title="No tenant messages"
                message="No threads match this view."
              />
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => {
                  const active = ticket.ticketId === selectedTicket?.ticketId;
                  const lastMessage = getLastTicketMessage(ticket);
                  const messageCount = getTicketMessages(ticket).length;
                  const hasExplicitPriority = Boolean(String(ticket.priority || "").trim());
                  const lastAuthorIsPlatform =
                    String(lastMessage?.authorType || "").toUpperCase() === "SUPPORT";
                  return (
                    <button
                      key={ticket.ticketId}
                      type="button"
                      onClick={() => setSelectedTicketId(ticket.ticketId)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)]/90"
                          : "border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface)]/70 hover:bg-[color:var(--atlas-surface-soft)]/70"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none ${laneBadgeClasses(ticket.lane)}`}
                          title={ticket.laneLabel || laneLabel(ticket.lane)}
                        >
                          {displayLaneLabel(ticket.lane, ticket.laneLabel)}
                        </span>
                        <Badge kind="plan" value={ticket.tenantPlan || ticket.plan || "FREE"} />
                        <Badge kind="status" value={ticket.status || "OPEN"} />
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-[var(--atlas-text-strong)]">
                        <Building2 size={14} />
                        {ticket.tenantName || "Unknown tenant"}
                      </div>
                      <div className="mt-1 text-sm font-medium text-[var(--atlas-text-strong)]">
                        {ticket.subject || "Untitled thread"}
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--atlas-muted)]">
                        {ticket.description || "No description provided."}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {hasExplicitPriority ? (
                          <span className={priorityBadgeClasses(ticket.priority)}>
                            {priorityLabel(ticket.priority)}
                          </span>
                        ) : null}
                        <span className="atlas-message-meta-badge atlas-message-meta-badge--count">
                          {formatNumber(messageCount)} {messageCount === 1 ? "message" : "messages"}
                        </span>
                      </div>
                      <div className="mt-3 rounded-2xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/45 px-3 py-2.5">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--atlas-muted)]">
                          {lastAuthorIsPlatform ? "Last reply from platform" : "Last reply from tenant"}
                        </div>
                        <div className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--atlas-text)]">
                          {lastMessage?.body || ticket.description || "No replies yet."}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[var(--atlas-muted)]">
                        <span>{ticket.ticketId}</span>
                        <span>{formatDateTime(ticket.updatedAt)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="atlas-glass-card min-h-[520px] p-5">
            {!selectedTicket ? (
              <EmptyState
                title="Choose a thread"
                message="Pick a thread to read and reply."
              />
            ) : (
              <div className="flex h-full min-h-[480px] flex-col">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--atlas-border)] pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none ${laneBadgeClasses(selectedTicket.lane)}`}
                        title={displayLaneLabel(selectedTicket.lane, selectedTicket.laneLabel)}
                      >
                        {displayLaneLabel(selectedTicket.lane, selectedTicket.laneLabel)}
                      </span>
                      <Badge kind="plan" value={selectedTicket.tenantPlan || selectedTicket.plan || "FREE"} />
                      <Badge kind="status" value={selectedTicket.status || "OPEN"} />
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-[var(--atlas-text-strong)]">
                      {selectedTicket.subject}
                    </h2>
                    <div className="mt-2 text-sm text-[var(--atlas-muted)]">
                      {selectedTicket.ticketId} · {selectedTicket.tenantName} ·{" "}
                      {selectedTicket.tenantContactEmail || "No tenant contact email"}
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-2xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/55 px-3 py-2.5">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--atlas-muted)]">
                          Lane
                        </div>
                        <div className="mt-1 text-sm font-semibold text-[var(--atlas-text-strong)]">
                          {displayLaneLabel(selectedTicket.lane, selectedTicket.laneLabel)}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/55 px-3 py-2.5">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--atlas-muted)]">
                          Thread volume
                        </div>
                        <div className="mt-1 text-sm font-semibold text-[var(--atlas-text-strong)]">
                          {formatNumber(selectedTicketMessages.length)}{" "}
                          {selectedTicketMessages.length === 1 ? "message" : "messages"}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/55 px-3 py-2.5">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--atlas-muted)]">
                          Latest update
                        </div>
                        <div className="mt-1 text-sm font-semibold text-[var(--atlas-text-strong)]">
                          {formatDateTime(selectedTicketLastMessage?.createdAt || selectedTicket.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      className={statusActionButtonClasses("OPEN", selectedTicket.status)}
                      disabled={updatingStatus || String(selectedTicket.status || "").toUpperCase() === "OPEN"}
                      onClick={() => handleStatusChange("OPEN")}
                    >
                      Mark open
                    </Button>
                    <Button
                      variant="ghost"
                      className={statusActionButtonClasses("PENDING", selectedTicket.status)}
                      disabled={updatingStatus || String(selectedTicket.status || "").toUpperCase() === "PENDING"}
                      onClick={() => handleStatusChange("PENDING")}
                    >
                      Mark pending
                    </Button>
                    <Button
                      variant="ghost"
                      className={statusActionButtonClasses("RESOLVED", selectedTicket.status)}
                      disabled={updatingStatus || String(selectedTicket.status || "").toUpperCase() === "RESOLVED"}
                      onClick={() => handleStatusChange("RESOLVED")}
                    >
                      Resolve thread
                    </Button>
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto py-4">
                  {(Array.isArray(selectedTicket.messages) ? selectedTicket.messages : []).map((message) => {
                    const fromPlatform = String(message.authorType || "").toUpperCase() === "SUPPORT";
                    return (
                      <div
                        key={message.id}
                        className={`max-w-[86%] rounded-2xl border px-4 py-3 ${
                          fromPlatform
                            ? "ml-auto border-violet-300/40 bg-violet-500/10 text-[var(--atlas-text-strong)]"
                            : "border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/70 text-[var(--atlas-text-strong)]"
                        }`}
                      >
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--atlas-muted)]">
                          {message.authorName || (fromPlatform ? "Platform" : "Tenant")}
                        </div>
                        <div className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.body}</div>
                        <div className="mt-3 text-xs text-[var(--atlas-muted)]">
                          {formatDateTime(message.createdAt)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSendReply} className="border-t border-[color:var(--atlas-border)] pt-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--atlas-muted)]">
                    Reply to tenant
                  </label>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {QUICK_REPLY_TEMPLATES.map((template) => (
                      <Button
                        key={template.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="atlas-message-template-button border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/55 text-[var(--atlas-text)] hover:bg-[color:var(--atlas-surface-hover)]"
                        onClick={() => handleUseTemplate(template.body)}
                      >
                        {template.label}
                      </Button>
                    ))}
                  </div>
                  <textarea
                    rows={4}
                    value={replyBody}
                    onChange={(event) => setReplyBody(event.target.value)}
                    placeholder="Write the next clear reply."
                    className="atlas-input min-h-[112px] resize-y"
                  />
                  <div className="mt-2 text-xs text-[var(--atlas-muted)]">
                    {selectedTicket.lane === "DEDICATED"
                      ? "Enterprise: be clear, specific, and fast."
                      : selectedTicket.lane === "PRIORITY"
                        ? "Pro: give the next step and timing."
                        : "Standard: acknowledge and guide the next step."}
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="submit"
                      disabled={replying || !replyBody.trim()}
                      className="min-w-[8.5rem]"
                    >
                      <SendHorizontal size={14} />
                      {replying ? "Sending..." : "Send reply"}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

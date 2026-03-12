import React from "react";
import { useSearchParams } from "react-router-dom";
import {
  BookOpenText,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  LifeBuoy,
  MessageCircle,
  PlusCircle,
  RefreshCw,
  Search,
  SendHorizontal,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import GlassToast from "../components/GlassToast";
import FarmerGuideCard from "../components/FarmerGuideCard";
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../tenant/TenantContext";
import {
  FARMER_GUIDES,
  SUPPORT_CHANNELS,
  SUPPORT_FAQS,
  addSupportTicketReply,
  createSupportTicket,
  getSupportResources,
  getSupportTickets,
  updateSupportTicketStatus,
} from "../services/supportService";

const TABS = [
  { id: "guides", label: "Guides", icon: BookOpenText },
  { id: "tickets", label: "Help requests", icon: MessageCircle },
  { id: "faq", label: "Common questions", icon: CircleHelp },
];

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClasses(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "RESOLVED") {
    return "border-emerald-300/50 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-100";
  }
  if (normalized === "PENDING") {
    return "border-amber-300/50 bg-amber-500/10 text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-100";
  }
  return "border-sky-300/50 bg-sky-500/10 text-sky-700 dark:border-sky-400/40 dark:bg-sky-500/20 dark:text-sky-100";
}

function statusLabel(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "PENDING") return "Waiting";
  if (normalized === "RESOLVED") return "Fixed";
  return "Open";
}

function priorityClasses(priority) {
  const normalized = String(priority || "").toUpperCase();
  if (normalized === "CRITICAL") {
    return "text-status-danger";
  }
  if (normalized === "HIGH") {
    return "text-amber-500 dark:text-amber-300";
  }
  if (normalized === "LOW") {
    return "text-emerald-500 dark:text-emerald-300";
  }
  return "text-slate-600 dark:text-slate-300";
}

function priorityLabel(priority) {
  const normalized = String(priority || "").toUpperCase();
  if (normalized === "CRITICAL") return "Urgent";
  if (normalized === "HIGH") return "High";
  if (normalized === "LOW") return "Low";
  return "Normal";
}

function buildGuideSearchText(guide) {
  const steps = Array.isArray(guide?.steps) ? guide.steps.join(" ") : "";
  return `${guide?.title || ""} ${guide?.summary || ""} ${guide?.category || ""} ${steps} ${guide?.tip || ""}`.toLowerCase();
}

export default function SupportPage() {
  const { user } = useAuth();
  const { activeTenant, activeTenantId } = useTenant();
  const [searchParams] = useSearchParams();
  const searchParamsKey = searchParams.toString();

  const [activeTab, setActiveTab] = React.useState("guides");
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [dataSource, setDataSource] = React.useState("api");
  const [guides, setGuides] = React.useState([]);
  const [faqs, setFaqs] = React.useState([]);
  const [channels, setChannels] = React.useState([]);
  const [tickets, setTickets] = React.useState([]);
  const [selectedGuideId, setSelectedGuideId] = React.useState("");
  const [selectedTicketId, setSelectedTicketId] = React.useState("");
  const [guideQuery, setGuideQuery] = React.useState("");
  const [ticketQuery, setTicketQuery] = React.useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = React.useState("ALL");
  const [ticketForm, setTicketForm] = React.useState({
    subject: "",
    category: "General",
    priority: "MEDIUM",
    description: "",
  });
  const [replyText, setReplyText] = React.useState("");
  const [submittingTicket, setSubmittingTicket] = React.useState(false);
  const [sendingReply, setSendingReply] = React.useState(false);
  const [updatingTicketStatus, setUpdatingTicketStatus] = React.useState(false);
  const [toast, setToast] = React.useState({ message: "", type: "info" });

  const displayName = user?.username || user?.email || "Farmer";

  const loadSupport = React.useCallback(async (options = {}) => {
    if (options.silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [resourcesResult, ticketsResult] = await Promise.allSettled([
        getSupportResources(),
        activeTenantId
          ? getSupportTickets({ tenantId: activeTenantId })
          : Promise.resolve({ tickets: [], source: "placeholder" }),
      ]);

      const nextResources =
        resourcesResult.status === "fulfilled"
          ? resourcesResult.value
          : {
              guides: FARMER_GUIDES,
              faqs: SUPPORT_FAQS,
              channels: SUPPORT_CHANNELS,
              source: "placeholder",
            };

      const nextTickets =
        ticketsResult.status === "fulfilled"
          ? ticketsResult.value
          : {
              tickets: [],
              source: "placeholder",
            };

      setGuides(Array.isArray(nextResources.guides) ? nextResources.guides : FARMER_GUIDES);
      setFaqs(Array.isArray(nextResources.faqs) ? nextResources.faqs : SUPPORT_FAQS);
      setChannels(Array.isArray(nextResources.channels) ? nextResources.channels : SUPPORT_CHANNELS);
      setTickets(Array.isArray(nextTickets.tickets) ? nextTickets.tickets : []);
      setDataSource(
        nextResources.source === "placeholder" || nextTickets.source === "placeholder"
          ? "placeholder"
          : "api",
      );

      if (resourcesResult.status === "rejected" || ticketsResult.status === "rejected") {
        setToast({
          message: "Some help information could not load, so saved help information is being shown instead.",
          type: "info",
        });
      }
    } catch (error) {
      setToast({
        message: error?.message || "Help could not open right now.",
        type: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTenantId]);

  React.useEffect(() => {
    loadSupport();
  }, [loadSupport]);

  React.useEffect(() => {
    if (!guides.length) {
      setSelectedGuideId("");
      return;
    }
    if (!selectedGuideId || !guides.some((guide) => guide.id === selectedGuideId)) {
      setSelectedGuideId(guides[0].id);
    }
  }, [guides, selectedGuideId]);

  React.useEffect(() => {
    if (!tickets.length) {
      setSelectedTicketId("");
      return;
    }
    if (!selectedTicketId || !tickets.some((ticket) => ticket.id === selectedTicketId)) {
      setSelectedTicketId(tickets[0].id);
    }
  }, [selectedTicketId, tickets]);

  const guideCategories = React.useMemo(
    () =>
      Array.from(
        new Set((Array.isArray(guides) ? guides : []).map((guide) => String(guide.category || "General"))),
      ),
    [guides],
  );

  const filteredGuides = React.useMemo(() => {
    const needle = guideQuery.trim().toLowerCase();
    if (!needle) return guides;
    return guides.filter((guide) => buildGuideSearchText(guide).includes(needle));
  }, [guideQuery, guides]);

  const selectedGuide = React.useMemo(() => {
    if (!filteredGuides.length) return null;
    return filteredGuides.find((guide) => guide.id === selectedGuideId) || filteredGuides[0];
  }, [filteredGuides, selectedGuideId]);

  const ticketStats = React.useMemo(() => {
    const open = tickets.filter((ticket) => ticket.status === "OPEN").length;
    const pending = tickets.filter((ticket) => ticket.status === "PENDING").length;
    const resolved = tickets.filter((ticket) => ticket.status === "RESOLVED").length;
    return {
      total: tickets.length,
      open,
      pending,
      resolved,
    };
  }, [tickets]);

  const filteredTickets = React.useMemo(() => {
    const needle = ticketQuery.trim().toLowerCase();
    const list = [...tickets].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return list.filter((ticket) => {
      const statusMatch =
        ticketStatusFilter === "ALL" ? true : String(ticket.status || "").toUpperCase() === ticketStatusFilter;
      const searchMatch = needle
        ? `${ticket.id} ${ticket.subject} ${ticket.category} ${ticket.description}`.toLowerCase().includes(needle)
        : true;
      return statusMatch && searchMatch;
    });
  }, [ticketQuery, ticketStatusFilter, tickets]);

  const selectedTicket = React.useMemo(() => {
    if (!filteredTickets.length) return null;
    return filteredTickets.find((ticket) => ticket.id === selectedTicketId) || filteredTickets[0];
  }, [filteredTickets, selectedTicketId]);

  const ticketCategoryOptions = React.useMemo(() => {
    const preset = [
      "General",
      "Fish Ponds",
      "Feeds & feeding",
      "Poultry",
      "Sales & money",
      "Stock & supplies",
      "Billing & plan",
      "Farm access",
      "Reports & downloads",
    ];
    const merged = [...preset, ...guideCategories];
    return Array.from(new Set(merged));
  }, [guideCategories]);

  React.useEffect(() => {
    const params = new URLSearchParams(searchParamsKey);
    const tab = String(params.get("tab") || "").trim();
    if (tab && TABS.some((item) => item.id === tab)) {
      setActiveTab(tab);
    }

    const subject = String(params.get("subject") || "").trim();
    const category = String(params.get("category") || "").trim();
    const priority = String(params.get("priority") || "").trim().toUpperCase();
    const description = String(params.get("description") || "").trim();

    if (!subject && !category && !priority && !description) return;

    setActiveTab("tickets");
    setTicketForm((prev) => ({
      subject: subject || prev.subject,
      category: category || prev.category,
      priority: ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(priority) ? priority : prev.priority,
      description: description || prev.description,
    }));
  }, [searchParamsKey]);

  async function handleCreateTicket(event) {
    event.preventDefault();
    if (submittingTicket || !activeTenantId) return;

    setSubmittingTicket(true);
    try {
      const result = await createSupportTicket({
        tenantId: activeTenantId,
        subject: ticketForm.subject,
        category: ticketForm.category,
        priority: ticketForm.priority,
        description: ticketForm.description,
        createdByName: displayName,
      });

      setTickets((prev) => [result.ticket, ...prev.filter((ticket) => ticket.id !== result.ticket.id)]);
      setSelectedTicketId(result.ticket.id);
      setActiveTab("tickets");
      setTicketForm({
        subject: "",
        category: "General",
        priority: "MEDIUM",
        description: "",
      });
      setToast({
        message: `Your help request ${result.ticket.id} was sent.`,
        type: "success",
      });
      if (result.source === "placeholder") {
        setDataSource("placeholder");
      }
    } catch (error) {
      setToast({
        message: error?.message || "Could not send your help request.",
        type: "error",
      });
    } finally {
      setSubmittingTicket(false);
    }
  }

  async function handleSendReply(event) {
    event.preventDefault();
    if (!selectedTicket || sendingReply || !activeTenantId) return;

    setSendingReply(true);
    try {
      const result = await addSupportTicketReply({
        tenantId: activeTenantId,
        ticketId: selectedTicket.id,
        message: replyText,
        authorName: displayName,
      });

      setTickets((prev) => prev.map((ticket) => (ticket.id === result.ticket.id ? result.ticket : ticket)));
      setReplyText("");
      setToast({
        message: `Your message was added to ${result.ticket.id}.`,
        type: "success",
      });
      if (result.source === "placeholder") {
        setDataSource("placeholder");
      }
    } catch (error) {
      setToast({
        message: error?.message || "Could not send your message.",
        type: "error",
      });
    } finally {
      setSendingReply(false);
    }
  }

  async function handleChangeTicketStatus(nextStatus) {
    if (!selectedTicket || updatingTicketStatus || !activeTenantId) return;
    setUpdatingTicketStatus(true);
    try {
      const result = await updateSupportTicketStatus({
        tenantId: activeTenantId,
        ticketId: selectedTicket.id,
        status: nextStatus,
      });
      setTickets((prev) => prev.map((ticket) => (ticket.id === result.ticket.id ? result.ticket : ticket)));
      setToast({
        message: `Help request ${result.ticket.id} is now ${statusLabel(result.ticket.status).toLowerCase()}.`,
        type: "success",
      });
      if (result.source === "placeholder") {
        setDataSource("placeholder");
      }
    } catch (error) {
      setToast({
        message: error?.message || "Could not update this help request.",
        type: "error",
      });
    } finally {
      setUpdatingTicketStatus(false);
    }
  }

  const workspaceName = activeTenant?.name || "your farm";
  const headerPanelClass =
    "rounded-2xl border border-sky-200/70 bg-slate-50/85 shadow-neo dark:border-sky-500/20 dark:bg-[#061024]/90 dark:shadow-[0_22px_40px_rgba(2,8,24,0.45)]";
  const panelClass = "rounded-2xl border border-white/10 bg-white/10 shadow-neo dark:bg-darkCard/70 dark:shadow-dark";
  const panelSoftClass = "rounded-xl border border-white/10 bg-white/5";
  const fieldClass =
    "w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-lightText outline-none transition focus:border-accent-primary/40 focus:ring-2 focus:ring-accent-primary/10 dark:text-darkText";
  const searchFieldClass =
    "w-full rounded-lg border border-white/10 bg-white/10 py-2 pl-9 pr-3 text-sm text-lightText outline-none transition focus:border-accent-primary/40 focus:ring-2 focus:ring-accent-primary/10 dark:text-darkText";
  const supportStats = [
    {
      id: "total",
      label: "Help requests",
      value: ticketStats.total,
      icon: MessageCircle,
      valueClass: "text-lightText dark:text-darkText",
      iconClass: "bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200",
    },
    {
      id: "open",
      label: "Open",
      value: ticketStats.open,
      icon: LifeBuoy,
      valueClass: "text-sky-600 dark:text-sky-200",
      iconClass: "bg-accent-primary/15 text-accent-primary dark:bg-accent-primary/20 dark:text-blue-200",
    },
    {
      id: "pending",
      label: "Waiting",
      value: ticketStats.pending,
      icon: TriangleAlert,
      valueClass: "text-amber-600 dark:text-amber-200",
      iconClass: "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200",
    },
    {
      id: "resolved",
      label: "Fixed",
      value: ticketStats.resolved,
      icon: CheckCircle2,
      valueClass: "text-emerald-600 dark:text-emerald-200",
      iconClass: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4 font-body">
        <section className={`relative isolate overflow-hidden ${headerPanelClass} p-5 md:p-6`}>
          <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(108deg,rgba(37,99,235,0.17)_0%,rgba(14,116,144,0.14)_48%,rgba(16,185,129,0.12)_100%),radial-gradient(circle_at_12%_22%,rgba(56,189,248,0.13),transparent_43%),radial-gradient(circle_at_90%_22%,rgba(16,185,129,0.14),transparent_38%)] dark:bg-[linear-gradient(108deg,rgba(6,19,43,0.96)_0%,rgba(7,32,63,0.9)_48%,rgba(6,58,55,0.84)_100%),radial-gradient(circle_at_12%_22%,rgba(56,189,248,0.16),transparent_43%),radial-gradient(circle_at_90%_22%,rgba(16,185,129,0.18),transparent_38%)]" />
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-accent-primary/30 bg-accent-primary/10 px-3 py-1 text-xs font-semibold text-accent-primary dark:text-blue-200">
                <LifeBuoy className="h-3.5 w-3.5" />
                Help and support
              </div>
              <h1 className="mt-3 text-2xl font-header font-semibold text-slate-900 dark:text-slate-100 md:text-[1.9rem]">
                Get help
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-700/90 dark:text-slate-300/85">
                Read simple guides, find answers fast, and ask for help when something is not working on{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{workspaceName}</span>.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 auto-rows-fr items-center gap-2 md:flex md:w-auto md:flex-wrap md:justify-start">
              <button
                type="button"
                onClick={() => setActiveTab("tickets")}
                className="order-1 inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-accent-primary via-blue-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:brightness-105 md:h-auto md:min-h-0 md:w-auto"
              >
                <PlusCircle className="h-4 w-4" />
                Ask for help
              </button>
              <button
                type="button"
                onClick={() => loadSupport({ silent: true })}
                disabled={loading || refreshing}
                className="order-2 inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white/45 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 disabled:opacity-60 md:h-auto md:min-h-0 md:w-auto dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </section>

        <FarmerGuideCard
          icon={LifeBuoy}
          title="How to get help quickly"
          description="Start with a guide if you need instructions. Ask for help when you want us to track the problem and reply."
          storageKey="support-guide"
          steps={[
            "Search guides for the task or problem you need help with.",
            "Ask for help and explain what happened in simple words.",
            "Check replies here and add more details if the team asks questions.",
          ]}
          tip="If the top boxes show numbers but a list looks empty, clear the find boxes first. The page may only be showing a smaller set."
        />

        {dataSource === "placeholder" && (
          <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
            Help is using saved backup information right now. Guides still work, and help messages are being saved on this device until the full help service is back.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {supportStats.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.id} className={`${panelClass} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      {item.label}
                    </div>
                    <div className={`mt-2 text-xl font-semibold ${item.valueClass}`}>{item.value}</div>
                  </div>
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${item.iconClass}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <div className={`${panelClass} p-2`}>
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-gradient-to-r from-accent-primary to-blue-500 text-white shadow-soft"
                      : "text-slate-600 hover:bg-white/10 dark:text-slate-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <section className="space-y-4 xl:col-span-8">
            {activeTab === "guides" && (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <div className={`${panelClass} p-4 xl:col-span-5`}>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      value={guideQuery}
                      onChange={(event) => setGuideQuery(event.target.value)}
                      placeholder="Search help guides..."
                      className={searchFieldClass}
                    />
                  </div>

                  <div className="mt-4 space-y-2">
                    {filteredGuides.length === 0 ? (
                      <div className={`${panelSoftClass} px-3 py-2 text-sm text-slate-500 dark:text-slate-400`}>
                        Nothing matches that search yet.
                      </div>
                    ) : (
                      filteredGuides.map((guide) => (
                        <button
                          key={guide.id}
                          type="button"
                          onClick={() => setSelectedGuideId(guide.id)}
                          className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                            selectedGuide?.id === guide.id
                              ? "border-accent-primary/45 bg-gradient-to-r from-accent-primary/18 to-cyan-500/12"
                              : "border-white/10 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <div className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                            {guide.category || "General"}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-lightText dark:text-darkText">
                            {guide.title}
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{guide.summary}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className={`${panelClass} p-5 xl:col-span-7`}>
                  {selectedGuide ? (
                    <>
                      <div className="inline-flex rounded-full border border-accent-primary/30 bg-accent-primary/10 px-3 py-1 text-xs font-semibold text-accent-primary dark:text-blue-200">
                        {selectedGuide.category || "General"}
                      </div>
                      <h2 className="mt-3 text-lg font-header font-semibold text-lightText dark:text-darkText">
                        {selectedGuide.title}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {selectedGuide.summary}
                      </p>

                      <div className="mt-4 space-y-2">
                        {(Array.isArray(selectedGuide.steps) ? selectedGuide.steps : []).map((step, index) => (
                          <div
                            key={`${selectedGuide.id}-step-${index + 1}`}
                            className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 transition hover:border-accent-primary/35"
                          >
                            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-primary/15 text-[11px] font-semibold text-accent-primary">
                              {index + 1}
                            </span>
                            <p className="text-sm text-lightText dark:text-darkText">{step}</p>
                          </div>
                        ))}
                      </div>

                      {selectedGuide.tip && (
                        <div className="mt-4 rounded-lg border border-emerald-300/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
                          <span className="font-semibold">Farmer Tip:</span> {selectedGuide.tip}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={`${panelSoftClass} px-4 py-3 text-sm text-slate-500 dark:text-slate-400`}>
                      Choose a guide on the left to read the steps here.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "tickets" && (
              <div className="space-y-4">
                <form
                  onSubmit={handleCreateTicket}
                  className={`${panelClass} p-5`}
                >
                  <div className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-accent-primary" />
                    <h2 className="font-header font-semibold">Ask for help</h2>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Tell us what happened, where it happened, and what you already tried.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
                    <div className="md:col-span-3">
                      <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Short title</label>
                      <input
                        type="text"
                        value={ticketForm.subject}
                        onChange={(event) =>
                          setTicketForm((prev) => ({ ...prev, subject: event.target.value }))
                        }
                        placeholder="Example: Fish are dying suddenly in Pond B"
                        className={fieldClass}
                        maxLength={140}
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Category</label>
                      <select
                        value={ticketForm.category}
                        onChange={(event) =>
                          setTicketForm((prev) => ({ ...prev, category: event.target.value }))
                        }
                        className={fieldClass}
                      >
                        {ticketCategoryOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-1">
                      <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Priority</label>
                      <select
                        value={ticketForm.priority}
                        onChange={(event) =>
                          setTicketForm((prev) => ({ ...prev, priority: event.target.value }))
                        }
                        className={fieldClass}
                      >
                        {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((option) => (
                          <option key={option} value={option}>
                            {priorityLabel(option)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-6">
                      <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                        Description
                      </label>
                      <textarea
                        value={ticketForm.description}
                        onChange={(event) =>
                          setTicketForm((prev) => ({ ...prev, description: event.target.value }))
                        }
                        placeholder="Explain what happened, when it happened, and what you already tried. Add the pond, batch, item, or any other useful detail."
                        rows={4}
                        className={fieldClass}
                        maxLength={1500}
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      For urgent safety problems, protect people and animals first before using app support.
                    </p>
                    <button
                      type="submit"
                      disabled={submittingTicket}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent-primary via-blue-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:brightness-105 disabled:opacity-60"
                    >
                      <SendHorizontal className="h-4 w-4" />
                      {submittingTicket ? "Sending..." : "Send help request"}
                    </button>
                  </div>
                </form>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                  <div className={`${panelClass} p-4 xl:col-span-5`}>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          value={ticketQuery}
                          onChange={(event) => setTicketQuery(event.target.value)}
                          placeholder="Search help requests..."
                          className={searchFieldClass}
                        />
                      </div>
                      <select
                        value={ticketStatusFilter}
                        onChange={(event) => setTicketStatusFilter(event.target.value)}
                        className={fieldClass}
                      >
                        {["ALL", "OPEN", "PENDING", "RESOLVED"].map((status) => (
                          <option key={status} value={status}>
                            {status === "ALL" ? "All" : statusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-3 space-y-2">
                    {filteredTickets.length === 0 ? (
                      <div className={`${panelSoftClass} px-3 py-2 text-sm text-slate-500 dark:text-slate-400`}>
                          No help request matches what you picked yet.
                      </div>
                      ) : (
                        filteredTickets.map((ticket) => (
                          <button
                            key={ticket.id}
                            type="button"
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                              selectedTicket?.id === ticket.id
                                ? "border-accent-primary/45 bg-gradient-to-r from-accent-primary/18 to-cyan-500/12"
                                : "border-white/10 bg-white/5 hover:bg-white/10"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {ticket.id}
                              </span>
                              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClasses(ticket.status)}`}>
                                {statusLabel(ticket.status)}
                              </span>
                            </div>
                            <div className="mt-1 text-sm font-semibold text-lightText dark:text-darkText">
                              {ticket.subject}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span>{ticket.category}</span>
                              <span className={priorityClasses(ticket.priority)}>{priorityLabel(ticket.priority)}</span>
                              <span>{formatDateTime(ticket.updatedAt)}</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div className={`${panelClass} p-4 xl:col-span-7`}>
                    {selectedTicket ? (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{selectedTicket.id}</div>
                            <h3 className="text-base font-header font-semibold text-lightText dark:text-darkText">
                              {selectedTicket.subject}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClasses(selectedTicket.status)}`}>
                              {statusLabel(selectedTicket.status)}
                            </span>
                            {selectedTicket.status !== "RESOLVED" ? (
                              <button
                                type="button"
                                onClick={() => handleChangeTicketStatus("RESOLVED")}
                                disabled={updatingTicketStatus}
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-300/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/20 disabled:opacity-60 dark:text-emerald-100"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Mark fixed
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleChangeTicketStatus("OPEN")}
                                disabled={updatingTicketStatus}
                                className="inline-flex items-center gap-1 rounded-md border border-sky-300/40 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-500/20 disabled:opacity-60 dark:text-sky-100"
                              >
                                Reopen
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-3">
                          <div>Category: {selectedTicket.category}</div>
                          <div className={priorityClasses(selectedTicket.priority)}>
                            Priority: {priorityLabel(selectedTicket.priority)}
                          </div>
                          <div>Last change: {formatDateTime(selectedTicket.updatedAt)}</div>
                        </div>

                        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-3">
                          {(Array.isArray(selectedTicket.messages) ? selectedTicket.messages : []).map((message) => (
                            <div
                              key={message.id}
                              className={`rounded-lg border px-3 py-2 ${
                                message.authorType === "SUPPORT"
                                  ? "border-accent-primary/35 bg-gradient-to-r from-accent-primary/16 to-cyan-500/10"
                                  : "border-white/10 bg-white/10"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="font-semibold">
                                  {message.authorType === "SUPPORT" ? "KFarms Support" : message.authorName}
                                </span>
                                <span>{formatDateTime(message.createdAt)}</span>
                              </div>
                              <p className="mt-1 text-sm text-lightText dark:text-darkText">{message.body}</p>
                            </div>
                          ))}
                        </div>

                        <form onSubmit={handleSendReply} className="mt-3 space-y-2">
                          <textarea
                            value={replyText}
                            onChange={(event) => setReplyText(event.target.value)}
                            placeholder="Add more details or answer the questions here..."
                            rows={3}
                            className={fieldClass}
                          />
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={sendingReply || !replyText.trim()}
                              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent-primary via-blue-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:brightness-105 disabled:opacity-60"
                            >
                              <SendHorizontal className="h-4 w-4" />
                              {sendingReply ? "Sending..." : "Send message"}
                            </button>
                          </div>
                        </form>
                      </>
                    ) : (
                      <div className={`${panelSoftClass} px-4 py-3 text-sm text-slate-500 dark:text-slate-400`}>
                        Choose a help request to read the full conversation here.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "faq" && (
              <div className={`${panelClass} p-5`}>
                <div className="flex items-center gap-2">
                  <CircleHelp className="h-4 w-4 text-accent-primary" />
                  <h2 className="font-header font-semibold">Common questions</h2>
                </div>
                <div className="mt-4 space-y-2">
                  {faqs.map((item) => (
                    <details
                      key={item.id || item.question}
                      className={`${panelSoftClass} px-3 py-2 [&_summary]:cursor-pointer`}
                    >
                      <summary className="text-sm font-semibold text-lightText dark:text-darkText">
                        {item.question}
                      </summary>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-4 xl:col-span-4">
            <div className={`${panelClass} p-4`}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent-primary" />
                <h3 className="font-header font-semibold">Talk to us</h3>
              </div>
              <div className="mt-3 space-y-2">
                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 transition hover:border-accent-primary/30"
                  >
                    <div className="text-xs text-slate-500 dark:text-slate-400">{channel.label}</div>
                    {channel.href ? (
                      <a
                        href={channel.href}
                        className="mt-0.5 inline-flex items-center gap-1 text-sm font-semibold text-lightText transition hover:text-accent-primary dark:text-darkText"
                      >
                        {channel.value}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <div className="mt-0.5 text-sm font-semibold text-lightText dark:text-darkText">
                        {channel.value}
                      </div>
                    )}
                    {channel.note && (
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{channel.note}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-amber-300/40 bg-gradient-to-r from-amber-500/15 to-orange-500/10 p-4 text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <TriangleAlert className="h-4 w-4" />
                Urgent safety issue
              </div>
              <p className="mt-2 text-xs">
                If there is immediate danger to people or poultry stock, contact local emergency services
                first. Use app support after immediate safety actions are complete.
              </p>
            </div>

            <div className={`${panelClass} p-4`}>
              <h3 className="font-header font-semibold">Good first steps</h3>
              <div className="mt-3 space-y-2">
                {[
                  "Review Daily Pond Health Checklist every morning.",
                  "Set inventory reorder thresholds for feed and treatment.",
                  "Log unusual mortality events with timestamp and pond details.",
                  "Use help requests for any problem you want us to track and answer.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
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

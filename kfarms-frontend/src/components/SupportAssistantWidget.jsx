import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bot,
  ExternalLink,
  LifeBuoy,
  MessageCircle,
  RefreshCw,
  SendHorizontal,
  TriangleAlert,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../tenant/TenantContext";
import {
  askSupportAssistant,
  getSupportAssistantConversation,
  resetSupportAssistantConversation,
} from "../services/supportAssistantService";

const DEFAULT_PROMPTS = [
  "Show me a daily pond checklist",
  "How do I avoid feed stockout?",
  "How can I ask for help?",
];

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SupportAssistantWidget() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeTenant, activeTenantId, tenantBootstrapDone } = useTenant();

  const [open, setOpen] = React.useState(false);
  const [loadingConversation, setLoadingConversation] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [source, setSource] = React.useState("api");
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState("");
  const [suggestions, setSuggestions] = React.useState(DEFAULT_PROMPTS);
  const [actions, setActions] = React.useState([]);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [resetting, setResetting] = React.useState(false);

  const bottomRef = React.useRef(null);

  const tenantName = activeTenant?.name || "your farm";
  const userName = user?.username || user?.email || "Farmer";
  const assistantContext = React.useMemo(
    () => ({
      currentPath: location.pathname,
      plan: activeTenant?.plan || "",
      modules: Array.isArray(activeTenant?.modules) ? activeTenant.modules : [],
      role: activeTenant?.myRole || user?.role || "",
    }),
    [activeTenant?.modules, activeTenant?.myRole, activeTenant?.plan, location.pathname, user?.role],
  );
  const assistantModeLabel =
    source === "placeholder"
      ? "Local assistant mode"
      : source === "hybrid"
        ? "Smart assistant mode"
        : "Live assistant mode";

  const applyAssistantPayload = React.useCallback((result = {}) => {
    setMessages(Array.isArray(result.messages) ? result.messages : []);
    setSource(result.source || "api");
    setSuggestions(
      Array.isArray(result.suggestions) && result.suggestions.length > 0
        ? result.suggestions.slice(0, 3)
        : DEFAULT_PROMPTS,
    );
    setActions(Array.isArray(result.actions) ? result.actions.slice(0, 3) : []);
  }, []);

  const loadConversation = React.useCallback(async () => {
    if (!activeTenantId) {
      setMessages([]);
      setActions([]);
      return;
    }
    setLoadingConversation(true);
    setErrorMessage("");
    try {
      const result = await getSupportAssistantConversation({
        tenantId: activeTenantId,
        tenantName,
        userName,
        context: assistantContext,
      });
      applyAssistantPayload(result);
    } catch (error) {
      setErrorMessage(error?.message || "Could not load assistant conversation.");
    } finally {
      setLoadingConversation(false);
    }
  }, [activeTenantId, applyAssistantPayload, assistantContext, tenantName, userName]);

  React.useEffect(() => {
    if (!open) return;
    if (messages.length > 0) return;
    loadConversation();
  }, [loadConversation, messages.length, open]);

  React.useEffect(() => {
    if (!open) return;
    if (!bottomRef.current) return;
    bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open]);

  React.useEffect(() => {
    setMessages([]);
    setSource("api");
    setErrorMessage("");
    setSuggestions(DEFAULT_PROMPTS);
    setActions([]);
  }, [activeTenantId]);

  async function sendMessage(text) {
    const content = String(text || "").trim();
    if (!content || sending) return;
    if (!activeTenantId) {
      setErrorMessage("Choose or create a farm before using the assistant.");
      return;
    }

    setSending(true);
    setErrorMessage("");
    setInput("");

    try {
      const result = await askSupportAssistant({
        tenantId: activeTenantId,
        tenantName,
        userName,
        message: content,
        context: assistantContext,
      });
      applyAssistantPayload(result);
    } catch (error) {
      setErrorMessage(error?.message || "Could not reach support assistant.");
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await sendMessage(input);
  }

  async function handleReset() {
    if (resetting) return;
    if (!activeTenantId) {
      setErrorMessage("Choose or create a farm before clearing this chat.");
      return;
    }
    setResetting(true);
    setErrorMessage("");
    try {
      const result = await resetSupportAssistantConversation({
        tenantId: activeTenantId,
        tenantName,
        userName,
        context: assistantContext,
      });
      applyAssistantPayload(result);
    } catch (error) {
      setErrorMessage(error?.message || "Could not reset assistant conversation.");
    } finally {
      setResetting(false);
    }
  }

  async function handleAction(action) {
    if (!action) return;
    const type = String(action.type || "navigate").toLowerCase();

    if (type === "prompt") {
      const prompt = String(action.message || action.label || "").trim();
      if (prompt) {
        await sendMessage(prompt);
      }
      return;
    }

    const target = String(action.target || "").trim();
    if (!target) return;

    setOpen(false);
    if (/^(https?:|mailto:|tel:)/i.test(target)) {
      window.open(target, "_blank", "noopener,noreferrer");
      return;
    }

    navigate(target);
  }

  return (
    <div className="fixed bottom-24 right-3 z-[75] md:bottom-20 md:right-5">
      {open && (
        <div className="fixed inset-x-3 top-3 bottom-24 flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/80 shadow-neo backdrop-blur-xl dark:border-white/10 dark:bg-darkCard/85 dark:shadow-dark md:absolute md:inset-auto md:bottom-full md:right-0 md:mb-3 md:w-[min(92vw,390px)] md:max-h-[min(80vh,720px)]">
          <div className="relative shrink-0 bg-gradient-to-r from-indigo-500/90 via-sky-500/85 to-emerald-500/90 px-4 py-3 pr-12 text-white">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/55 bg-black/25 text-white shadow-sm transition hover:bg-black/35"
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]">
                  <Bot className="h-3 w-3" />
                  Kfarms Assistant
                </div>
                <h3 className="mt-1 text-sm font-semibold">Farmer Chat Support</h3>
                <p className="text-[11px] text-blue-50/90">
                  Ask about pond care, feeds, inventory, sales, and support steps.
                </p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 pb-4">
            {!activeTenantId && tenantBootstrapDone && (
              <div className="rounded-lg border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                <div className="flex items-center gap-1.5 font-semibold">
                  <TriangleAlert className="h-3.5 w-3.5" />
                  Farm needed
                </div>
                <p className="mt-1">
                  Assistant chat works after you choose or create a farm.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/onboarding/create-tenant")}
                  className="mt-2 inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold transition hover:bg-amber-500/30"
                >
                  Create farm
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-300">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {assistantModeLabel}
              </span>
              <button
                type="button"
                onClick={handleReset}
                disabled={resetting}
                className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[11px] font-semibold transition hover:bg-white/20 disabled:opacity-60"
              >
                <RefreshCw className={`h-3 w-3 ${resetting ? "animate-spin" : ""}`} />
                Reset
              </button>
            </div>

            <div className="max-h-[42vh] min-h-[220px] space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-white/40 p-2 dark:bg-white/5 md:max-h-[46vh] md:min-h-[240px]">
              {loadingConversation ? (
                <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs text-slate-500 dark:text-slate-300">
                  Loading assistant conversation...
                </div>
              ) : messages.length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs text-slate-500 dark:text-slate-300">
                  Start by asking a farm operations question.
                </div>
              ) : (
                messages.map((message) => {
                  const fromUser = message.role === "user";
                  return (
                    <div key={message.id} className={`flex ${fromUser ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[88%] rounded-xl px-3 py-2 text-sm ${
                          fromUser
                            ? "bg-accent-primary text-white"
                            : "border border-white/15 bg-white/80 text-slate-700 dark:bg-white/10 dark:text-slate-100"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <div
                          className={`mt-1 text-[10px] ${
                            fromUser ? "text-white/75" : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {formatTime(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {errorMessage && (
              <div className="rounded-lg border border-red-300/40 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-200">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  disabled={sending || !activeTenantId}
                  className="rounded-full border border-white/20 bg-white/50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-white/70 disabled:opacity-60 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {actions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {actions.map((action) => (
                  <button
                    key={action.id || `${action.type}-${action.label}`}
                    type="button"
                    onClick={() => handleAction(action)}
                    disabled={sending || resetting || !activeTenantId}
                    className="inline-flex items-center gap-1 rounded-full border border-accent-primary/25 bg-accent-primary/10 px-3 py-1 text-[11px] font-semibold text-accent-primary transition hover:bg-accent-primary/15 disabled:opacity-60 dark:text-blue-200"
                  >
                    {action.label}
                    {action.type === "navigate" ? <ExternalLink className="h-3 w-3" /> : null}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={2}
                placeholder="Ask the assistant anything about your farm operations..."
                disabled={!activeTenantId}
                className="w-full rounded-xl border border-white/15 bg-white/60 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-accent-primary/50 dark:bg-white/10 dark:text-slate-100"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/support")}
                    className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-white/20 dark:text-slate-200"
                  >
                    <LifeBuoy className="h-3.5 w-3.5" />
                    Support Center
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/billing")}
                    className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-white/20 dark:text-slate-200"
                  >
                    Billing
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={sending || !input.trim() || !activeTenantId}
                  className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-accent-primary px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60 sm:w-auto sm:py-1.5"
                >
                  {sending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <SendHorizontal className="h-3.5 w-3.5" />}
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className="group inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-accent-primary/40 bg-accent-primary text-sm font-semibold text-white shadow-soft transition-all duration-300 hover:w-36 hover:justify-start hover:px-4 focus-visible:w-36 focus-visible:justify-start focus-visible:px-4"
        aria-label="Open support assistant"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="ml-0 max-w-0 whitespace-nowrap opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-[84px] group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-[84px] group-focus-visible:opacity-100">
          Assistant
        </span>
      </button>
    </div>
  );
}

import apiClient from "../api/apiClient";
import {
  normalizeKfarmsLegacyPath,
  toKfarmsAppPath,
} from "../apps/kfarms/paths";
import { getPlanById, isPlanAtLeast, normalizePlanId } from "../constants/plans";

const ASSISTANT_STORAGE_KEY = "kf-placeholder-support-assistant";

const ASSISTANT_ENDPOINTS = {
  chat: "/support/chat",
  conversation: "/support/chat/conversation",
};

const DEFAULT_FALLBACK_PROMPTS = Object.freeze([
  "What needs attention today?",
  "How do I avoid feed stockout?",
  "How can I ask for help?",
]);

const KAI_NAME = "KAI";

const GREETING_PHRASES = Object.freeze([
  "hi",
  "hello",
  "hey",
  "hey there",
  "hello there",
  "good morning",
  "good afternoon",
  "good evening",
  "howdy",
]);

const HOW_ARE_YOU_PHRASES = Object.freeze([
  "how are you",
  "how are you doing",
  "how are things",
  "how is it going",
  "how's it going",
]);

const THANKS_PHRASES = Object.freeze([
  "thanks",
  "thank you",
  "thanks a lot",
  "thank you so much",
  "appreciate it",
  "nice one",
]);

const GOODBYE_PHRASES = Object.freeze([
  "bye",
  "goodbye",
  "see you",
  "see you later",
  "talk later",
  "talk to you later",
  "catch you later",
]);

const IDENTITY_PHRASES = Object.freeze([
  "who are you",
  "what are you",
  "what is your name",
  "what's your name",
  "your name",
]);

const CAPABILITY_PHRASES = Object.freeze([
  "help",
  "help me",
  "i need help",
  "can you help",
  "can you help me",
  "what can you do",
  "what do you do",
  "how can you help",
  "what can i ask you",
]);

const FOLLOW_UP_PATTERN =
  /\b(what next|next step|and then|after that|what else|more detail|expand|break it down|can you explain|what about that|how do i do that)\b/i;
const CHECKLIST_PATTERN =
  /\b(checklist|steps|routine|walk me through|what should i check|daily check|inspection)\b/i;
const NAVIGATION_PATTERN = /\b(open|take me|go to|show me|navigate|where do i find)\b/i;
const TROUBLESHOOT_PATTERN =
  /\b(urgent|problem|issue|error|failed|not working|can't|cannot|mortality|outbreak|sick|stressed)\b/i;
const SUMMARY_PATTERN =
  /\b(today|this week|last 7 days|summary|overview|status|how are|what needs attention)\b/i;
const PLANNING_PATTERN =
  /\b(avoid|prevent|plan|reorder|budget|control|improve|best practice|priority)\b/i;
const DETAIL_PATTERN =
  /\b(what details|what fields|what should include|what do i track|what to track|mandatory)\b/i;
const ACTION_PATTERN =
  /\b(add|create|record|log|enter|save|update|change|invite|onboard|set up|setup)\b/i;
const LIVE_DATA_PATTERN =
  /\b(how much|how many|how are|today|this week|last 7 days|current|latest|profit|revenue|stock|count|total)\b/i;
const SNAPSHOT_REPLY_PATTERN =
  /\b(workspace snapshot|inventory:|tasks:|priority attention|unread alerts|ask me about inventory)\b/i;

const TOPIC_CONFIG = Object.freeze({
  dashboard: {
    label: "dashboard",
    route: "/dashboard",
    keywords: ["dashboard", "today", "attention", "overview", "summary", "status"],
  },
  fish: {
    label: "fish ponds",
    route: "/fish-ponds",
    keywords: [
      "pond",
      "fish",
      "oxygen",
      "water",
      "aeration",
      "hatch",
      "fingerling",
      "mortality",
      "ammonia",
      "feeding response",
    ],
  },
  feeds: {
    label: "feeds",
    route: "/feeds",
    keywords: [
      "feed",
      "stockout",
      "nutrition",
      "fcr",
      "biomass",
      "ration",
      "pellet",
      "mash",
      "feed room",
    ],
  },
  inventory: {
    label: "inventory",
    route: "/inventory",
    keywords: [
      "inventory",
      "stock",
      "reorder",
      "supplies",
      "consumable",
      "medicine",
      "restock",
      "low stock",
    ],
  },
  poultry: {
    label: "poultry",
    route: "/poultry",
    keywords: [
      "poultry",
      "egg",
      "layer",
      "broiler",
      "bird",
      "flock",
      "livestock",
      "production",
      "shell",
    ],
  },
  sales: {
    label: "sales",
    route: "/sales",
    keywords: [
      "sale",
      "sales",
      "sell",
      "new sale",
      "record sale",
      "cash",
      "invoice",
      "revenue",
      "buyer",
      "customer",
      "payment",
      "receipt",
    ],
  },
  billing: {
    label: "billing",
    route: "/billing",
    keywords: [
      "billing",
      "payment",
      "subscription",
      "plan",
      "upgrade",
      "downgrade",
      "enterprise",
      "pro",
      "receipt",
    ],
  },
  team: {
    label: "workspace access",
    route: "/users",
    keywords: [
      "team",
      "invite",
      "user",
      "member",
      "workspace",
      "role",
      "audit",
      "permission",
      "staff",
    ],
  },
  support: {
    label: "support",
    route: "/support",
    keywords: ["support", "help", "ticket", "guide", "faq", "assistant", "bug"],
  },
});

function nowIso() {
  return new Date().toISOString();
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizePhrase(value) {
  return normalizeText(value)
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeRole(value, fallback = "assistant") {
  const normalized = normalizeText(value);
  if (normalized === "user" || normalized === "assistant" || normalized === "system") {
    return normalized;
  }
  return fallback;
}

function normalizeMessage(entry = {}) {
  return {
    id: String(entry.id || `AST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
    role: normalizeRole(entry.role),
    content: String(entry.content || entry.message || "").trim(),
    createdAt: entry.createdAt || entry.timestamp || nowIso(),
  };
}

function normalizeAction(entry = {}) {
  const label = String(entry.label || entry.title || "").trim();
  if (!label) return null;
  const type = normalizeText(entry.type || "navigate");
  const target = String(entry.target || entry.href || "").trim();
  const message = String(entry.message || entry.prompt || "").trim();
  return {
    id: String(entry.id || `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
    label,
    type: type === "prompt" ? "prompt" : "navigate",
    target: type === "prompt" || !target ? target : toKfarmsAppPath(target),
    message,
  };
}

function normalizeSuggestions(list = [], fallback = []) {
  return Array.from(
    new Set(
      [...(Array.isArray(list) ? list : []), ...(Array.isArray(fallback) ? fallback : [])]
        .map((entry) => String(entry ?? "").trim())
        .filter(Boolean),
    ),
  ).slice(0, 3);
}

function normalizeActions(list = [], fallback = []) {
  const primary = (Array.isArray(list) ? list : [])
    .map((entry) => normalizeAction(entry))
    .filter(Boolean);
  if (primary.length > 0) {
    return primary.slice(0, 3);
  }
  return (Array.isArray(fallback) ? fallback : [])
    .map((entry) => normalizeAction(entry))
    .filter(Boolean)
    .slice(0, 3);
}

function shouldUsePlaceholder(error) {
  const status = error?.response?.status;
  if (!error?.response) return true;
  return [404, 405, 501, 502, 503].includes(status);
}

function extractErrorMessage(error, fallback) {
  const payload = error?.response?.data;
  if (typeof payload === "string" && payload.trim()) return payload;
  if (typeof payload?.message === "string" && payload.message.trim()) return payload.message;
  if (typeof payload?.error === "string" && payload.error.trim()) return payload.error;
  return fallback;
}

function readStorageMap(key) {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorageMap(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getTenantKey(tenantId) {
  const parsed = Number(tenantId);
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : "default";
}

function normalizeHistory(list = []) {
  return (Array.isArray(list) ? list : [])
    .map((entry) => normalizeMessage(entry))
    .filter((entry) => Boolean(entry.content));
}

function getConversationForTenant(tenantId) {
  const key = getTenantKey(tenantId);
  const map = readStorageMap(ASSISTANT_STORAGE_KEY);
  return normalizeHistory(map[key]);
}

function setConversationForTenant(tenantId, messages = []) {
  const key = getTenantKey(tenantId);
  const map = readStorageMap(ASSISTANT_STORAGE_KEY);
  map[key] = normalizeHistory(messages);
  writeStorageMap(ASSISTANT_STORAGE_KEY, map);
  return map[key];
}

function normalizeModules(context = {}) {
  const source = Array.isArray(context.modules)
    ? context.modules
    : Array.isArray(context.enabledModules)
      ? context.enabledModules
      : [];

  const modules = source
    .map((entry) =>
      String(entry ?? "")
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, "_"),
    )
    .filter(Boolean);

  if (modules.length > 0) return Array.from(new Set(modules));
  return ["POULTRY", "FISH_FARMING"];
}

function getAssistantPlanId(context = {}) {
  return normalizePlanId(context.plan, "FREE");
}

function getAssistantPlanMeta(context = {}) {
  return getPlanById(getAssistantPlanId(context), "FREE");
}

function getAssistantLabel(context = {}) {
  const plan = getAssistantPlanMeta(context);
  return plan.assistantLabel || `${KAI_NAME} ${plan.name}`;
}

function getAssistantSummary(context = {}) {
  const plan = getAssistantPlanMeta(context);
  return (
    plan.assistantSummary ||
    "Farm guidance, decision support, and support handoff for your workspace."
  );
}

function buildAssistantTransportLabel({ source = "api", context = {} } = {}) {
  const label = getAssistantLabel(context);
  if (source === "placeholder") return `${label} local mode`;
  if (source === "hybrid") return `${label} smart mode`;
  return `${label} live mode`;
}

function hasModule(context, moduleId) {
  return normalizeModules(context).includes(moduleId);
}

function inferRouteLabel(context = {}) {
  const routeTopic = inferTopicFromRoute(context.currentPath);
  return routeTopic ? TOPIC_CONFIG[routeTopic]?.label || "" : "";
}

function formatTitleCase(value) {
  return String(value ?? "").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function inferTopicFromRoute(pathname) {
  const normalizedPath = normalizeKfarmsLegacyPath(pathname).toLowerCase();
  if (!normalizedPath) return "";

  return (
    Object.entries(TOPIC_CONFIG).find(([, config]) =>
      normalizedPath === config.route || normalizedPath.startsWith(`${config.route}/`),
    )?.[0] || ""
  );
}

function scoreTopic(topic, text) {
  const keywords = TOPIC_CONFIG[topic]?.keywords || [];
  return keywords.reduce((score, keyword) => {
    if (!text.includes(keyword)) return score;
    return score + (keyword.includes(" ") ? 3 : 2);
  }, 0);
}

function inferRecentTopic(history = [], fallbackTopic = "") {
  const recentUserMessages = history
    .filter((entry) => normalizeRole(entry.role) === "user")
    .map((entry) => String(entry.content || "").trim())
    .filter(Boolean)
    .reverse();

  for (const content of recentUserMessages) {
    const topic = inferTopic(content, [], {});
    if (topic && topic !== "general") {
      return topic;
    }
  }

  return fallbackTopic || "general";
}

function inferTopic(message, history = [], context = {}) {
  const text = normalizeText(message);
  const routeTopic = inferTopicFromRoute(context.currentPath);

  if (FOLLOW_UP_PATTERN.test(text) || text.split(/\s+/).filter(Boolean).length <= 4) {
    return inferRecentTopic(history, routeTopic || "general");
  }

  const scoredTopics = Object.keys(TOPIC_CONFIG).map((topic) => ({
    topic,
    score: scoreTopic(topic, text) + (routeTopic === topic ? 1 : 0),
  }));
  const winner = scoredTopics.sort((left, right) => right.score - left.score)[0];

  if (winner?.score > 0) {
    return winner.topic;
  }

  if (SUMMARY_PATTERN.test(text)) {
    return "dashboard";
  }

  return routeTopic || "general";
}

function detectConversationalIntent(message) {
  const phrase = normalizePhrase(message);
  if (!phrase) return "";
  if (GREETING_PHRASES.includes(phrase)) return "greeting";
  if (HOW_ARE_YOU_PHRASES.includes(phrase)) return "how_are_you";
  if (THANKS_PHRASES.includes(phrase)) return "thanks";
  if (GOODBYE_PHRASES.includes(phrase)) return "goodbye";
  if (IDENTITY_PHRASES.includes(phrase)) return "identity";
  if (CAPABILITY_PHRASES.includes(phrase)) return "capabilities";
  return "";
}

function inferIntent(message, topic) {
  const text = normalizeText(message);

  if (NAVIGATION_PATTERN.test(text)) return "navigate";
  if (ACTION_PATTERN.test(text)) return "action";
  if (CHECKLIST_PATTERN.test(text)) return "checklist";
  if (TROUBLESHOOT_PATTERN.test(text)) return "troubleshoot";
  if (SUMMARY_PATTERN.test(text)) return "summary";
  if (PLANNING_PATTERN.test(text)) return "planning";
  if (DETAIL_PATTERN.test(text)) return "details";
  if (FOLLOW_UP_PATTERN.test(text)) return "follow_up";
  return topic === "general" ? "clarify" : "guidance";
}

function asksForLiveData(message, topic, intent) {
  if (!LIVE_DATA_PATTERN.test(normalizeText(message))) return false;
  return ["dashboard", "feeds", "inventory", "sales", "billing"].includes(topic) ||
    intent === "summary";
}

function looksLikeWorkspaceSnapshotReply(reply = "") {
  const normalized = normalizeText(reply);
  if (!normalized) return false;
  if (normalized.includes("workspace snapshot")) return true;
  const matchedSignals = [
    normalized.includes("inventory:"),
    normalized.includes("tasks:"),
    normalized.includes("priority attention"),
    normalized.includes("unread alerts"),
    normalized.includes("ask me about inventory"),
    SNAPSHOT_REPLY_PATTERN.test(normalized),
  ].filter(Boolean).length;
  return matchedSignals >= 2;
}

function isDashboardSnapshotRequest(message = "", topic = "", intent = "") {
  const normalized = normalizeText(message);
  if (topic !== "dashboard") return false;
  if (intent === "summary") return true;
  return /\b(snapshot|overview|status|attention|dashboard|current workspace)\b/.test(normalized);
}

function shouldPreferLocalTopicReply({
  assistantText = "",
  message = "",
  topic = "",
  intent = "",
} = {}) {
  if (!looksLikeWorkspaceSnapshotReply(assistantText)) return false;
  return !isDashboardSnapshotRequest(message, topic, intent);
}

function buildSupportTicketTarget({
  category = "General",
  priority = "MEDIUM",
  subject = "Need help from KFarms",
  description = "Please help check a problem on my farm.",
} = {}) {
  const params = new URLSearchParams({
    tab: "tickets",
    category,
    priority,
    subject,
    description,
  });
  return `${toKfarmsAppPath("/support")}?${params.toString()}`;
}

function buildStarterSuggestions(context = {}) {
  const planId = getAssistantPlanId(context);
  const suggestions = ["What needs attention today?"];
  if (hasModule(context, "FISH_FARMING")) {
    suggestions.push("Show me a daily pond checklist");
  }
  if (isPlanAtLeast(planId, "PRO")) {
    suggestions.push("Build a priority plan for today");
    suggestions.push("How do I avoid feed stockout this week?");
  } else {
    suggestions.push("How do I avoid feed stockout?");
    suggestions.push(
      hasModule(context, "POULTRY")
        ? "What should I check in poultry today?"
        : "How are sales this week?",
    );
  }
  if (planId === "ENTERPRISE") {
    suggestions.push("What should leaders escalate today?");
  }
  return normalizeSuggestions(suggestions, DEFAULT_FALLBACK_PROMPTS);
}

function buildStarterActions(context = {}) {
  const planId = getAssistantPlanId(context);
  const actions = [
    { type: "navigate", label: "Open Dashboard", target: "/dashboard" },
    hasModule(context, "FISH_FARMING")
      ? { type: "navigate", label: "Open Fish Ponds", target: "/fish-ponds" }
      : { type: "navigate", label: "Open Feeds", target: "/feeds" },
    planId === "ENTERPRISE"
      ? { type: "navigate", label: "Open Users", target: "/users" }
      : planId === "PRO"
        ? { type: "navigate", label: "Open Inventory", target: "/inventory" }
        : { type: "navigate", label: "Open Support", target: "/support" },
  ];
  return normalizeActions(actions);
}

function buildConversationalSuggestions(intent, context = {}) {
  if (intent === "thanks" || intent === "goodbye") {
    return normalizeSuggestions(
      [
        "What needs attention today?",
        hasModule(context, "FISH_FARMING")
          ? "Show me a daily pond checklist"
          : "How do I avoid feed stockout?",
        "How can I ask for help?",
      ],
      DEFAULT_FALLBACK_PROMPTS,
    );
  }

  return normalizeSuggestions(
    [
      "What needs attention today?",
      hasModule(context, "FISH_FARMING")
        ? "Show me a daily pond checklist"
        : "How do I avoid feed stockout?",
      "How are sales this week?",
    ],
    DEFAULT_FALLBACK_PROMPTS,
  );
}

function buildConversationalActions(intent, context = {}) {
  const routeLabel = inferRouteLabel(context);
  const routeActionLabel = formatTitleCase(routeLabel);
  const routeTopic = inferTopicFromRoute(context.currentPath);
  const routeTarget = routeTopic ? TOPIC_CONFIG[routeTopic]?.route || "" : "";

  if (intent === "goodbye") {
    return normalizeActions([
      routeLabel && routeTarget
        ? { type: "navigate", label: `Open ${routeActionLabel}`, target: routeTarget }
        : { type: "navigate", label: "Open Dashboard", target: "/dashboard" },
      { type: "navigate", label: "Open Support", target: "/support" },
    ]);
  }

  return normalizeActions([
    routeLabel && routeTarget
      ? { type: "navigate", label: `Open ${routeActionLabel}`, target: routeTarget }
      : { type: "navigate", label: "Open Dashboard", target: "/dashboard" },
    hasModule(context, "FISH_FARMING")
      ? {
          type: "prompt",
          label: "Pond checklist",
          message: "Show me a daily pond checklist",
        }
      : {
          type: "prompt",
          label: "Feed planning",
          message: "How do I avoid feed stockout?",
        },
    { type: "navigate", label: "Open Support", target: "/support" },
  ]);
}

function buildConversationalReply({
  intent,
  history = [],
  context = {},
  userName = "Farmer",
  tenantName = "your farm",
} = {}) {
  const routeLabel = inferRouteLabel(context);
  const assistantLabel = getAssistantLabel(context);
  const assistantSummary = getAssistantSummary(context);
  const routeHint = routeLabel
    ? `We can start with ${routeLabel} since that is where you are now, or jump anywhere else.`
    : "We can do a quick farm check-in or jump into any area you want.";
  const userHasSpokenBefore = history.some((entry) => normalizeRole(entry.role) === "user");

  switch (intent) {
    case "greeting":
      return userHasSpokenBefore
        ? `Hi again ${userName}. ${assistantLabel} is here with you for ${tenantName}. ${routeHint} What would you like help with today?`
        : `Hi ${userName}. Nice to hear from you. ${assistantLabel} is here with you for ${tenantName}. ${routeHint} What would you like help with today?`;
    case "how_are_you":
      return `I am doing well and ready to help. ${assistantLabel} is tuned for ${tenantName}. ${routeHint}`;
    case "thanks":
      return "Anytime. If you want, I can help with the next step too.";
    case "goodbye":
      return `See you soon ${userName}. Come back anytime you want a quick checklist, a review flow, or help finding the right page.`;
    case "identity":
      return `I am ${assistantLabel} for ${tenantName}. ${assistantSummary}`;
    case "capabilities":
      return [
        "Absolutely.",
        `${assistantLabel} can help with quick farm check-ins, pond routines, feed planning, inventory control, poultry reviews, sales follow-up, billing questions, team access, and support steps.`,
        assistantSummary,
        "Tell me what you are trying to do, and I will keep it practical.",
      ].join(" ");
    default:
      return "";
  }
}

function buildWelcomeMessage({
  userName = "Farmer",
  tenantName = "your farm",
  context = {},
} = {}) {
  const assistantLabel = getAssistantLabel(context);
  const assistantSummary = getAssistantSummary(context);
  const focusAreas = [
    hasModule(context, "FISH_FARMING") ? "pond checks and fish health" : "",
    "feed planning and stock control",
    hasModule(context, "POULTRY") ? "poultry records and egg output" : "",
    "sales review",
    "billing and support",
  ].filter(Boolean);

  return normalizeMessage({
    role: "assistant",
    content:
      `Hi ${userName}. I am ${assistantLabel} for ${tenantName}. ` +
      `${assistantSummary} ` +
      `I can help with ${focusAreas.join(", ")}. ` +
      "Ask me for a checklist, a troubleshooting plan, a weekly review flow, or the best page to open next.",
    createdAt: nowIso(),
  });
}

function ensureInitializedConversation({
  tenantId,
  tenantName,
  userName,
  context = {},
} = {}) {
  const existing = getConversationForTenant(tenantId);
  if (existing.length > 0) return existing;
  const initial = [buildWelcomeMessage({ tenantName, userName, context })];
  return setConversationForTenant(tenantId, initial);
}

function buildLiveDataNote(message, topic, intent) {
  if (!asksForLiveData(message, topic, intent)) return "";
  return "";
}

function buildPlanAwareLiveDataNote(message, topic, intent, context = {}) {
  const fallback = buildLiveDataNote(message, topic, intent);
  if (!asksForLiveData(message, topic, intent)) return fallback;
  return `${buildAssistantTransportLabel({ source: "placeholder", context })} cannot read live totals yet, but I can point you to the fastest review flow:`;
}

function buildGradeCoaching({ topic, context = {} } = {}) {
  const planId = getAssistantPlanId(context);

  if (!isPlanAtLeast(planId, "PRO")) {
    return "";
  }

  const proNotes = {
    dashboard: [
      "KAI Pro move:",
      "- Turn the first two issues into named actions before midday.",
      "- Recheck the same priorities before close of day.",
    ].join("\n"),
    fish: [
      "KAI Pro move:",
      "- Assign one owner for response, one owner for logging, and review trend changes for 7 days.",
      "- Compare water, feed, and mortality changes before adjusting treatment.",
    ].join("\n"),
    feeds: [
      "KAI Pro move:",
      "- Track weekly usage drift and supplier lead-time changes before updating reorder levels.",
      "- Review wastage and emergency purchases in one short weekly loop.",
    ].join("\n"),
    inventory: [
      "KAI Pro move:",
      "- Separate critical stock from routine stock and review both on different rhythms.",
      "- Assign restock ownership so low-stock warnings always have a next step.",
    ].join("\n"),
    poultry: [
      "KAI Pro move:",
      "- Compare current flock performance with stage, feed intake, and recent losses before changing action.",
      "- Escalate repeated drops early instead of waiting for a larger dip.",
    ].join("\n"),
    sales: [
      "KAI Pro move:",
      "- Review unpaid balances, top products, and weekly sales accuracy in one pass.",
      "- Tie sales follow-up to stock movement so cashflow and stock stay aligned.",
    ].join("\n"),
    billing: [
      "KAI Pro move:",
      "- Keep a named owner, payment reference, and follow-up note for every billing issue.",
      "- Review plan fit monthly so tools and team size stay aligned.",
    ].join("\n"),
    team: [
      "KAI Pro move:",
      "- Review access after role changes and major incidents, not just during onboarding.",
      "- Keep sensitive actions limited to the smallest practical group.",
    ].join("\n"),
    support: [
      "KAI Pro move:",
      "- Include impact, urgency, and what you already tried so support can act faster.",
    ].join("\n"),
    general: [
      "KAI Pro move:",
      "- Turn advice into named actions, owners, and a review time.",
    ].join("\n"),
  };

  if (planId !== "ENTERPRISE") {
    return proNotes[topic] || proNotes.general;
  }

  const enterpriseNotes = {
    dashboard: [
      "KAI Enterprise lens:",
      "- Use the same daily review pattern across teams so exceptions are comparable.",
      "- Escalate issues that threaten output, cash, compliance, or customer delivery.",
    ].join("\n"),
    fish: [
      "KAI Enterprise lens:",
      "- Standardize pond incident response across teams and log exceptions the same way everywhere.",
      "- Review repeated water or mortality problems as an operations pattern, not a one-off.",
    ].join("\n"),
    feeds: [
      "KAI Enterprise lens:",
      "- Standardize reorder logic, supplier assumptions, and approval thresholds across operations.",
      "- Flag sites or teams that drift from planned usage too often.",
    ].join("\n"),
    inventory: [
      "KAI Enterprise lens:",
      "- Separate operating stock, emergency stock, and controlled stock with clear ownership.",
      "- Escalate repeated count mismatches or emergency buys into a process review.",
    ].join("\n"),
    poultry: [
      "KAI Enterprise lens:",
      "- Use one playbook for daily checks, exception logging, and escalation across all teams.",
      "- Review flock drops with both site context and management response quality.",
    ].join("\n"),
    sales: [
      "KAI Enterprise lens:",
      "- Review collections, overdue balances, and reporting accuracy across managers, not just one site.",
      "- Escalate stale receivables before they distort planning.",
    ].join("\n"),
    billing: [
      "KAI Enterprise lens:",
      "- Keep billing ownership, references, and approval flow visible for leadership review.",
      "- Match subscription posture to rollout stage and workspace growth.",
    ].join("\n"),
    team: [
      "KAI Enterprise lens:",
      "- Use role templates, review checkpoints, and audit follow-up for sensitive access.",
      "- Escalate recurring access mistakes into policy updates, not just one-off fixes.",
    ].join("\n"),
    support: [
      "KAI Enterprise lens:",
      "- Every escalation should include owner, business impact, affected workflow, and expected response window.",
    ].join("\n"),
    general: [
      "KAI Enterprise lens:",
      "- Standardize the workflow, define escalation points, and review exceptions at leadership level.",
    ].join("\n"),
  };

  return enterpriseNotes[topic] || enterpriseNotes.general;
}

function appendGradeCoaching(reply = "", options = {}) {
  const trimmedReply = String(reply || "").trim();
  const coaching = buildGradeCoaching(options);
  if (!trimmedReply || !coaching) return trimmedReply;
  return `${trimmedReply}\n\n${coaching}`;
}

function buildDashboardReply({ tenantName, context, message, intent }) {
  const liveNote = buildPlanAwareLiveDataNote(message, "dashboard", intent, context);
  const lines = [liveNote || `For ${tenantName}, start with this quick daily review:`];

  lines.push("- Dashboard: scan overdue tasks first, then anything due soon or marked urgent.");
  if (hasModule(context, "FISH_FARMING")) {
    lines.push("- Fish ponds: confirm oxygen, aeration flow, fish behavior, and any mortality before first feed.");
  }
  if (hasModule(context, "POULTRY")) {
    lines.push("- Poultry: review flock losses, water flow, feed intake, and egg collection quality.");
  }
  lines.push("- Feeds and inventory: restock anything at or below reorder level before the workday gets busy.");
  lines.push("- Sales and cash: reconcile recent sales, receipts, and unpaid balances.");
  lines.push("Ask me to zoom into ponds, feeds, inventory, poultry, sales, billing, or support.");
  return appendGradeCoaching(lines.join("\n"), { topic: "dashboard", context });
}

function buildFishReply({ intent, isFollowUp }) {
  if (intent === "checklist") {
    return [
      "Use this 10-minute pond checklist:",
      "- Observe fish behavior before first feed.",
      "- Check oxygen, temperature, water color, inflow, and aeration.",
      "- Remove dead fish and log the count immediately.",
      "- Feed only if response is normal.",
      "- Recheck the pond later in the day and record any change.",
    ].join("\n");
  }

  if (intent === "troubleshoot") {
    return [
      "Treat unusual pond stress as urgent. Do this in order:",
      "- Increase aeration first.",
      "- Reduce or pause feeding until fish behavior improves.",
      "- Check oxygen, temperature, and any sudden water-quality change.",
      "- Record the pond, time, symptoms, mortality count, and recent feed or water changes.",
      "- Escalate through Support if the issue continues after the first response.",
    ].join("\n");
  }

  if (isFollowUp) {
    return [
      "Next, turn the checks into a short operating loop:",
      "- Compare today's oxygen and pond readings with yesterday's values.",
      "- Flag any pond with weaker feeding response or surface gasping.",
      "- Log the issue immediately so the team follows one plan.",
      "- If stress continues, open Fish Ponds and create a help request with the readings.",
    ].join("\n");
  }

  return [
    "For fish ponds, keep the routine simple and consistent:",
    "- Check water and behavior before changing feed.",
    "- Use feeding response as a signal, not just appetite.",
    "- Investigate oxygen and aeration before assuming feed is the problem.",
    "- Log mortality and unusual behavior the same day.",
  ].join("\n");
}

function buildFeedsReply({ message, intent, isFollowUp, context = {} }) {
  const liveNote = buildPlanAwareLiveDataNote(message, "feeds", intent, context);

  if (intent === "checklist") {
    return [
      "Use this daily feed-control checklist:",
      "- Confirm opening stock for each fast-moving feed type.",
      "- Compare planned feed against what was actually dispensed.",
      "- Check for damp bags, spoilage, or torn packaging.",
      "- Review items already touching reorder level.",
      "- Record unusual consumption before the next restock decision.",
    ].join("\n");
  }

  if (intent === "planning" || /stockout/.test(normalizeText(message))) {
    return [
      "To avoid feed stockout, use this simple reorder rule:",
      "- Reorder level = average weekly usage x supplier lead time in weeks + safety buffer.",
      "- Keep the safety buffer higher for fast-moving feed or delayed suppliers.",
      "- Review planned feed versus actual feed every day.",
      "- Restock before the item becomes urgent, not after it hits zero.",
    ].join("\n");
  }

  if (isFollowUp) {
    return [
      "Next, tighten the planning loop:",
      "- Calculate average weekly use for each feed type.",
      "- Separate fast-moving feed from slow-moving feed.",
      "- Put reorder alerts on the critical items first.",
      "- Review feed cost and wastage at least once a week.",
    ].join("\n");
  }

  return [
    liveNote || "For feed control, focus on predictability:",
    "- Track daily usage, not just restock dates.",
    "- Match feed planning to biomass or flock stage.",
    "- Review low-stock items every morning.",
    "- Use Feeds and Inventory together so reorder decisions are grounded in real usage.",
  ].join("\n");
}

function buildInventoryReply({ message, intent, isFollowUp, context = {} }) {
  const liveNote = buildPlanAwareLiveDataNote(message, "inventory", intent, context);

  if (intent === "action") {
    return [
      "To update inventory cleanly:",
      "- Open Inventory.",
      "- Add the item or select an existing one.",
      "- Enter the quantity, unit, and the reason for the change.",
      "- Save the update, then confirm the new balance matches the physical stock.",
      "- Review low-stock and reorder items before you leave the page.",
    ].join("\n");
  }

  if (intent === "planning" || /reorder|priority|critical/.test(normalizeText(message))) {
    return [
      "Prioritize inventory in this order:",
      "- Life-critical items: oxygen-related spares, treatment supplies, and water-check tools.",
      "- High-use items: feed, supplements, packaging, and cleaning consumables.",
      "- Operating support items: repairs, forms, PPE, and general supplies.",
      "- Give the first two groups the tightest reorder levels and review them daily.",
    ].join("\n");
  }

  if (intent === "checklist") {
    return [
      "Use this stock review routine:",
      "- Check anything already at or below reorder level.",
      "- Confirm physical count versus recorded count on critical items.",
      "- Note supplier lead time before deciding the restock quantity.",
      "- Restock low-stock items before moving on to non-critical supplies.",
    ].join("\n");
  }

  if (isFollowUp) {
    return [
      "Next, turn that into a weekly control habit:",
      "- Count critical items on a fixed day each week.",
      "- Track usage spikes after farm events or health issues.",
      "- Separate emergency stock from normal operating stock.",
      "- Review reorder levels whenever supplier timing changes.",
    ].join("\n");
  }

  return [
    liveNote || "For inventory, keep reorder decisions simple and disciplined:",
    "- Define critical items clearly.",
    "- Set reorder levels based on usage and lead time.",
    "- Verify the physical count before large restocks.",
    "- Review low-stock alerts before the workday gets busy.",
  ].join("\n");
}

function buildPoultryReply({ intent, isFollowUp }) {
  if (intent === "checklist") {
    return [
      "Use this poultry daily checklist:",
      "- Check water flow and feed intake early.",
      "- Remove dead birds and record mortality the same day.",
      "- Review egg collection volume and shell quality.",
      "- Watch for changes in movement, appetite, or sound.",
      "- Log anything unusual before the next shift.",
    ].join("\n");
  }

  if (isFollowUp) {
    return [
      "Next, connect the daily checks to decisions:",
      "- Compare today's output against the recent pattern.",
      "- Investigate any sudden drop in feed intake or egg collection.",
      "- Keep flock stage in mind before changing feed or medication.",
      "- Escalate health concerns early instead of waiting for a bigger drop.",
    ].join("\n");
  }

  return [
    "For poultry, consistency wins:",
    "- Check feed, water, mortality, and production on the same rhythm every day.",
    "- Record problems the same day so the team responds early.",
    "- Compare flock performance against age or production stage before making changes.",
  ].join("\n");
}

function buildSalesReply({ message, intent, isFollowUp, context = {} }) {
  const liveNote = buildPlanAwareLiveDataNote(message, "sales", intent, context);

  if (intent === "action") {
    return [
      "To add a new sale:",
      "- Open Sales.",
      "- Select Add Sale or New Sale.",
      "- Enter the buyer, item, quantity, unit price, and payment status.",
      "- Review the total, then save the record.",
      "- Reopen the sale later if you need to update payment or notes.",
    ].join("\n");
  }

  if (intent === "details") {
    return [
      "Record every sale with these core details:",
      "- Buyer name",
      "- Item or category sold",
      "- Quantity and unit price",
      "- Total amount and payment status",
      "- Sale date and any reference note",
    ].join("\n");
  }

  if (isFollowUp) {
    return [
      "Next, use the review to tighten cashflow:",
      "- Follow up on unpaid or partial payments before week-end.",
      "- Compare top-selling items with stock movement.",
      "- Check whether any sale was recorded without payment status.",
      "- Reconcile the last 7 days before starting a new week.",
    ].join("\n");
  }

  return [
    liveNote || "For sales, focus on clean records and quick review:",
    "- Open Sales and filter to the last 7 days.",
    "- Compare revenue, payment status, and best-selling items.",
    "- Make sure each sale has buyer, quantity, unit price, and payment status.",
    "- Follow up on unpaid balances before they become stale.",
  ].join("\n");
}

function buildBillingReply({ message, intent, isFollowUp, context = {} }) {
  const liveNote = buildPlanAwareLiveDataNote(message, "billing", intent, context);

  if (intent === "action" && /\b(upgrade|downgrade|change plan|plan)\b/.test(normalizeText(message))) {
    return [
      "To change your plan:",
      "- Open Billing.",
      "- Review the current plan and available options.",
      "- Choose the new plan, confirm the billing impact, and continue.",
      "- Save the change and keep the payment reference if one is generated.",
      "- If anything looks wrong, open a billing support request with the reference.",
    ].join("\n");
  }

  if (intent === "troubleshoot") {
    return [
      "For billing trouble, check these first:",
      "- Confirm the current plan and payment state in Billing.",
      "- Match the transaction reference, amount, and date.",
      "- Avoid retrying payment repeatedly until the first attempt is confirmed.",
      "- If something looks wrong, open a billing help request with the reference number.",
    ].join("\n");
  }

  if (isFollowUp) {
    return [
      "Next, capture the right details for billing support:",
      "- plan name",
      "- payment date and amount",
      "- transaction reference",
      "- the exact message you saw",
      "- what you already tried",
    ].join("\n");
  }

  return [
    liveNote || "Use Billing for plan, receipts, and payment follow-up:",
    "- Confirm the active plan first.",
    "- Check whether the payment is pending, successful, or failed.",
    "- Keep the transaction reference handy before asking for help.",
    "- Use Support if the payment status looks inconsistent.",
  ].join("\n");
}

function buildTeamReply({ intent, isFollowUp }) {
  if (intent === "action") {
    return [
      "To add a new teammate:",
      "- Open Users.",
      "- Choose Invite user or Add teammate.",
      "- Enter the name or email and pick the lowest role that fits the job.",
      "- Send the invite, then confirm the person appears in the workspace list.",
      "- Review access again after the person signs in.",
    ].join("\n");
  }

  if (intent === "checklist" || isFollowUp) {
    return [
      "Use this workspace access routine:",
      "- Invite each teammate into the correct farm only once.",
      "- Give the lowest role that still lets them do the job.",
      "- Review audit log after role changes, removals, or reactivations.",
      "- Keep owner and admin access limited to trusted people.",
    ].join("\n");
  }

  return [
    "For team setup, keep access simple and deliberate:",
    "- Invite people with clear roles from the start.",
    "- Review user access regularly instead of only when something breaks.",
    "- Use the audit log to confirm who changed access and when it happened.",
  ].join("\n");
}

function buildSupportReply({ topic, intent, isFollowUp }) {
  if (intent === "action" || isFollowUp || topic === "support") {
    return [
      "To get help faster, send one complete support request:",
      "- what page you were on",
      "- what you expected to happen",
      "- what actually happened",
      "- the time of the issue",
      "- what you already tried",
    ].join("\n");
  }

  return [
    "Support Center is best for farmer guides, troubleshooting help, and ticket follow-up.",
    "If you need urgent help, open Support and include the page, issue, time, and what you already tried.",
  ].join("\n");
}

function buildClarifyingReply(context = {}) {
  const routeTopic = inferTopicFromRoute(context.currentPath);
  const routeHint = routeTopic
    ? `Since you are on ${TOPIC_CONFIG[routeTopic].label}, I can start there.`
    : "";

  return appendGradeCoaching([
    routeHint || "I can help best when you point me to one farm area.",
    "Try one of these:",
    "- What needs attention today?",
    "- Show me a daily pond checklist",
    "- How do I avoid feed stockout?",
    "- How are sales this week?",
    "- How do I ask for help?",
  ]
    .filter(Boolean)
    .join("\n"), { topic: "general", context });
}

function buildReplyForTopic({ message, context, topic, intent }) {
  const isFollowUp = intent === "follow_up" || FOLLOW_UP_PATTERN.test(normalizeText(message));

  if (intent === "navigate" && topic !== "general") {
    return appendGradeCoaching([
      `The best page for that is ${TOPIC_CONFIG[topic].label}.`,
      "Use the action button below to open it, then ask me for a checklist, review flow, or next steps once you are there.",
    ].join("\n"), { topic, context });
  }

  switch (topic) {
    case "dashboard":
      return buildDashboardReply({
        tenantName: context.tenantName || "your farm",
        context,
        message,
        intent,
      });
    case "fish":
      return appendGradeCoaching(buildFishReply({ intent, isFollowUp }), { topic: "fish", context });
    case "feeds":
      return appendGradeCoaching(buildFeedsReply({ message, intent, isFollowUp, context }), { topic: "feeds", context });
    case "inventory":
      return appendGradeCoaching(buildInventoryReply({ message, intent, isFollowUp, context }), { topic: "inventory", context });
    case "poultry":
      return appendGradeCoaching(buildPoultryReply({ intent, isFollowUp }), { topic: "poultry", context });
    case "sales":
      return appendGradeCoaching(buildSalesReply({ message, intent, isFollowUp, context }), { topic: "sales", context });
    case "billing":
      return appendGradeCoaching(buildBillingReply({ message, intent, isFollowUp, context }), { topic: "billing", context });
    case "team":
      return appendGradeCoaching(buildTeamReply({ intent, isFollowUp }), { topic: "team", context });
    case "support":
      return appendGradeCoaching(buildSupportReply({ topic, intent, isFollowUp: true }), { topic: "support", context });
    default:
      return buildClarifyingReply(context);
  }
}

function buildSuggestionsForTopic({ topic, context }) {
  const planId = getAssistantPlanId(context);
  switch (topic) {
    case "dashboard":
      return normalizeSuggestions(
        [
          hasModule(context, "FISH_FARMING")
            ? "Show me a daily pond checklist"
            : "How do I avoid feed stockout?",
          isPlanAtLeast(planId, "PRO")
            ? "Build a priority plan for today"
            : "How do I avoid feed stockout?",
          planId === "ENTERPRISE"
            ? "What should leaders escalate today?"
            : "How are sales this week?",
        ],
        DEFAULT_FALLBACK_PROMPTS,
      );
    case "fish":
      return normalizeSuggestions([
        "Show me a daily pond checklist",
        "How should I handle sudden mortality?",
        "What signs show low oxygen?",
      ], DEFAULT_FALLBACK_PROMPTS);
    case "feeds":
      return normalizeSuggestions([
        "How do I avoid feed stockout?",
        "What should I track for feed cost control?",
        "How do I set feed reorder levels?",
      ], DEFAULT_FALLBACK_PROMPTS);
    case "inventory":
      return normalizeSuggestions([
        "How do I prioritize critical inventory items?",
        "What reorder level should I use?",
        "How do I prepare a weekly stock count?",
      ], DEFAULT_FALLBACK_PROMPTS);
    case "poultry":
      return normalizeSuggestions([
        "What should I check in poultry today?",
        "How do I respond to unusual flock losses?",
        "What egg records should I review daily?",
      ], DEFAULT_FALLBACK_PROMPTS);
    case "sales":
      return normalizeSuggestions([
        "How are sales this week?",
        "What sales fields are mandatory?",
        "How can I improve reporting accuracy?",
      ], DEFAULT_FALLBACK_PROMPTS);
    case "billing":
      return normalizeSuggestions([
        "Take me to billing",
        "How do I report a failed payment?",
        "What should I include in a billing ticket?",
      ], DEFAULT_FALLBACK_PROMPTS);
    case "team":
      return normalizeSuggestions([
        "How do I onboard new staff?",
        "What role setup is best for small teams?",
        "When should I review the audit log?",
      ], DEFAULT_FALLBACK_PROMPTS);
    case "support":
      return normalizeSuggestions([
        "How can I ask for help?",
        "What details should I include?",
        "Show me the Support Center",
      ], DEFAULT_FALLBACK_PROMPTS);
    default:
      return buildStarterSuggestions(context);
  }
}

function buildActionsForTopic({ topic, context }) {
  const planId = getAssistantPlanId(context);
  switch (topic) {
    case "dashboard":
      return normalizeActions([
        { type: "navigate", label: "Open Dashboard", target: "/dashboard" },
        hasModule(context, "FISH_FARMING")
          ? {
              type: "prompt",
              label: "Daily pond checklist",
              message: "Show me a daily pond checklist",
            }
          : { type: "navigate", label: "Open Feeds", target: "/feeds" },
        planId === "ENTERPRISE"
          ? { type: "navigate", label: "Open Users", target: "/users" }
          : { type: "navigate", label: "Open Inventory", target: "/inventory" },
      ]);
    case "fish":
      return normalizeActions([
        { type: "navigate", label: "Open Fish Ponds", target: "/fish-ponds" },
        {
          type: "prompt",
          label: "Pond checklist",
          message: "Show me a daily pond checklist",
        },
        {
          type: "navigate",
          label: "Ask for help",
          target: buildSupportTicketTarget({
            category: "Fish Ponds",
            priority: "HIGH",
            subject: "Need help with pond health",
            description:
              "Please help check a pond health problem on my farm. I will include symptoms, time, pond, and recent feed or water changes.",
          }),
        },
      ]);
    case "feeds":
      return normalizeActions([
        { type: "navigate", label: "Open Feeds", target: "/feeds" },
        { type: "navigate", label: "Open Inventory", target: "/inventory" },
        {
          type: "prompt",
          label: "Reorder formula",
          message: "How do I set feed reorder levels?",
        },
      ]);
    case "inventory":
      return normalizeActions([
        { type: "navigate", label: "Open Inventory", target: "/inventory" },
        {
          type: "prompt",
          label: "Prioritize stock",
          message: "How do I prioritize critical inventory items?",
        },
        { type: "navigate", label: "Open Feeds", target: "/feeds" },
      ]);
    case "poultry":
      return normalizeActions([
        { type: "navigate", label: "Open Poultry", target: "/poultry" },
        {
          type: "prompt",
          label: "Poultry checklist",
          message: "What should I check in poultry today?",
        },
        { type: "navigate", label: "Open Productions", target: "/productions" },
      ]);
    case "sales":
      return normalizeActions([
        { type: "navigate", label: "Open Sales", target: "/sales" },
        {
          type: "prompt",
          label: "Weekly review",
          message: "How are sales this week?",
        },
        { type: "navigate", label: "Open Billing", target: "/billing" },
      ]);
    case "billing":
      return normalizeActions([
        { type: "navigate", label: "Open Billing", target: "/billing" },
        {
          type: "navigate",
          label: "Ask billing for help",
          target: buildSupportTicketTarget({
            category: "Billing & Subscription",
            priority: "HIGH",
            subject: "Need help with billing",
            description:
              "Please help check a billing or subscription problem on my farm. I will include the plan name, amount, date, and transaction reference.",
          }),
        },
        { type: "navigate", label: "Open Support", target: "/support" },
      ]);
    case "team":
      return normalizeActions([
        { type: "navigate", label: "Open Users", target: "/users" },
        {
          type: "prompt",
          label: "Role setup tips",
          message: "What role setup is best for small teams?",
        },
        { type: "navigate", label: "Open Settings", target: "/settings" },
      ]);
    case "support":
      return normalizeActions([
        { type: "navigate", label: "Open Support", target: "/support" },
        {
          type: "navigate",
          label: "Ask for help",
          target: buildSupportTicketTarget({
            category: "General",
            priority: "MEDIUM",
            subject: "Need help from KFarms",
            description:
              "Please help check a problem on my farm. I will include the page, time, issue, and what I already tried.",
          }),
        },
        { type: "navigate", label: "Open Dashboard", target: "/dashboard" },
      ]);
    default:
      return buildStarterActions(context);
  }
}

function buildFallbackReply(message = "", options = {}) {
  const history = normalizeHistory(options.history);
  const context = options.context || {};
  const topic = inferTopic(message, history, context);
  const intent = inferIntent(message, topic);

  return {
    reply: buildReplyForTopic({
      message,
      history,
      context,
      topic,
      intent,
    }),
    suggestions: buildSuggestionsForTopic({ topic, context }),
    actions: buildActionsForTopic({ topic, context }),
    topic,
    intent,
  };
}

function buildConversationalPayload({
  tenantId,
  tenantName,
  userName,
  intent,
  message,
  current = [],
  context = {},
} = {}) {
  const userEntry = normalizeMessage({
    role: "user",
    content: message,
    createdAt: nowIso(),
  });
  const assistantEntry = normalizeMessage({
    role: "assistant",
    content: buildConversationalReply({
      intent,
      history: current,
      context,
      userName,
      tenantName,
    }),
    createdAt: nowIso(),
  });
  const next = [...current, userEntry, assistantEntry];
  setConversationForTenant(tenantId, next);
  return {
    messages: next,
    reply: assistantEntry.content,
    suggestions: buildConversationalSuggestions(intent, context),
    actions: buildConversationalActions(intent, context),
    source: "hybrid",
  };
}

export async function getSupportAssistantConversation({
  tenantId,
  tenantName,
  userName,
  context = {},
} = {}) {
  try {
    const response = await apiClient.get(ASSISTANT_ENDPOINTS.conversation);
    const payload = response.data?.data ?? response.data ?? {};
    const messages = normalizeHistory(payload.messages);
    if (messages.length > 0) {
      setConversationForTenant(tenantId, messages);
      return {
        messages,
        suggestions: normalizeSuggestions(payload.suggestions, buildStarterSuggestions(context)),
        actions: normalizeActions(payload.actions, buildStarterActions(context)),
        source: "api",
      };
    }
    throw new Error("Assistant conversation was empty.");
  } catch (error) {
    if (!shouldUsePlaceholder(error)) {
      throw new Error(extractErrorMessage(error, "Could not load assistant conversation."));
    }

    const messages = ensureInitializedConversation({
      tenantId,
      tenantName,
      userName,
      context,
    });
    return {
      messages,
      suggestions: buildStarterSuggestions(context),
      actions: buildStarterActions(context),
      source: "placeholder",
    };
  }
}

export async function resetSupportAssistantConversation({
  tenantId,
  tenantName,
  userName,
  context = {},
} = {}) {
  try {
    const response = await apiClient.delete(ASSISTANT_ENDPOINTS.conversation);
    const payload = response.data?.data ?? response.data ?? {};
    const messages = normalizeHistory(payload.messages);
    if (messages.length > 0) {
      setConversationForTenant(tenantId, messages);
      return {
        messages,
        suggestions: normalizeSuggestions(payload.suggestions, buildStarterSuggestions(context)),
        actions: normalizeActions(payload.actions, buildStarterActions(context)),
        source: "api",
      };
    }
    throw new Error("Assistant reset did not return a conversation.");
  } catch (error) {
    if (!shouldUsePlaceholder(error)) {
      throw new Error(extractErrorMessage(error, "Could not reset assistant conversation."));
    }

    const messages = [
      buildWelcomeMessage({
        tenantName,
        userName,
        context,
      }),
    ];
    setConversationForTenant(tenantId, messages);
    return {
      messages,
      suggestions: buildStarterSuggestions(context),
      actions: buildStarterActions(context),
      source: "placeholder",
    };
  }
}

export async function askSupportAssistant({
  tenantId,
  tenantName,
  userName,
  message,
  context = {},
} = {}) {
  const content = String(message || "").trim();
  if (!content) {
    throw new Error("Please enter a message.");
  }

  const resolvedContext = {
    tenantId,
    tenantName,
    userName,
    ...context,
  };
  const current = ensureInitializedConversation({
    tenantId,
    tenantName,
    userName,
    context: resolvedContext,
  });
  const conversationalIntent = detectConversationalIntent(content);
  if (conversationalIntent) {
    return buildConversationalPayload({
      tenantId,
      tenantName,
      userName,
      intent: conversationalIntent,
      message: content,
      current,
      context: resolvedContext,
    });
  }
  const userEntry = normalizeMessage({
    role: "user",
    content,
    createdAt: nowIso(),
  });
  const optimistic = [...current, userEntry];
  const localHints = buildFallbackReply(content, {
    history: current.slice(-10),
    context: resolvedContext,
  });

  try {
    const response = await apiClient.post(ASSISTANT_ENDPOINTS.chat, {
      message: content,
      context: resolvedContext,
      history: optimistic.slice(-10).map((entry) => ({
        role: entry.role,
        content: entry.content,
      })),
    });

    const payload = response.data?.data ?? response.data ?? {};
    const assistantText = String(payload.reply || payload.message || "").trim();
    if (!assistantText) {
      throw new Error("Assistant reply was empty.");
    }

    if (
      shouldPreferLocalTopicReply({
        assistantText,
        message: content,
        topic: localHints.topic,
        intent: localHints.intent,
      })
    ) {
      const assistantEntry = normalizeMessage({
        role: "assistant",
        content: localHints.reply,
        createdAt: nowIso(),
      });
      const next = [...optimistic, assistantEntry];
      setConversationForTenant(tenantId, next);
      return {
        messages: next,
        reply: assistantEntry.content,
        suggestions: localHints.suggestions,
        actions: normalizeActions(localHints.actions),
        source: "hybrid",
      };
    }

    const apiMessages = normalizeHistory(payload.messages);
    const assistantEntry = normalizeMessage({
      role: "assistant",
      content: assistantText,
      createdAt: nowIso(),
    });
    const next = apiMessages.length > 0 ? apiMessages : [...optimistic, assistantEntry];
    setConversationForTenant(tenantId, next);
    return {
      messages: next,
      reply: assistantText,
      suggestions: normalizeSuggestions(payload.suggestions, localHints.suggestions),
      actions: normalizeActions(payload.actions, localHints.actions),
      source: "api",
    };
  } catch (error) {
    if (!shouldUsePlaceholder(error)) {
      throw new Error(extractErrorMessage(error, "Could not reach support assistant."));
    }

    const assistantEntry = normalizeMessage({
      role: "assistant",
      content: localHints.reply,
      createdAt: nowIso(),
    });
    const next = [...optimistic, assistantEntry];
    setConversationForTenant(tenantId, next);
    return {
      messages: next,
      reply: assistantEntry.content,
      suggestions: localHints.suggestions,
      actions: normalizeActions(localHints.actions),
      source: "placeholder",
    };
  }
}

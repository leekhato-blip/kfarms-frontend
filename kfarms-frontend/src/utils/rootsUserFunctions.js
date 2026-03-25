const ROOTS_FUNCTION_STORAGE_KEY = "roots_platform_user_functions";

const ROOTS_FUNCTION_ALIAS_MAP = Object.freeze({
  ONBOARDING: "SUCCESS",
  GROWTH: "SUCCESS",
  LOGISTICS: "OPS",
});

export const ROOTS_FUNCTION_OPTIONS = Object.freeze([
  {
    value: "OPS",
    label: "Ops",
    tone: "blue",
    description: "Keeps day-to-day platform operations, delivery flow, and escalation handling moving.",
    summary: "Best for the operator coordinating execution, blockers, and live platform rhythm.",
    focusAreas: ["Execution cadence", "Incident coordination", "Cross-team blockers"],
    notificationTopics: [
      "Critical platform incidents",
      "Workflow delays across tenants",
      "Escalations needing fast coordination",
    ],
  },
  {
    value: "SUPPORT",
    label: "Support",
    tone: "green",
    description: "Handles user questions, troubleshooting, follow-up, and escalations.",
    summary: "Fits the operator who owns response quality, issue follow-through, and user care.",
    focusAreas: ["Open tickets", "Escalation response", "User follow-up quality"],
    notificationTopics: [
      "New support requests",
      "Unresolved user issues",
      "Escalations waiting on response",
    ],
  },
  {
    value: "ANALYST",
    label: "Analyst",
    tone: "violet",
    description: "Turns platform activity into reports, trends, and decision-ready insight.",
    summary: "Fits the operator reading patterns, surfacing anomalies, and guiding decisions with data.",
    focusAreas: ["Trend tracking", "Performance analysis", "Reporting quality"],
    notificationTopics: [
      "Usage anomalies",
      "Reporting gaps or stale data",
      "Sharp spikes or drops in activity",
    ],
  },
  {
    value: "BILLING",
    label: "Billing",
    tone: "amber",
    description: "Looks after invoices, subscriptions, payment issues, and account balance checks.",
    summary: "Best for the operator managing payment health, renewals, and subscription changes.",
    focusAreas: ["Failed charges", "Renewal timing", "Plan change accuracy"],
    notificationTopics: [
      "Failed payments",
      "Upcoming renewals",
      "Plan or invoice mismatches",
    ],
  },
  {
    value: "SUCCESS",
    label: "Success",
    tone: "green",
    description: "Owns onboarding momentum, adoption health, renewals, and customer outcomes.",
    summary: "Fits the operator keeping workspaces active, onboarded, and growing in the right direction.",
    focusAreas: ["Adoption health", "Renewal readiness", "Onboarding momentum"],
    notificationTopics: [
      "Low adoption signals",
      "At-risk accounts",
      "New workspace onboarding milestones",
    ],
  },
  {
    value: "COMPLIANCE",
    label: "Compliance",
    tone: "violet",
    description: "Covers policy checks, controls, audit readiness, and governance review.",
    summary: "Best for the operator protecting standards, access boundaries, and audit posture.",
    focusAreas: ["Control reviews", "Policy adherence", "Audit readiness"],
    notificationTopics: [
      "Policy exceptions",
      "Permission drift",
      "Audit tasks and overdue checks",
    ],
  },
  {
    value: "FINANCE",
    label: "Finance",
    tone: "blue",
    description: "Owns revenue review, cashflow visibility, collections, and internal finance checks.",
    summary: "Fits the operator tracking the money picture, revenue accuracy, and finance exceptions.",
    focusAreas: ["Cashflow visibility", "Collections watch", "Revenue variance"],
    notificationTopics: [
      "Revenue exceptions",
      "Outstanding collections",
      "Finance reconciliation issues",
    ],
  },
]);

const ROOTS_FUNCTION_MAP = Object.freeze(
  Object.fromEntries(ROOTS_FUNCTION_OPTIONS.map((option) => [option.value, option])),
);

function normalizeText(value) {
  return String(value ?? "").trim();
}

export function normalizeRootsFunction(value, fallback = "") {
  const normalized = normalizeText(value).toUpperCase();
  const aliased = ROOTS_FUNCTION_ALIAS_MAP[normalized] || normalized;
  return ROOTS_FUNCTION_MAP[aliased] ? aliased : fallback;
}

export function getRootsFunctionMeta(value) {
  return ROOTS_FUNCTION_MAP[normalizeRootsFunction(value, "")] || null;
}

export function getRootsFunctionLabel(value, fallback = "Unassigned") {
  return getRootsFunctionMeta(value)?.label || fallback;
}

export function getRootsUserFunctionKey(user) {
  const identity =
    user?.userId ??
    user?.id ??
    [normalizeText(user?.email), normalizeText(user?.username)].find(Boolean);

  return String(identity ?? "").trim();
}

export function inferRootsFunction(user) {
  const directCandidates = [
    user?.rootsFunction,
    user?.functionRole,
    user?.teamRole,
    user?.profileRole,
  ];

  for (let index = 0; index < directCandidates.length; index += 1) {
    const normalized = normalizeRootsFunction(directCandidates[index], "");
    if (normalized) return normalized;
  }

  const haystack = [user?.username, user?.email]
    .map((value) => normalizeText(value).toLowerCase())
    .filter(Boolean)
    .join(" ");

  if (haystack.includes("onboarding")) return "SUCCESS";
  if (haystack.includes("compliance")) return "COMPLIANCE";
  if (haystack.includes("logistics")) return "OPS";
  if (haystack.includes("billing")) return "BILLING";
  if (haystack.includes("finance")) return "FINANCE";
  if (haystack.includes("success")) return "SUCCESS";
  if (haystack.includes("support")) return "SUPPORT";
  if (haystack.includes("analyst")) return "ANALYST";
  if (haystack.includes("growth")) return "SUCCESS";
  if (haystack.includes("ops")) return "OPS";

  return "";
}

export function readStoredRootsUserFunctions() {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(ROOTS_FUNCTION_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed)
        .map(([key, value]) => [key, normalizeRootsFunction(value, "")])
        .filter(([, value]) => Boolean(value)),
    );
  } catch {
    return {};
  }
}

export function writeStoredRootsUserFunctions(assignments = {}) {
  if (typeof window === "undefined") return;

  const sanitized = Object.fromEntries(
    Object.entries(assignments || {})
      .map(([key, value]) => [String(key), normalizeRootsFunction(value, "")])
      .filter(([, value]) => Boolean(value)),
  );

  window.localStorage.setItem(ROOTS_FUNCTION_STORAGE_KEY, JSON.stringify(sanitized));
}

export function resolveRootsFunction(user, assignments = {}) {
  const key = getRootsUserFunctionKey(user);
  const assigned = key ? normalizeRootsFunction(assignments?.[key], "") : "";
  return assigned || inferRootsFunction(user);
}

export function assignRootsFunction(user, value, currentAssignments = {}) {
  const key = getRootsUserFunctionKey(user);
  if (!key) return { ...(currentAssignments || {}) };

  const normalized = normalizeRootsFunction(value, "");
  return {
    ...(currentAssignments || {}),
    [key]: normalized,
  };
}

const PLAN_ALIASES = {
  ENTRIPRISE: "ENTERPRISE",
};

export const PLAN_TIER_CONFIG = [
  {
    id: "FREE",
    name: "Free",
    assistantLabel: "KAI Free",
    assistantSummary: "Practical guidance, checklists, and navigation help for one farm workspace.",
    tagline: "For starter farmers, hobby farmers, and small teams testing digital farm records.",
    priceLabel: "Free",
    cycleLabel: "forever",
    ctaLabel: "Start Free",
    ctaPath: "/auth/signup",
    limits: [
      { label: "Organizations", value: "1" },
      { label: "Users", value: "2" },
      { label: "Fish Ponds", value: "5" },
      { label: "Poultry Flocks", value: "3" },
    ],
    highlights: [
      "Sales records, supplies, feed inventory, fish ponds, and poultry tracking",
      "Dashboard summary cards and quick add actions",
      "Workspace setup with owner-only access control",
      "Offline-ready capture with sync recovery for day-to-day work",
      "KAI Free for clear daily guidance",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    assistantLabel: "KAI Pro",
    assistantSummary: "Sharper operational coaching, prioritization, and team support for active farms.",
    tagline: "For serious farmers running daily operations with workers, analytics, and alerts.",
    priceLabel: "NGN 7,000",
    compareAtPriceLabel: "NGN 10,000",
    cycleLabel: "per month or NGN 70,000 yearly",
    ctaLabel: "Upgrade to Pro",
    ctaPath: "/onboarding/create-tenant",
    recommended: true,
    limits: [
      { label: "Organizations", value: "1" },
      { label: "Users", value: "10" },
      { label: "Fish Ponds", value: "Unlimited" },
      { label: "Poultry Flocks", value: "Unlimited" },
    ],
    highlights: [
      "Team management, role control, and invitations",
      "Hatch workflows, revenue analytics, watchlists, and health alerts",
      "Task planning, CSV/XLSX export, trash restore, and priority support messaging",
      "Operational continuity through offline-safe record flows",
      "KAI Pro for sharper decisions",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    assistantLabel: "KAI Enterprise",
    assistantSummary: "Leadership-grade reviews, escalation support, and multi-site operational guidance.",
    tagline: "For agribusiness groups running branded, multi-branch operations with portfolio visibility and custom workspace setup.",
    priceLabel: "",
    cycleLabel: "",
    ctaLabel: "Talk to Sales",
    ctaPath: "/product-profile?sales=1",
    limits: [
      { label: "Organizations", value: "Unlimited" },
      { label: "Users", value: "Unlimited" },
      { label: "Fish Ponds", value: "Unlimited" },
      { label: "Poultry Flocks", value: "Unlimited" },
    ],
    highlights: [
      "Multi-workspace operations with unlimited users and portfolio visibility",
      "Enterprise permission profiles, brand controls, and workspace policy settings",
      "Dedicated platform messaging lane for enterprise subscribers",
      "KAI Enterprise for leadership reviews and escalation",
    ],
  },
];

export const PLAN_IDS = PLAN_TIER_CONFIG.map((plan) => plan.id);

const PLAN_INDEX = PLAN_IDS.reduce((acc, id, index) => {
  acc[id] = index;
  return acc;
}, {});

export const PLAN_FEATURE_MATRIX = [
  {
    id: "core-records",
    feature: "Sales records, supplies, feeds, fish ponds, and poultry tracking",
    minPlan: "FREE",
  },
  {
    id: "offline-ready",
    feature: "Offline-ready record capture with sync recovery when the network returns",
    minPlan: "FREE",
  },
  {
    id: "daily-farm-log",
    feature: "Fast daily farm logging through quick-add actions and record forms",
    minPlan: "FREE",
  },
  {
    id: "dashboard-summary",
    feature: "Dashboard summary cards",
    minPlan: "FREE",
  },
  {
    id: "team-workspaces",
    feature: "Organization workspace setup and owner access control",
    minPlan: "FREE",
  },
  {
    id: "kai-free",
    feature: "KAI Free for checklists, guidance, and navigation",
    minPlan: "FREE",
  },
  {
    id: "team-management",
    feature: "Users page with invitations, roles, and member access control",
    minPlan: "PRO",
  },
  {
    id: "hatch-workflows",
    feature: "Hatch workflows",
    minPlan: "PRO",
  },
  {
    id: "profit-analytics",
    feature: "Revenue charts, performance analytics, and advanced dashboard insights",
    minPlan: "PRO",
  },
  {
    id: "smart-alerts",
    feature: "Health alerts, notifications, and watchlists for key farm metrics",
    minPlan: "PRO",
  },
  {
    id: "task-planning",
    feature: "Upcoming task planner and task workflows",
    minPlan: "PRO",
  },
  {
    id: "advanced-export",
    feature: "CSV/XLSX export with date range and category filters",
    minPlan: "PRO",
  },
  {
    id: "trash-restore",
    feature: "Trash and restore workflow",
    minPlan: "PRO",
  },
  {
    id: "priority-platform-messaging",
    feature: "Support messaging with a Pro priority lane",
    minPlan: "PRO",
  },
  {
    id: "kai-pro",
    feature: "KAI Pro for smarter planning and coaching",
    minPlan: "PRO",
  },
  {
    id: "multi-org-ops",
    feature: "Multi-workspace operations and enterprise site portfolio",
    minPlan: "ENTERPRISE",
  },
  {
    id: "advanced-role-permissions",
    feature: "Advanced permission profiles and custom role labels",
    minPlan: "ENTERPRISE",
  },
  {
    id: "workspace-brand-controls",
    feature: "Workspace brand controls for logo, colors, and report footer",
    minPlan: "ENTERPRISE",
  },
  {
    id: "workspace-policies",
    feature: "Workspace policy controls like strong passwords and session timeout",
    minPlan: "ENTERPRISE",
  },
  {
    id: "dedicated-platform-messaging",
    feature: "Dedicated platform messaging lane for enterprise subscribers",
    minPlan: "ENTERPRISE",
  },
  {
    id: "kai-enterprise",
    feature: "KAI Enterprise for leadership reviews and escalation",
    minPlan: "ENTERPRISE",
  },
];

export function normalizePlanId(value, fallback = "FREE") {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
  const resolved = PLAN_ALIASES[normalized] || normalized;
  if (PLAN_INDEX[resolved] === undefined) return fallback;
  return resolved;
}

export function getPlanById(planId, fallback = "FREE") {
  const normalized = normalizePlanId(planId, fallback);
  return PLAN_TIER_CONFIG.find((plan) => plan.id === normalized) || PLAN_TIER_CONFIG[0];
}

export function isPlanAtLeast(planId, requiredPlanId = "FREE") {
  const current = normalizePlanId(planId, "FREE");
  const required = normalizePlanId(requiredPlanId, "FREE");
  return PLAN_INDEX[current] >= PLAN_INDEX[required];
}

export function isFeatureIncluded(planId, feature) {
  const required = typeof feature === "string" ? feature : feature?.minPlan;
  return isPlanAtLeast(planId, required || "FREE");
}

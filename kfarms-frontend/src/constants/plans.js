const PLAN_ALIASES = {
  ENTRIPRISE: "ENTERPRISE",
};

export const PLAN_TIER_CONFIG = [
  {
    id: "FREE",
    name: "Free",
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
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    tagline: "For serious farmers running daily operations with workers, analytics, and alerts.",
    priceLabel: "NGN 10,000",
    cycleLabel: "per month or NGN 100,000 yearly",
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
      "Task planning, CSV/XLSX export, and trash restore workflow",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    tagline: "For agribusiness groups running branded, multi-branch operations with portfolio visibility and custom workspace setup.",
    priceLabel: "Custom pricing",
    cycleLabel: "typically NGN 80,000-150,000 per month",
    ctaLabel: "Talk to Sales",
    ctaPath: "/company-profile#contact",
    limits: [
      { label: "Organizations", value: "Unlimited" },
      { label: "Users", value: "Unlimited" },
      { label: "Fish Ponds", value: "Unlimited" },
      { label: "Poultry Flocks", value: "Unlimited" },
    ],
    highlights: [
      "Multi-farm and multi-branch management with roll-up dashboards across every farm",
      "Forecasting for feed usage, harvests, eggs, mortality warnings, and branch planning",
      "White-label branding, custom integrations, dedicated support, and enterprise access control",
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
    id: "multi-org-ops",
    feature: "Multi-farm / multi-branch management",
    minPlan: "ENTERPRISE",
  },
  {
    id: "rollup-dashboards",
    feature: "Roll-up dashboards across farms with per-site reporting",
    minPlan: "ENTERPRISE",
  },
  {
    id: "advanced-role-permissions",
    feature: "Custom roles beyond owner/admin/manager/staff with page-level and action-level permissions",
    minPlan: "ENTERPRISE",
  },
  {
    id: "forecasting-planning",
    feature: "Forecasting and planning for feed demand, egg output, fish harvest, and branch planning",
    minPlan: "ENTERPRISE",
  },
  {
    id: "white-labeling",
    feature: "White-labeling with custom logo, company colors, branded login, branded PDF reports, and custom domain",
    minPlan: "ENTERPRISE",
  },
  {
    id: "custom-integrations",
    feature: "Custom integrations for enterprise workflows and external systems",
    minPlan: "ENTERPRISE",
  },
  {
    id: "dedicated-support",
    feature: "Dedicated support and priority onboarding",
    minPlan: "ENTERPRISE",
  },
  {
    id: "feed-usage-prediction",
    feature: "Feed usage prediction",
    minPlan: "ENTERPRISE",
  },
  {
    id: "mortality-warnings",
    feature: "Mortality warnings",
    minPlan: "ENTERPRISE",
  },
  {
    id: "profit-per-batch",
    feature: "Profit per batch",
    minPlan: "ENTERPRISE",
  },
  {
    id: "egg-production-tracking",
    feature: "Egg production tracking",
    minPlan: "ENTERPRISE",
  },
  {
    id: "fish-growth-estimation",
    feature: "Fish growth estimation",
    minPlan: "ENTERPRISE",
  },
  {
    id: "branch-performance-views",
    feature: "Performance views by farm, pond, poultry house, and batch",
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

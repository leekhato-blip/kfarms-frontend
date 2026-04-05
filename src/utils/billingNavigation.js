import { normalizePlanId } from "../constants/plans";

export const BILLING_PLAN_FOCUS_PARAM = "focusPlan";

export function getBillingPlanCardAnchor(planId = "PRO") {
  return `plan-${normalizePlanId(planId, "PRO").toLowerCase()}`;
}

export function buildBillingPlanFocusPath(planId = "PRO") {
  const normalizedPlan = normalizePlanId(planId, "PRO");

  if (normalizedPlan === "ENTERPRISE") {
    return "/product-profile#contact";
  }

  return `/billing?${BILLING_PLAN_FOCUS_PARAM}=${normalizedPlan}#${getBillingPlanCardAnchor(normalizedPlan)}`;
}

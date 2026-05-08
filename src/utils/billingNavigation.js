import { toKfarmsAppPath } from "../apps/kfarms/paths";
import { normalizePlanId } from "../constants/plans";

export const BILLING_PLAN_FOCUS_PARAM = "focusPlan";
export const BILLING_INTERVAL_PARAM = "billingInterval";
export const SALES_MODAL_PARAM = "sales";

export function buildTalkToSalesPath() {
  const params = new URLSearchParams({
    [SALES_MODAL_PARAM]: "1",
  });
  return `/product-profile?${params.toString()}`;
}

export function getBillingPlanCardAnchor(planId = "PRO") {
  return `plan-${normalizePlanId(planId, "PRO").toLowerCase()}`;
}

export function buildBillingPlanFocusPath(planId = "PRO", billingInterval = "MONTHLY") {
  const normalizedPlan = normalizePlanId(planId, "PRO");

  if (normalizedPlan === "ENTERPRISE") {
    return buildTalkToSalesPath();
  }

  const params = new URLSearchParams({
    [BILLING_PLAN_FOCUS_PARAM]: normalizedPlan,
  });

  if (normalizedPlan === "PRO") {
    params.set(BILLING_INTERVAL_PARAM, String(billingInterval || "MONTHLY").trim().toUpperCase());
  }

  return `${toKfarmsAppPath("/billing")}?${params.toString()}#${getBillingPlanCardAnchor(normalizedPlan)}`;
}

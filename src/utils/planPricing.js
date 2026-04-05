import { PLAN_TIER_CONFIG, normalizePlanId } from "../constants/plans";
import { readPlatformControlSettings } from "./platformControlStore";
import {
  DEFAULT_PROMOTION_APP_ID,
  getAppPromotion,
  normalizeAppPromotion,
  formatPromotionPrice,
} from "./platformPromotions";

export function normalizePlanPromoSettings(settings = {}, planId = "PRO") {
  if (
    settings &&
    typeof settings === "object" &&
    !Object.prototype.hasOwnProperty.call(settings, "promotions") &&
    (Object.prototype.hasOwnProperty.call(settings, "discountPrice") ||
      Object.prototype.hasOwnProperty.call(settings, "type") ||
      Object.prototype.hasOwnProperty.call(settings, "trialMonths") ||
      Object.prototype.hasOwnProperty.call(settings, "durationDays"))
  ) {
    return normalizeAppPromotion(settings, {
      appId: DEFAULT_PROMOTION_APP_ID,
      planId,
    });
  }

  return getAppPromotion(settings, {
    appId: DEFAULT_PROMOTION_APP_ID,
    planId,
  });
}

export function readPlanPromoSettings(planId = "PRO") {
  return normalizePlanPromoSettings(readPlatformControlSettings(), planId);
}

export function getDisplayPlan(plan, promoSettings = readPlatformControlSettings()) {
  const promo = normalizePlanPromoSettings(promoSettings, plan?.id || "PRO");
  const nextPlan = { ...plan, compareAtPriceLabel: "" };

  if (plan.id !== promo.planId || !promo.enabled) {
    return nextPlan;
  }

  const regularPriceLabel = plan.priceLabel;

  if (promo.type === "trial") {
    const months = Number(promo.trialMonths || 1);
    const monthLabel = months === 1 ? "month" : "months";
    return {
      ...nextPlan,
      compareAtPriceLabel: regularPriceLabel,
      priceLabel: "Free",
      cycleLabel: `${months}-${monthLabel} free trial`,
      promoNote: `Then ${regularPriceLabel} per month`,
    };
  }

  if (promo.type === "bonus-month") {
    return {
      ...nextPlan,
      priceLabel: regularPriceLabel,
      cycleLabel: "per month + 1 free month",
      promoNote: "Limited-time bonus for early signups",
    };
  }

  return {
    ...nextPlan,
    compareAtPriceLabel: regularPriceLabel,
    priceLabel: formatPromotionPrice(promo.discountPrice) || "NGN 7,000",
    cycleLabel: "intro price per month",
    promoNote: `Regular price returns after ${promo.durationDays || "30"} days`,
  };
}

export function getDisplayPlanCatalog(
  basePlans = PLAN_TIER_CONFIG,
  promoSettings = readPlatformControlSettings(),
) {
  return basePlans.map((plan) => getDisplayPlan(plan, promoSettings));
}

export function getDisplayPlanById(
  planId,
  promoSettings = readPlatformControlSettings(),
  fallback = "FREE",
) {
  const normalizedPlanId = normalizePlanId(planId, fallback);
  const plan = PLAN_TIER_CONFIG.find((item) => item.id === normalizedPlanId);
  return getDisplayPlan(plan || PLAN_TIER_CONFIG[0], promoSettings);
}

import { PLAN_TIER_CONFIG, normalizePlanId } from "../constants/plans";
import { PLATFORM_CONTROL_SETTINGS_KEY } from "../constants/platformControlSettings";

const DEFAULT_PROMO_SETTINGS = Object.freeze({
  bonanzaEnabled: true,
  bonanzaType: "discount",
  bonanzaDiscountPrice: "7000",
  bonanzaDurationDays: "30",
  bonanzaTrialMonths: "1",
});

function formatNaira(value) {
  const numeric = Number(String(value || "").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  return `NGN ${numeric.toLocaleString("en-NG")}`;
}

export function normalizePlanPromoSettings(settings = {}) {
  return {
    bonanzaEnabled:
      settings.bonanzaEnabled ?? DEFAULT_PROMO_SETTINGS.bonanzaEnabled,
    bonanzaType: String(
      settings.bonanzaType ?? DEFAULT_PROMO_SETTINGS.bonanzaType,
    ).trim(),
    bonanzaDiscountPrice: String(
      settings.bonanzaDiscountPrice ??
        DEFAULT_PROMO_SETTINGS.bonanzaDiscountPrice,
    ).trim(),
    bonanzaDurationDays: String(
      settings.bonanzaDurationDays ?? DEFAULT_PROMO_SETTINGS.bonanzaDurationDays,
    ).trim(),
    bonanzaTrialMonths: String(
      settings.bonanzaTrialMonths ?? DEFAULT_PROMO_SETTINGS.bonanzaTrialMonths,
    ).trim(),
  };
}

export function readPlanPromoSettings() {
  if (typeof window === "undefined") {
    return normalizePlanPromoSettings(DEFAULT_PROMO_SETTINGS);
  }

  try {
    const raw = window.localStorage.getItem(PLATFORM_CONTROL_SETTINGS_KEY);
    if (!raw) return normalizePlanPromoSettings(DEFAULT_PROMO_SETTINGS);
    return normalizePlanPromoSettings(JSON.parse(raw));
  } catch {
    return normalizePlanPromoSettings(DEFAULT_PROMO_SETTINGS);
  }
}

export function getDisplayPlan(plan, promoSettings = readPlanPromoSettings()) {
  const promo = normalizePlanPromoSettings(promoSettings);
  const nextPlan = { ...plan, compareAtPriceLabel: "" };

  if (plan.id !== "PRO" || !promo.bonanzaEnabled) {
    return nextPlan;
  }

  const regularPriceLabel = plan.priceLabel;

  if (promo.bonanzaType === "trial") {
    const months = Number(promo.bonanzaTrialMonths || 1);
    const monthLabel = months === 1 ? "month" : "months";
    return {
      ...nextPlan,
      compareAtPriceLabel: regularPriceLabel,
      priceLabel: "Free",
      cycleLabel: `${months}-${monthLabel} free trial`,
      promoNote: `Then ${regularPriceLabel} per month`,
    };
  }

  if (promo.bonanzaType === "bonus-month") {
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
    priceLabel: formatNaira(promo.bonanzaDiscountPrice) || "NGN 7,000",
    cycleLabel: "intro price per month",
    promoNote: `Regular price returns after ${promo.bonanzaDurationDays || "30"} days`,
  };
}

export function getDisplayPlanCatalog(
  basePlans = PLAN_TIER_CONFIG,
  promoSettings = readPlanPromoSettings(),
) {
  return basePlans.map((plan) => getDisplayPlan(plan, promoSettings));
}

export function getDisplayPlanById(
  planId,
  promoSettings = readPlanPromoSettings(),
  fallback = "FREE",
) {
  const normalizedPlanId = normalizePlanId(planId, fallback);
  const plan = PLAN_TIER_CONFIG.find((item) => item.id === normalizedPlanId);
  return getDisplayPlan(plan || PLAN_TIER_CONFIG[0], promoSettings);
}

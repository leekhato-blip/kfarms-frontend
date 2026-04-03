export const DEFAULT_PROMOTION_APP_ID = "kfarms";
export const DEFAULT_PROMOTION_PLAN_ID = "PRO";

const DEFAULT_PROMOTION_VALUES = Object.freeze({
  enabled: true,
  type: "discount",
  discountPrice: "7000",
  durationDays: "30",
  trialMonths: "1",
});

function normalizePromotionAppId(value, fallback = DEFAULT_PROMOTION_APP_ID) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return normalized || fallback;
}

function normalizePromotionPlanId(value, fallback = DEFAULT_PROMOTION_PLAN_ID) {
  return String(value ?? "")
    .trim()
    .toUpperCase() || fallback;
}

function normalizePromotionType(value, fallback = DEFAULT_PROMOTION_VALUES.type) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (["discount", "trial", "bonus-month"].includes(normalized)) {
    return normalized;
  }

  return fallback;
}

export function formatPromotionPrice(value) {
  const numeric = Number(String(value || "").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  return `NGN ${numeric.toLocaleString("en-NG")}`;
}

export function createDefaultPromotion({
  appId = DEFAULT_PROMOTION_APP_ID,
  planId = DEFAULT_PROMOTION_PLAN_ID,
  enabled,
} = {}) {
  const normalizedAppId = normalizePromotionAppId(appId);
  const enabledByDefault =
    typeof enabled === "boolean"
      ? enabled
      : normalizedAppId === DEFAULT_PROMOTION_APP_ID;

  return {
    appId: normalizedAppId,
    enabled: enabledByDefault,
    planId: normalizePromotionPlanId(planId),
    type: DEFAULT_PROMOTION_VALUES.type,
    discountPrice: DEFAULT_PROMOTION_VALUES.discountPrice,
    durationDays: DEFAULT_PROMOTION_VALUES.durationDays,
    trialMonths: DEFAULT_PROMOTION_VALUES.trialMonths,
  };
}

export function normalizeAppPromotion(promotion = {}, defaults = {}) {
  const base = createDefaultPromotion(defaults);
  return {
    appId: normalizePromotionAppId(promotion.appId, base.appId),
    enabled: promotion.enabled ?? base.enabled,
    planId: normalizePromotionPlanId(
      promotion.planId ?? promotion.targetPlanId,
      base.planId,
    ),
    type: normalizePromotionType(promotion.type, base.type),
    discountPrice: String(
      promotion.discountPrice ??
        promotion.bonanzaDiscountPrice ??
        base.discountPrice,
    ).trim(),
    durationDays: String(
      promotion.durationDays ??
        promotion.bonanzaDurationDays ??
        base.durationDays,
    ).trim(),
    trialMonths: String(
      promotion.trialMonths ??
        promotion.bonanzaTrialMonths ??
        base.trialMonths,
    ).trim(),
  };
}

function hasLegacyBonanzaShape(settings = {}) {
  return [
    "bonanzaEnabled",
    "bonanzaType",
    "bonanzaDiscountPrice",
    "bonanzaDurationDays",
    "bonanzaTrialMonths",
  ].some((key) => Object.prototype.hasOwnProperty.call(settings, key));
}

function normalizePromotionMap(promotions = {}) {
  if (!promotions || typeof promotions !== "object") {
    return {};
  }

  return Object.entries(promotions).reduce((acc, [rawAppId, promotion]) => {
    const appId = normalizePromotionAppId(
      promotion?.appId ?? rawAppId,
      rawAppId,
    );
    acc[appId] = normalizeAppPromotion(promotion, { appId });
    return acc;
  }, {});
}

export function normalizePlatformPromotions(settings = {}) {
  const normalized = normalizePromotionMap(settings.promotions);

  if (!Object.keys(normalized).length && hasLegacyBonanzaShape(settings)) {
    normalized[DEFAULT_PROMOTION_APP_ID] = normalizeAppPromotion(
      {
        appId: DEFAULT_PROMOTION_APP_ID,
        enabled: settings.bonanzaEnabled,
        type: settings.bonanzaType,
        discountPrice: settings.bonanzaDiscountPrice,
        durationDays: settings.bonanzaDurationDays,
        trialMonths: settings.bonanzaTrialMonths,
      },
      { appId: DEFAULT_PROMOTION_APP_ID },
    );
  }

  if (!normalized[DEFAULT_PROMOTION_APP_ID]) {
    normalized[DEFAULT_PROMOTION_APP_ID] = createDefaultPromotion({
      appId: DEFAULT_PROMOTION_APP_ID,
      planId: DEFAULT_PROMOTION_PLAN_ID,
      enabled: true,
    });
  }

  return normalized;
}

export function getAppPromotion(
  settings = {},
  { appId = DEFAULT_PROMOTION_APP_ID, planId = DEFAULT_PROMOTION_PLAN_ID } = {},
) {
  const normalizedAppId = normalizePromotionAppId(appId);
  const promotions = normalizePlatformPromotions(settings);

  return normalizeAppPromotion(promotions[normalizedAppId], {
    appId: normalizedAppId,
    planId,
    enabled: normalizedAppId === DEFAULT_PROMOTION_APP_ID,
  });
}

export function updateAppPromotion(
  promotions = {},
  appId = DEFAULT_PROMOTION_APP_ID,
  patch = {},
) {
  const normalizedAppId = normalizePromotionAppId(appId);
  const normalizedPromotions = normalizePromotionMap(promotions);
  const current = normalizedPromotions[normalizedAppId];

  return {
    ...normalizedPromotions,
    [normalizedAppId]: normalizeAppPromotion(
      {
        ...current,
        ...patch,
        appId: normalizedAppId,
      },
      {
        appId: normalizedAppId,
        planId: current?.planId || DEFAULT_PROMOTION_PLAN_ID,
        enabled:
          typeof current?.enabled === "boolean"
            ? current.enabled
            : normalizedAppId === DEFAULT_PROMOTION_APP_ID,
      },
    ),
  };
}

export function getPromotionPreview(
  promotion = {},
  { appName = "This app", planLabel } = {},
) {
  const normalized = normalizeAppPromotion(promotion, {
    appId: promotion?.appId || DEFAULT_PROMOTION_APP_ID,
    planId: planLabel || promotion?.planId || DEFAULT_PROMOTION_PLAN_ID,
    enabled: promotion?.enabled,
  });
  const resolvedPlanLabel = String(
    planLabel || normalized.planId || DEFAULT_PROMOTION_PLAN_ID,
  ).trim();

  if (!normalized.enabled) {
    return `No active promo draft for ${appName}.`;
  }

  if (normalized.type === "trial") {
    const months = Number(normalized.trialMonths || 1);
    const monthLabel = months === 1 ? "month" : "months";
    return `Give new ${appName} customers ${months} ${monthLabel} free on ${resolvedPlanLabel} before paid billing starts.`;
  }

  if (normalized.type === "bonus-month") {
    return `Offer ${appName} customers an extra free month on ${resolvedPlanLabel} when they commit early.`;
  }

  return `Run a temporary discount for ${appName} ${resolvedPlanLabel} at ${
    formatPromotionPrice(normalized.discountPrice) || "NGN 7,000"
  } for ${normalized.durationDays || "30"} days.`;
}

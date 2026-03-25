import { PLAN_IDS, PLAN_TIER_CONFIG, normalizePlanId } from "../../constants/plans";
import { formatDateTime } from "../../utils/formatters";

export const PLAN_MEMBER_LIMITS = Object.freeze({
  FREE: 2,
  PRO: 10,
  ENTERPRISE: null,
});

export function getTenantId(tenant) {
  return tenant?.tenantId ?? tenant?.id ?? null;
}

export function getUserId(user) {
  return user?.userId ?? user?.id ?? null;
}

export function resolvePlatformUserRole(user) {
  if (user?.role) return String(user.role).toUpperCase();
  return user?.platformAdmin ? "PLATFORM_ADMIN" : "USER";
}

export function hasPlatformAccess(user) {
  if (typeof user?.platformAccess === "boolean") {
    return user.platformAccess;
  }
  return resolvePlatformUserRole(user) === "PLATFORM_ADMIN";
}

export function isPlatformOwner(user) {
  if (typeof user?.platformOwner === "boolean") {
    return user.platformOwner;
  }
  return String(user?.email || "").trim().toLowerCase() === "leekhato@gmail.com";
}

import { getUserDisplayName } from "../../services/userProfileService";

export function resolvePlatformAccessTier(user) {
  if (isPlatformOwner(user)) return "PLATFORM_OWNER";
  if (resolvePlatformUserRole(user) === "PLATFORM_ADMIN") return "PLATFORM_ADMIN";
  if (hasPlatformAccess(user)) return "PLATFORM_STAFF";
  return "USER";
}

export function getPlatformAccessRank(user) {
  const accessTier = resolvePlatformAccessTier(user);

  if (accessTier === "PLATFORM_OWNER") return 400;
  if (accessTier === "PLATFORM_ADMIN") return 300;
  if (accessTier === "PLATFORM_STAFF") return 200;
  return 100;
}

export function resolvePlatformUserEnabled(user) {
  if (typeof user?.enabled === "boolean") return user.enabled;
  if (typeof user?.active === "boolean") return user.active;
  return true;
}

export function isPlatformUser(user) {
  return hasPlatformAccess(user);
}

export function filterPlatformUsers(users = []) {
  if (!Array.isArray(users)) return [];
  return users.filter(isPlatformUser);
}

export function comparePlatformUsersByAuthority(left, right) {
  const rankDifference = getPlatformAccessRank(right) - getPlatformAccessRank(left);
  if (rankDifference !== 0) return rankDifference;

  const enabledDifference =
    Number(resolvePlatformUserEnabled(right)) - Number(resolvePlatformUserEnabled(left));
  if (enabledDifference !== 0) return enabledDifference;

  const tenantDifference =
    Number(right?.tenantCount ?? right?.tenantsCount ?? 0) -
    Number(left?.tenantCount ?? left?.tenantsCount ?? 0);
  if (tenantDifference !== 0) return tenantDifference;

  const leftLabel = left?.username || left?.email || "";
  const rightLabel = right?.username || right?.email || "";
  return leftLabel.localeCompare(rightLabel, undefined, {
    sensitivity: "base",
    numeric: true,
  });
}

export function getTenantMemberLimit(planId) {
  const normalizedPlan = normalizePlanId(planId, "FREE");
  return PLAN_MEMBER_LIMITS[normalizedPlan];
}

export function getSeatUsageSummary(tenant) {
  const plan = normalizePlanId(tenant?.plan, "FREE");
  const memberCount = Number(tenant?.memberCount ?? tenant?.membersCount ?? 0);
  const limit = getTenantMemberLimit(plan);
  const hasFiniteLimit = Number.isFinite(limit);
  const usageRatio = hasFiniteLimit && limit > 0 ? memberCount / limit : 0;
  const remainingSeats = hasFiniteLimit ? Math.max(limit - memberCount, 0) : null;
  const nearLimit = hasFiniteLimit && usageRatio >= 0.8 && usageRatio <= 1;
  const overLimit = hasFiniteLimit && memberCount > limit;

  return {
    plan,
    memberCount,
    limit,
    usageRatio,
    remainingSeats,
    hasFiniteLimit,
    nearLimit,
    overLimit,
    label: hasFiniteLimit ? `${memberCount}/${limit}` : `${memberCount}/Unlimited`,
  };
}

export function formatPercentLabel(value, fractionDigits = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0%";

  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(numeric);
}

export function toEpoch(value) {
  if (!value) return 0;
  const epoch = new Date(value).getTime();
  return Number.isFinite(epoch) ? epoch : 0;
}

export function toRelativeTime(value) {
  const epoch = toEpoch(value);
  if (!epoch) return "No recent timestamp";

  const delta = Date.now() - epoch;
  if (delta < 60_000) return "Just now";
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)} min ago`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)} hrs ago`;
  if (delta < 604_800_000) return `${Math.floor(delta / 86_400_000)} days ago`;
  return formatDateTime(value);
}

export function buildPlanDistribution(tenants = []) {
  return PLAN_IDS.map((planId) => {
    const meta = PLAN_TIER_CONFIG.find((plan) => plan.id === planId);
    return {
      id: planId,
      label: meta?.name || planId,
      count: tenants.filter(
        (tenant) => normalizePlanId(tenant?.plan, "FREE") === planId,
      ).length,
    };
  });
}

export function buildTenantPressureList(tenants = []) {
  return tenants
    .map((tenant) => ({
      tenant,
      seatUsage: getSeatUsageSummary(tenant),
    }))
    .filter(({ seatUsage }) => seatUsage.hasFiniteLimit)
    .sort((left, right) => right.seatUsage.usageRatio - left.seatUsage.usageRatio);
}

export function buildPlatformTimeline(tenants = [], users = []) {
  const events = [];

  tenants.forEach((tenant, index) => {
    const tenantId = getTenantId(tenant) ?? index;
    const name = tenant?.name || tenant?.slug || "Tenant";
    const seatUsage = getSeatUsageSummary(tenant);
    const status = String(tenant?.status || "ACTIVE").toUpperCase();
    const owner = tenant?.ownerEmail || tenant?.owner?.email || "Owner email unavailable";

    if (tenant?.createdAt) {
      events.push({
        id: `tenant-created-${tenantId}`,
        category: "Tenant lifecycle",
        tone: "violet",
        title: "Tenant created",
        subject: name,
        detail: `${seatUsage.plan} plan · ${owner}`,
        when: tenant.createdAt,
      });
    }

    if (tenant?.lastActivityAt && tenant.lastActivityAt !== tenant.createdAt) {
      events.push({
        id: `tenant-activity-${tenantId}`,
        category: "Tenant activity",
        tone: "blue",
        title: "Tenant active",
        subject: name,
        detail: `Recent activity recorded for ${tenant?.slug || name}`,
        when: tenant.lastActivityAt,
      });
    }

    if (status === "SUSPENDED") {
      events.push({
        id: `tenant-suspended-${tenantId}`,
        category: "Workspace status",
        tone: "rose",
        title: "Tenant suspended",
        subject: name,
        detail: `${owner} requires review before reactivation`,
        when: tenant?.lastActivityAt || tenant?.createdAt,
      });
    }

    if (seatUsage.overLimit || seatUsage.nearLimit) {
      events.push({
        id: `tenant-capacity-${tenantId}`,
        category: "Plan guardrail",
        tone: seatUsage.overLimit ? "rose" : "amber",
        title: seatUsage.overLimit ? "Team limit exceeded" : "Team limit nearing cap",
        subject: name,
        detail: `Using ${seatUsage.label} team members`,
        when: tenant?.lastActivityAt || tenant?.createdAt,
      });
    }
  });

  users.forEach((user, index) => {
    const userId = getUserId(user) ?? index;
    const role = resolvePlatformUserRole(user);
    const enabled = resolvePlatformUserEnabled(user);
    const label = getUserDisplayName(user, "User");
    const email = user?.email || "No email";

    if (user?.createdAt) {
      events.push({
        id: `user-created-${userId}`,
        category: "Access",
        tone: role === "PLATFORM_ADMIN" ? "violet" : "blue",
        title: role === "PLATFORM_ADMIN" ? "ROOTS admin onboarded" : "Operator onboarded",
        subject: label,
        detail: `${role} · ${email}`,
        when: user.createdAt,
      });
    }

    if (!enabled) {
      events.push({
        id: `user-disabled-${userId}`,
        category: "Access",
        tone: "rose",
        title: "Access disabled",
        subject: label,
        detail: email,
        when: user?.updatedAt || user?.createdAt,
      });
    }
  });

  return events
    .filter((event) => event.when)
    .sort((left, right) => toEpoch(right.when) - toEpoch(left.when))
    .map((event) => ({
      ...event,
      relativeTime: toRelativeTime(event.when),
    }));
}

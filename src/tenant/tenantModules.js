<<<<<<< HEAD
import {
  KFARMS_DEFAULT_LEGACY_PATH,
  normalizeKfarmsLegacyPath,
  toKfarmsAppPath,
} from "../apps/kfarms/paths";

=======
>>>>>>> 0babf4d (Update frontend application)
export const FARM_MODULES = Object.freeze({
  POULTRY: "POULTRY",
  FISH_FARMING: "FISH_FARMING",
});

export const FARM_MODULE_OPTIONS = Object.freeze([
  {
    id: FARM_MODULES.POULTRY,
    label: "Poultry",
    shortLabel: "Poultry",
    description:
      "Track flocks, egg production, bird health, and day-to-day poultry work.",
<<<<<<< HEAD
    route: toKfarmsAppPath("/poultry"),
=======
    route: "/poultry",
>>>>>>> 0babf4d (Update frontend application)
    accentClassName:
      "from-amber-400/20 via-orange-400/10 to-rose-400/10 text-amber-700 dark:text-amber-200",
  },
  {
    id: FARM_MODULES.FISH_FARMING,
    label: "Fish Farming",
    shortLabel: "Fish",
    description:
      "Manage ponds, stocking, hatch batches, and pond performance in one place.",
<<<<<<< HEAD
    route: toKfarmsAppPath("/fish-ponds"),
=======
    route: "/fish-ponds",
>>>>>>> 0babf4d (Update frontend application)
    accentClassName:
      "from-cyan-400/20 via-sky-400/10 to-emerald-400/10 text-cyan-700 dark:text-cyan-200",
  },
]);

const MODULE_ALIASES = Object.freeze({
  POULTRY: FARM_MODULES.POULTRY,
  LIVESTOCK: FARM_MODULES.POULTRY,
  FISH: FARM_MODULES.FISH_FARMING,
  FISH_FARMING: FARM_MODULES.FISH_FARMING,
  FISH_FARM: FARM_MODULES.FISH_FARMING,
});

const MODULE_PATH_REQUIREMENTS = Object.freeze({
  "/poultry": [FARM_MODULES.POULTRY],
  "/livestock": [FARM_MODULES.POULTRY],
  "/productions": [FARM_MODULES.POULTRY],
  "/fish-ponds": [FARM_MODULES.FISH_FARMING],
});

export function normalizeFarmModuleId(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return MODULE_ALIASES[normalized] || null;
}

export function normalizeEnabledModules(value) {
  const seen = new Set();
  const modules = [];

  function add(candidate) {
    const normalized = normalizeFarmModuleId(candidate);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    modules.push(normalized);
  }

  if (Array.isArray(value)) {
    value.forEach(add);
    return modules.length > 0
      ? modules
      : [FARM_MODULES.POULTRY, FARM_MODULES.FISH_FARMING];
  }

  if (value && typeof value === "object") {
    if (Array.isArray(value.modules)) {
      value.modules.forEach(add);
    }
    if (Array.isArray(value.enabledModules)) {
      value.enabledModules.forEach(add);
    }
    if (value.poultryEnabled === true) {
      add(FARM_MODULES.POULTRY);
    }
    if (value.fishEnabled === true || value.fishFarmEnabled === true) {
      add(FARM_MODULES.FISH_FARMING);
    }

    if (modules.length > 0) {
      return modules;
    }

    const hasExplicitModuleFlags =
      "poultryEnabled" in value ||
      "fishEnabled" in value ||
      "fishFarmEnabled" in value ||
      "modules" in value ||
      "enabledModules" in value;

    if (hasExplicitModuleFlags) {
      return modules;
    }
  }

  return [FARM_MODULES.POULTRY, FARM_MODULES.FISH_FARMING];
}

export function hasFarmModule(tenant, moduleId) {
  const normalized = normalizeFarmModuleId(moduleId);
  if (!normalized) return false;
  return normalizeEnabledModules(tenant).includes(normalized);
}

export function getRequiredModulesForPath(pathname) {
  if (!pathname) return [];
<<<<<<< HEAD
  const normalizedPath = normalizeKfarmsLegacyPath(pathname);
=======
  const normalizedPath = pathname === "/livestock" ? "/poultry" : pathname;
>>>>>>> 0babf4d (Update frontend application)
  return Object.entries(MODULE_PATH_REQUIREMENTS).find(([path]) =>
    normalizedPath === path || normalizedPath.startsWith(`${path}/`)
  )?.[1] ?? [];
}

export function isTenantPathEnabled(pathname, tenant) {
  const requiredModules = getRequiredModulesForPath(pathname);
  if (requiredModules.length === 0) return true;
  return requiredModules.some((moduleId) => hasFarmModule(tenant, moduleId));
}

export function resolveTenantLandingPage(pathname, tenant) {
<<<<<<< HEAD
  if (!pathname) return KFARMS_DEFAULT_LEGACY_PATH;
  const normalizedPath = normalizeKfarmsLegacyPath(pathname);
  if (!normalizedPath) return KFARMS_DEFAULT_LEGACY_PATH;
  return isTenantPathEnabled(normalizedPath, tenant)
    ? normalizedPath
    : KFARMS_DEFAULT_LEGACY_PATH;
=======
  const normalizedPath = pathname === "/livestock" ? "/poultry" : pathname;
  if (!normalizedPath) return "/dashboard";
  return isTenantPathEnabled(normalizedPath, tenant) ? normalizedPath : "/dashboard";
>>>>>>> 0babf4d (Update frontend application)
}

export function getEnabledModuleOptions(tenant) {
  return FARM_MODULE_OPTIONS.filter((option) => hasFarmModule(tenant, option.id));
}

export const KFARMS_BASE_PATH = "/app/kfarms";

const ROUTE_BLUEPRINTS = Object.freeze([
  { id: "dashboard", segment: "dashboard", legacyPath: "/dashboard", label: "Dashboard" },
  { id: "sales", segment: "sales", legacyPath: "/sales", label: "Sales" },
  { id: "supplies", segment: "supplies", legacyPath: "/supplies", label: "Supplies" },
  { id: "fishPonds", segment: "fish-ponds", legacyPath: "/fish-ponds", label: "Fish Ponds" },
  { id: "poultry", segment: "poultry", legacyPath: "/poultry", label: "Poultry" },
  { id: "feeds", segment: "feeds", legacyPath: "/feeds", label: "Feeds" },
  { id: "productions", segment: "productions", legacyPath: "/productions", label: "Productions" },
  { id: "inventory", segment: "inventory", legacyPath: "/inventory", label: "Inventory" },
  { id: "billing", segment: "billing", legacyPath: "/billing", label: "Billing" },
  { id: "search", segment: "search", legacyPath: "/search", label: "Search" },
  { id: "support", segment: "support", legacyPath: "/support", label: "Support" },
  { id: "users", segment: "users", legacyPath: "/users", label: "Users" },
  { id: "settings", segment: "settings", legacyPath: "/settings", label: "Settings" },
]);

export const KFARMS_ROUTE_LIST = Object.freeze(
  ROUTE_BLUEPRINTS.map((route) =>
    Object.freeze({
      ...route,
      appPath: `${KFARMS_BASE_PATH}/${route.segment}`,
    }),
  ),
);

export const KFARMS_ROUTE_REGISTRY = Object.freeze(
  KFARMS_ROUTE_LIST.reduce((accumulator, route) => {
    accumulator[route.id] = route;
    return accumulator;
  }, {}),
);

export const KFARMS_DEFAULT_LEGACY_PATH = KFARMS_ROUTE_REGISTRY.dashboard.legacyPath;
export const KFARMS_DEFAULT_APP_PATH = KFARMS_ROUTE_REGISTRY.dashboard.appPath;

export const KFARMS_LEGACY_ALIASES = Object.freeze({
  "/enterprise": KFARMS_DEFAULT_LEGACY_PATH,
  "/livestock": KFARMS_ROUTE_REGISTRY.poultry.legacyPath,
});

const LEGACY_TO_APP_PATH = new Map(
  KFARMS_ROUTE_LIST.map((route) => [route.legacyPath, route.appPath]),
);

const APP_TO_LEGACY_PATH = new Map(
  KFARMS_ROUTE_LIST.map((route) => [route.appPath, route.legacyPath]),
);

function splitSuffix(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^([^?#]*)(.*)$/);
  return {
    pathname: match?.[1] || "",
    suffix: match?.[2] || "",
  };
}

function normalizePathOnly(pathname) {
  const raw = String(pathname || "").trim();

  if (!raw) {
    return KFARMS_DEFAULT_LEGACY_PATH;
  }

  if (raw === KFARMS_BASE_PATH || raw === `${KFARMS_BASE_PATH}/`) {
    return KFARMS_DEFAULT_LEGACY_PATH;
  }

  if (raw.startsWith(`${KFARMS_BASE_PATH}/`)) {
    return normalizePathOnly(raw.slice(KFARMS_BASE_PATH.length));
  }

  const aliasedPath = KFARMS_LEGACY_ALIASES[raw] || raw;
  return aliasedPath === "/livestock" ? KFARMS_ROUTE_REGISTRY.poultry.legacyPath : aliasedPath;
}

export function normalizeKfarmsLegacyPath(value) {
  const { pathname, suffix } = splitSuffix(value);
  return `${normalizePathOnly(pathname)}${suffix}`;
}

export function toKfarmsAppPath(value = KFARMS_DEFAULT_LEGACY_PATH) {
  const { pathname, suffix } = splitSuffix(value);
  const rawPath = String(pathname || "").trim();

  if (!rawPath) {
    return `${KFARMS_DEFAULT_APP_PATH}${suffix}`;
  }

  if (rawPath === KFARMS_BASE_PATH) {
    return `${KFARMS_DEFAULT_APP_PATH}${suffix}`;
  }

  if (rawPath.startsWith(`${KFARMS_BASE_PATH}/`)) {
    return `${rawPath}${suffix}`;
  }

  const legacyPath = normalizePathOnly(rawPath);
  const appPath =
    LEGACY_TO_APP_PATH.get(legacyPath) ||
    `${KFARMS_BASE_PATH}${legacyPath.startsWith("/") ? legacyPath : `/${legacyPath}`}`;

  return `${appPath}${suffix}`;
}

export function toKfarmsLegacyPath(value = KFARMS_DEFAULT_APP_PATH) {
  const { pathname, suffix } = splitSuffix(value);
  const rawPath = String(pathname || "").trim();

  if (!rawPath) {
    return `${KFARMS_DEFAULT_LEGACY_PATH}${suffix}`;
  }

  const legacyPath =
    APP_TO_LEGACY_PATH.get(rawPath) ||
    normalizePathOnly(rawPath);

  return `${legacyPath}${suffix}`;
}

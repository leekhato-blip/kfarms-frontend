const LEGACY_ROUTE_ALIASES = [
  [/^\/fish-hatches(?:\/.*)?$/i, "/fish-ponds"],
  [/^\/health-events(?:\/.*)?$/i, "/dashboard"],
  [/^\/notifications(?:\/.*)?$/i, "/dashboard"],
];

function normalizeRoute(url) {
  const raw = String(url || "").trim();
  if (!raw) {
    return null;
  }

  const [pathname] = raw.split(/[?#]/, 1);
  if (!pathname?.startsWith("/")) {
    return null;
  }

  const matchedAlias = LEGACY_ROUTE_ALIASES.find(([pattern]) => pattern.test(pathname));
  return matchedAlias ? matchedAlias[1] : raw;
}

export function resolveSearchTarget(result) {
  const directRoute = normalizeRoute(result?.url);
  if (directRoute) {
    return directRoute;
  }

  const haystack = [
    result?.entityType,
    result?.entity,
    result?.type,
    result?.subtitle,
    result?.category,
    result?.section,
    result?.title,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (haystack.includes("egg") || haystack.includes("production")) {
    return "/productions";
  }

  if (haystack.includes("feed")) {
    return "/feeds";
  }

  if (haystack.includes("inventory") || haystack.includes("stock item")) {
    return "/inventory";
  }

  if (haystack.includes("supply") || haystack.includes("purchase")) {
    return "/supplies";
  }

  if (haystack.includes("sale") || haystack.includes("invoice") || haystack.includes("revenue")) {
    return "/sales";
  }

  if (
    haystack.includes("poultry") ||
    haystack.includes("livestock") ||
    haystack.includes("flock") ||
    haystack.includes("batch")
  ) {
    return "/poultry";
  }

  if (haystack.includes("pond") || haystack.includes("hatch") || haystack.includes("fish")) {
    return "/fish-ponds";
  }

  return "/dashboard";
}

export function normalizeSearchResult(result) {
  if (!result || typeof result !== "object") {
    return result;
  }

  const target = resolveSearchTarget(result);
  return {
    ...result,
    target,
    url: target,
  };
}

<<<<<<< HEAD
import { toKfarmsAppPath } from "../apps/kfarms/paths";

=======
>>>>>>> 0babf4d (Update frontend application)
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
<<<<<<< HEAD
  return toKfarmsAppPath(matchedAlias ? matchedAlias[1] : raw);
=======
  return matchedAlias ? matchedAlias[1] : raw;
>>>>>>> 0babf4d (Update frontend application)
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
<<<<<<< HEAD
    return toKfarmsAppPath("/productions");
  }

  if (haystack.includes("feed")) {
    return toKfarmsAppPath("/feeds");
  }

  if (haystack.includes("inventory") || haystack.includes("stock item")) {
    return toKfarmsAppPath("/inventory");
  }

  if (haystack.includes("supply") || haystack.includes("purchase")) {
    return toKfarmsAppPath("/supplies");
  }

  if (haystack.includes("sale") || haystack.includes("invoice") || haystack.includes("revenue")) {
    return toKfarmsAppPath("/sales");
=======
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
>>>>>>> 0babf4d (Update frontend application)
  }

  if (
    haystack.includes("poultry") ||
    haystack.includes("livestock") ||
    haystack.includes("flock") ||
    haystack.includes("batch")
  ) {
<<<<<<< HEAD
    return toKfarmsAppPath("/poultry");
  }

  if (haystack.includes("pond") || haystack.includes("hatch") || haystack.includes("fish")) {
    return toKfarmsAppPath("/fish-ponds");
  }

  return toKfarmsAppPath("/dashboard");
=======
    return "/poultry";
  }

  if (haystack.includes("pond") || haystack.includes("hatch") || haystack.includes("fish")) {
    return "/fish-ponds";
  }

  return "/dashboard";
>>>>>>> 0babf4d (Update frontend application)
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

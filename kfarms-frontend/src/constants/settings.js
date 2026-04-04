export const THEME_STORAGE_KEY = "kf_theme";
export const PLATFORM_THEME_STORAGE_KEY = "roots_theme";
export const SETTINGS_THEME_EVENT = "kf-theme-changed";
export const THEME_SCOPES = Object.freeze({
  KFARMS: "kfarms",
  PLATFORM: "platform",
});

export const DEFAULT_ORGANIZATION_SETTINGS = Object.freeze({
  organizationName: "",
  organizationSlug: "",
  timezone: "Africa/Lagos",
  currency: "NGN",
  contactEmail: "",
  contactPhone: "",
  criticalSmsAlertsEnabled: false,
  address: "",
  watermarkEnabled: true,
  logoUrl: "",
  brandPrimaryColor: "#2563EB",
  brandAccentColor: "#10B981",
  loginHeadline: "",
  loginMessage: "",
  reportFooter: "",
  customDomain: "",
});

export const DEFAULT_USER_PREFERENCES = Object.freeze({
  themePreference: "SYSTEM",
  landingPage: "/dashboard",
  emailNotifications: true,
  pushNotifications: true,
  weeklySummary: true,
  compactTables: false,
});

export const TIMEZONE_OPTIONS = Object.freeze([
  { value: "Africa/Lagos", label: "Africa/Lagos (WAT)" },
  { value: "UTC", label: "UTC" },
  { value: "Africa/Nairobi", label: "Africa/Nairobi (EAT)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
]);

export const CURRENCY_OPTIONS = Object.freeze([
  { value: "NGN", label: "Nigerian Naira (NGN)" },
  { value: "USD", label: "US Dollar (USD)" },
]);

export const LANDING_PAGE_OPTIONS = Object.freeze([
  { value: "/dashboard", label: "Dashboard" },
  { value: "/sales", label: "Sales" },
  { value: "/supplies", label: "Supplies" },
  { value: "/fish-ponds", label: "Fish Ponds" },
  { value: "/poultry", label: "Poultry" },
  { value: "/feeds", label: "Feeds" },
  { value: "/productions", label: "Productions" },
  { value: "/inventory", label: "Inventory" },
  { value: "/settings", label: "Settings" },
  { value: "/billing", label: "Billing" },
  { value: "/support", label: "Support" },
]);

export const THEME_OPTIONS = Object.freeze([
  { value: "SYSTEM", label: "System" },
  { value: "LIGHT", label: "Light" },
  { value: "DARK", label: "Dark" },
]);

const VALID_THEME_PREFERENCES = new Set(THEME_OPTIONS.map((option) => option.value));
const THEME_SCOPE_DEFAULTS = Object.freeze({
  [THEME_SCOPES.KFARMS]: DEFAULT_USER_PREFERENCES.themePreference,
  [THEME_SCOPES.PLATFORM]: "DARK",
});
const VALID_LANDING_PAGES = new Set([
  ...LANDING_PAGE_OPTIONS.map((option) => option.value),
  "/livestock",
]);

function resolveThemeScopeConfig(scope = THEME_SCOPES.KFARMS) {
  const normalizedScope =
    String(scope || "")
      .trim()
      .toLowerCase() === THEME_SCOPES.PLATFORM
      ? THEME_SCOPES.PLATFORM
      : THEME_SCOPES.KFARMS;

  return {
    scope: normalizedScope,
    storageKey:
      normalizedScope === THEME_SCOPES.PLATFORM
        ? PLATFORM_THEME_STORAGE_KEY
        : THEME_STORAGE_KEY,
    defaultPreference:
      THEME_SCOPE_DEFAULTS[normalizedScope] ||
      DEFAULT_USER_PREFERENCES.themePreference,
  };
}

function getSystemThemeMode() {
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

export function resolveThemeScopeFromPath(pathname = "") {
  return String(pathname || "").trim().startsWith("/platform")
    ? THEME_SCOPES.PLATFORM
    : THEME_SCOPES.KFARMS;
}

export function normalizeThemePreference(value) {
  const normalized = String(value ?? "").trim().toUpperCase();
  return VALID_THEME_PREFERENCES.has(normalized)
    ? normalized
    : DEFAULT_USER_PREFERENCES.themePreference;
}

export function getStoredThemePreference(scope = THEME_SCOPES.KFARMS) {
  const { storageKey, defaultPreference } = resolveThemeScopeConfig(scope);

  if (typeof window === "undefined") {
    return normalizeThemePreference(defaultPreference).toLowerCase();
  }

  return normalizeThemePreference(
    window.localStorage.getItem(storageKey) || defaultPreference,
  ).toLowerCase();
}

export function cycleThemePreference(themePreference) {
  const current = normalizeThemePreference(themePreference).toLowerCase();

  if (current === "system") return "dark";
  if (current === "dark") return "light";
  return "system";
}

export function formatThemePreferenceLabel(themePreference) {
  const normalized = normalizeThemePreference(themePreference).toLowerCase();
  return `${normalized.slice(0, 1).toUpperCase()}${normalized.slice(1)}`;
}

export function normalizeLandingPage(value) {
  const normalized = String(value ?? "").trim();
  const canonicalValue = normalized === "/livestock" ? "/poultry" : normalized;
  return VALID_LANDING_PAGES.has(normalized)
    ? canonicalValue
    : DEFAULT_USER_PREFERENCES.landingPage;
}

export function normalizeOrganizationSettings(settings = {}) {
  const normalizeColor = (value, fallback) => {
    const normalized = String(value ?? "").trim();
    if (!/^#?[0-9A-Fa-f]{6}$/.test(normalized)) return fallback;
    return normalized.startsWith("#")
      ? normalized.toUpperCase()
      : `#${normalized.toUpperCase()}`;
  };

  return {
    organizationName: String(
      settings.organizationName ?? DEFAULT_ORGANIZATION_SETTINGS.organizationName,
    ).trim(),
    organizationSlug: String(
      settings.organizationSlug ?? DEFAULT_ORGANIZATION_SETTINGS.organizationSlug,
    ).trim(),
    timezone: String(settings.timezone ?? DEFAULT_ORGANIZATION_SETTINGS.timezone).trim(),
    currency: String(settings.currency ?? DEFAULT_ORGANIZATION_SETTINGS.currency)
      .trim()
      .toUpperCase(),
    contactEmail: String(
      settings.contactEmail ?? DEFAULT_ORGANIZATION_SETTINGS.contactEmail,
    ).trim(),
    contactPhone: String(
      settings.contactPhone ?? DEFAULT_ORGANIZATION_SETTINGS.contactPhone,
    ).trim(),
    criticalSmsAlertsEnabled:
      settings.criticalSmsAlertsEnabled ??
      DEFAULT_ORGANIZATION_SETTINGS.criticalSmsAlertsEnabled,
    address: String(settings.address ?? DEFAULT_ORGANIZATION_SETTINGS.address).trim(),
    watermarkEnabled:
      settings.watermarkEnabled ?? DEFAULT_ORGANIZATION_SETTINGS.watermarkEnabled,
    logoUrl: String(settings.logoUrl ?? DEFAULT_ORGANIZATION_SETTINGS.logoUrl).trim(),
    brandPrimaryColor: normalizeColor(
      settings.brandPrimaryColor,
      DEFAULT_ORGANIZATION_SETTINGS.brandPrimaryColor,
    ),
    brandAccentColor: normalizeColor(
      settings.brandAccentColor,
      DEFAULT_ORGANIZATION_SETTINGS.brandAccentColor,
    ),
    loginHeadline: String(
      settings.loginHeadline ?? DEFAULT_ORGANIZATION_SETTINGS.loginHeadline,
    ).trim(),
    loginMessage: String(
      settings.loginMessage ?? DEFAULT_ORGANIZATION_SETTINGS.loginMessage,
    ).trim(),
    reportFooter: String(
      settings.reportFooter ?? DEFAULT_ORGANIZATION_SETTINGS.reportFooter,
    ).trim(),
    customDomain: String(
      settings.customDomain ?? DEFAULT_ORGANIZATION_SETTINGS.customDomain,
    )
      .trim()
      .toLowerCase(),
  };
}

export function normalizeUserPreferences(preferences = {}) {
  return {
    themePreference: normalizeThemePreference(preferences.themePreference),
    landingPage: normalizeLandingPage(preferences.landingPage),
    emailNotifications:
      preferences.emailNotifications ?? DEFAULT_USER_PREFERENCES.emailNotifications,
    pushNotifications:
      preferences.pushNotifications ?? DEFAULT_USER_PREFERENCES.pushNotifications,
    weeklySummary: preferences.weeklySummary ?? DEFAULT_USER_PREFERENCES.weeklySummary,
    compactTables: preferences.compactTables ?? DEFAULT_USER_PREFERENCES.compactTables,
  };
}

export function resolveThemeMode(themePreference) {
  const preference = normalizeThemePreference(themePreference);
  if (preference === "LIGHT") return "light";
  if (preference === "DARK") return "dark";
  return getSystemThemeMode();
}

export function getStoredThemeMode(scope = THEME_SCOPES.KFARMS) {
  const { defaultPreference } = resolveThemeScopeConfig(scope);

  if (typeof window === "undefined") {
    return resolveThemeMode(defaultPreference);
  }

  return resolveThemeMode(getStoredThemePreference(scope));
}

export function applyThemePreference(themePreference, scope = THEME_SCOPES.KFARMS) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const { scope: normalizedScope, storageKey } = resolveThemeScopeConfig(scope);
  const preference = normalizeThemePreference(themePreference);
  const preferenceKey = preference.toLowerCase();
  const mode = resolveThemeMode(preference);

  document.documentElement.classList.toggle("dark", mode === "dark");
  document.body?.classList.toggle("dark", mode === "dark");
  document.documentElement.style.colorScheme = mode;
  window.localStorage.setItem(storageKey, preferenceKey);
  window.dispatchEvent(
    new CustomEvent(SETTINGS_THEME_EVENT, {
      detail: {
        mode,
        preference: preferenceKey,
        scope: normalizedScope,
        storageKey,
      },
    }),
  );
}

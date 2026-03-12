import apiClient from "../api/apiClient";
import {
  DEFAULT_ORGANIZATION_SETTINGS,
  DEFAULT_USER_PREFERENCES,
  applyThemePreference,
  normalizeOrganizationSettings,
  normalizeUserPreferences,
} from "../constants/settings";

const USER_PREFERENCES_CACHE_KEY = "kf-settings-user-preferences-cache";
const ORGANIZATION_SETTINGS_CACHE_KEY = "kf-settings-organization-cache";

const SETTINGS_ENDPOINTS = {
  organization: "/settings/organization",
  preferences: "/settings/preferences",
  password: "/settings/password",
};

function extractErrorMessage(error, fallback) {
  const payload = error?.response?.data;
  if (typeof payload === "string" && payload.trim()) return payload;
  if (typeof payload?.message === "string" && payload.message.trim()) {
    return payload.message;
  }
  if (typeof payload?.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  return fallback;
}

function readStorageMap(key) {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorageMap(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizeId(value, fallback = "default") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function getPreferenceCacheKey({ tenantId, userId } = {}) {
  return `${normalizeId(tenantId)}:${normalizeId(userId, "me")}`;
}

function getOrganizationCacheKey({ tenantId } = {}) {
  return normalizeId(tenantId);
}

function cacheUserPreferences({ tenantId, userId, preferences } = {}) {
  const key = getPreferenceCacheKey({ tenantId, userId });
  const map = readStorageMap(USER_PREFERENCES_CACHE_KEY);
  map[key] = normalizeUserPreferences(preferences);
  writeStorageMap(USER_PREFERENCES_CACHE_KEY, map);
  return map[key];
}

export function getCachedUserPreferences({ tenantId, userId } = {}) {
  const key = getPreferenceCacheKey({ tenantId, userId });
  const map = readStorageMap(USER_PREFERENCES_CACHE_KEY);
  const cached = map[key];
  return cached ? normalizeUserPreferences(cached) : null;
}

function cacheOrganizationSettings({ tenantId, settings } = {}) {
  const key = getOrganizationCacheKey({ tenantId });
  const map = readStorageMap(ORGANIZATION_SETTINGS_CACHE_KEY);
  map[key] = normalizeOrganizationSettings(settings);
  writeStorageMap(ORGANIZATION_SETTINGS_CACHE_KEY, map);
  return map[key];
}

export function getCachedOrganizationSettings({ tenantId } = {}) {
  const key = getOrganizationCacheKey({ tenantId });
  const map = readStorageMap(ORGANIZATION_SETTINGS_CACHE_KEY);
  const cached = map[key];
  return cached ? normalizeOrganizationSettings(cached) : null;
}

export function getCachedLandingPage({ tenantId, userId } = {}) {
  return (
    getCachedUserPreferences({ tenantId, userId })?.landingPage ||
    DEFAULT_USER_PREFERENCES.landingPage
  );
}

export async function getOrganizationSettings({
  tenantId,
  tenantName = "",
  tenantSlug = "",
} = {}) {
  if (!tenantId) {
    return normalizeOrganizationSettings({
      ...DEFAULT_ORGANIZATION_SETTINGS,
      organizationName: tenantName,
      organizationSlug: tenantSlug,
    });
  }

  try {
    const response = await apiClient.get(SETTINGS_ENDPOINTS.organization);
    const payload = response.data?.data ?? response.data;
    const normalized = normalizeOrganizationSettings({
      organizationName: tenantName,
      organizationSlug: tenantSlug,
      ...payload,
    });
    cacheOrganizationSettings({ tenantId, settings: normalized });
    return normalized;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Could not load organization settings."),
    );
  }
}

export async function saveOrganizationSettings({ tenantId, settings } = {}) {
  if (!tenantId) {
    throw new Error("Select a workspace before saving organization settings.");
  }

  try {
    const response = await apiClient.put(
      SETTINGS_ENDPOINTS.organization,
      normalizeOrganizationSettings(settings),
    );
    const payload = response.data?.data ?? response.data;
    const normalized = normalizeOrganizationSettings(payload);
    cacheOrganizationSettings({ tenantId, settings: normalized });
    return normalized;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Could not save organization settings."),
    );
  }
}

export async function getUserPreferences({ tenantId, userId } = {}) {
  if (!tenantId) {
    return normalizeUserPreferences(DEFAULT_USER_PREFERENCES);
  }

  try {
    const response = await apiClient.get(SETTINGS_ENDPOINTS.preferences);
    const payload = response.data?.data ?? response.data;
    const normalized = normalizeUserPreferences(payload);
    cacheUserPreferences({ tenantId, userId, preferences: normalized });
    applyThemePreference(normalized.themePreference);
    return normalized;
  } catch (error) {
    const cached = getCachedUserPreferences({ tenantId, userId });
    if (cached) {
      applyThemePreference(cached.themePreference);
      return cached;
    }

    throw new Error(extractErrorMessage(error, "Could not load preferences."));
  }
}

export async function saveUserPreferences({
  tenantId,
  userId,
  preferences,
} = {}) {
  if (!tenantId) {
    throw new Error("Select a workspace before saving preferences.");
  }

  try {
    const response = await apiClient.put(
      SETTINGS_ENDPOINTS.preferences,
      normalizeUserPreferences(preferences),
    );
    const payload = response.data?.data ?? response.data;
    const normalized = normalizeUserPreferences(payload);
    cacheUserPreferences({ tenantId, userId, preferences: normalized });
    applyThemePreference(normalized.themePreference);
    return normalized;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Failed to save preferences."));
  }
}

export async function updatePassword({
  currentPassword,
  newPassword,
  confirmPassword,
} = {}) {
  try {
    const response = await apiClient.post(SETTINGS_ENDPOINTS.password, {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return {
      ...(response.data?.data ?? response.data ?? {}),
      message: response.data?.message,
    };
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not update password."));
  }
}

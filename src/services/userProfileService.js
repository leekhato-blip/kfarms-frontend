const TENANT_USER_PROFILE_STORAGE_KEY = "kf-tenant-user-profiles";
const PLATFORM_USER_PROFILE_STORAGE_KEY = "kf-platform-user-profiles";

const DEFAULT_EDITABLE_PROFILE = Object.freeze({
  displayName: "",
  phoneNumber: "",
  jobTitle: "",
  bio: "",
});

function canUseBrowserStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readProfileMap(key) {
  if (!canUseBrowserStorage()) return {};

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeProfileMap(key, value) {
  if (!canUseBrowserStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function resolveUserProfileKey(user = {}) {
  const candidates = [
    user?.id,
    user?.userId,
    user?.username,
    user?.email,
  ];
  const resolved = candidates
    .map((value) => normalizeText(value).toLowerCase())
    .find(Boolean);

  return resolved || "me";
}

function normalizeEditableProfile(profile = {}) {
  return {
    displayName: normalizeText(profile.displayName ?? profile.fullName),
    phoneNumber: normalizeText(profile.phoneNumber ?? profile.phone),
    jobTitle: normalizeText(profile.jobTitle ?? profile.title),
    bio: normalizeText(profile.bio),
  };
}

function resolveDisplayName(user = {}, profile = {}) {
  return (
    normalizeText(profile.displayName) ||
    normalizeText(user?.displayName) ||
    normalizeText(user?.fullName) ||
    normalizeText(user?.username) ||
    normalizeText(user?.email)
  );
}

function resolvePhoneNumber(user = {}, profile = {}) {
  return normalizeText(profile.phoneNumber) || normalizeText(user?.phoneNumber ?? user?.phone);
}

function resolveJobTitle(user = {}, profile = {}) {
  return normalizeText(profile.jobTitle) || normalizeText(user?.jobTitle ?? user?.title);
}

function resolveBio(user = {}, profile = {}) {
  return normalizeText(profile.bio) || normalizeText(user?.bio);
}

function getStoredProfile(storageKey, user = {}) {
  const key = resolveUserProfileKey(user);
  const map = readProfileMap(storageKey);
  const stored = map[key];
  return stored ? normalizeEditableProfile(stored) : null;
}

function saveStoredProfile(storageKey, user = {}, profile = {}) {
  const key = resolveUserProfileKey(user);
  const map = readProfileMap(storageKey);
  const normalizedProfile = normalizeEditableProfile(profile);
  map[key] = normalizedProfile;
  writeProfileMap(storageKey, map);
  return normalizedProfile;
}

function buildEditableProfileDraft(user = {}, profile = null) {
  const normalizedProfile = normalizeEditableProfile(profile || {});

  return {
    ...DEFAULT_EDITABLE_PROFILE,
    displayName: resolveDisplayName(user, normalizedProfile),
    phoneNumber: resolvePhoneNumber(user, normalizedProfile),
    jobTitle: resolveJobTitle(user, normalizedProfile),
    bio: resolveBio(user, normalizedProfile),
  };
}

function applyProfileToUser(user, storageKey) {
  if (!user) return user;

  const storedProfile = getStoredProfile(storageKey, user);
  if (!storedProfile) {
    return {
      ...user,
      displayName: resolveDisplayName(user),
      phoneNumber: resolvePhoneNumber(user),
      jobTitle: resolveJobTitle(user),
      bio: resolveBio(user),
    };
  }

  return {
    ...user,
    displayName: resolveDisplayName(user, storedProfile),
    phoneNumber: resolvePhoneNumber(user, storedProfile),
    jobTitle: resolveJobTitle(user, storedProfile),
    bio: resolveBio(user, storedProfile),
  };
}

export function getUserDisplayName(user, fallback = "User") {
  return resolveDisplayName(user) || fallback;
}

export function createTenantUserProfileDraft(user = {}) {
  return buildEditableProfileDraft(
    user,
    getStoredProfile(TENANT_USER_PROFILE_STORAGE_KEY, user),
  );
}

export function saveTenantUserProfile({ user, profile } = {}) {
  const savedProfile = saveStoredProfile(TENANT_USER_PROFILE_STORAGE_KEY, user, profile);
  return buildEditableProfileDraft(user, savedProfile);
}

export function applyTenantUserProfile(user) {
  return applyProfileToUser(user, TENANT_USER_PROFILE_STORAGE_KEY);
}

export function createPlatformUserProfileDraft(user = {}) {
  return buildEditableProfileDraft(
    user,
    getStoredProfile(PLATFORM_USER_PROFILE_STORAGE_KEY, user),
  );
}

export function savePlatformUserProfile({ user, profile } = {}) {
  const savedProfile = saveStoredProfile(PLATFORM_USER_PROFILE_STORAGE_KEY, user, profile);
  return buildEditableProfileDraft(user, savedProfile);
}

export function applyPlatformUserProfile(user) {
  return applyProfileToUser(user, PLATFORM_USER_PROFILE_STORAGE_KEY);
}

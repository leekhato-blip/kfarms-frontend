import { buildPlatformDemoSnapshot } from "../pages/platform/platformWorkbench";
import { normalizePlatformRole } from "../utils/platformRoles";

export const PLATFORM_DEV_TOKEN_PREFIX = "platform-dev::";
export const PLATFORM_DEV_PROFILE_KEY = "roots_platform_dev_profile";
const PLATFORM_DEMO_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const PLATFORM_DEMO_HOST_SUFFIXES = [".onrender.com"];

function canUseBrowserStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function isPlatformDemoHost(hostname) {
  const normalizedHostname = String(hostname || "").trim().toLowerCase();
  if (!normalizedHostname) return false;
  if (PLATFORM_DEMO_HOSTS.has(normalizedHostname)) return true;
  return PLATFORM_DEMO_HOST_SUFFIXES.some((suffix) => normalizedHostname.endsWith(suffix));
}

export function canUsePlatformDevSession() {
  if (typeof window === "undefined") return false;
  return isPlatformDemoHost(window.location.hostname);
}

function normalizeDemoUser(user) {
  if (!user) return null;

  return {
    id: Number(user.id ?? user.userId) || null,
    userId: Number(user.userId ?? user.id) || null,
    username: String(user.username ?? "").trim(),
    email: String(user.email ?? "").trim(),
    role: normalizePlatformRole(user.role),
    platformAccess: true,
    platformOwner: Boolean(user.platformOwner),
    enabled: user.enabled !== false,
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };
}

function getDemoUsers() {
  return buildPlatformDemoSnapshot([]).users.map(normalizeDemoUser).filter(Boolean);
}

export function findPlatformDemoUser(identifier) {
  const normalizedIdentifier = String(identifier ?? "").trim().toLowerCase();
  if (!normalizedIdentifier) return null;

  return (
    getDemoUsers().find((user) => {
      const username = String(user.username || "").trim().toLowerCase();
      const email = String(user.email || "").trim().toLowerCase();
      const emailLocalPart = email.split("@")[0];

      return (
        normalizedIdentifier === username ||
        normalizedIdentifier === email ||
        normalizedIdentifier === emailLocalPart
      );
    }) || null
  );
}

export function createPlatformDevToken(user) {
  return `${PLATFORM_DEV_TOKEN_PREFIX}${Number(user?.id ?? user?.userId ?? 0) || 0}`;
}

export function isPlatformDevToken(token) {
  return String(token ?? "").startsWith(PLATFORM_DEV_TOKEN_PREFIX);
}

export function writePlatformDevSession(user) {
  if (!canUseBrowserStorage()) return;
  const normalizedUser = normalizeDemoUser(user);
  if (!normalizedUser) return;
  window.localStorage.setItem(PLATFORM_DEV_PROFILE_KEY, JSON.stringify(normalizedUser));
}

export function readPlatformDevSession() {
  if (!canUseBrowserStorage()) return null;

  try {
    const raw = window.localStorage.getItem(PLATFORM_DEV_PROFILE_KEY);
    if (!raw) return null;
    return normalizeDemoUser(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearPlatformDevSession() {
  if (!canUseBrowserStorage()) return;
  window.localStorage.removeItem(PLATFORM_DEV_PROFILE_KEY);
}

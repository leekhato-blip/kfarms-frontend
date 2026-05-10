export const DEMO_ACCOUNT_HINT_KEY = "kf_demo_account";
export const DEMO_ACCOUNT_EMAIL = "demo.user@demo.kfarms.local";
export const DEMO_ACCOUNT_USERNAME = "demo.user";
export const DEMO_ACCOUNT_PASSWORD = "FarmDemo@2026";
export const DEMO_ACCOUNT_LABEL = "Open demo workspace";
export const DEMO_ACCOUNT_INFO =
  "Read-only sample farm with poultry, fish, feed, inventory, and sales data.";
export const DEMO_ACCOUNT_BLOCKED_MESSAGE =
  "This is a demo account. Changes are disabled because the data is not real.";
export const DEMO_ACCOUNT_EVENT = "kf-demo-mode-blocked";

export function isDemoAccountUser(user) {
  return String(user?.email || "").trim().toLowerCase() === DEMO_ACCOUNT_EMAIL;
}

export function hasDemoAccountHint() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DEMO_ACCOUNT_HINT_KEY) === "1";
}

export function setDemoAccountHint(value) {
  if (typeof window === "undefined") return;
  if (value) {
    window.localStorage.setItem(DEMO_ACCOUNT_HINT_KEY, "1");
    return;
  }
  window.localStorage.removeItem(DEMO_ACCOUNT_HINT_KEY);
}

export function emitDemoAccountBlocked(message = DEMO_ACCOUNT_BLOCKED_MESSAGE) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(DEMO_ACCOUNT_EVENT, {
      detail: { message },
    }),
  );
}

export function isDemoBlockedMessage(message) {
  return String(message || "").toLowerCase().includes("demo account");
}

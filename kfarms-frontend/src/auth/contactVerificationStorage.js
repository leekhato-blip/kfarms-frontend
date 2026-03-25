const CONTACT_VERIFICATION_STORAGE_KEY = "kf_pending_contact_verification";

export function readPendingContactVerification() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(CONTACT_VERIFICATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function writePendingContactVerification(payload) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    CONTACT_VERIFICATION_STORAGE_KEY,
    JSON.stringify(payload || {}),
  );
}

export function clearPendingContactVerification() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(CONTACT_VERIFICATION_STORAGE_KEY);
}

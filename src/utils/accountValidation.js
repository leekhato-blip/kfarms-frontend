export const ACCOUNT_PASSWORD_MIN_LENGTH = 6;

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

export function normalizePhoneNumber(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const leadingPlus = raw.startsWith("+") ? "+" : "";
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  return `${leadingPlus}${digits}`;
}

export function looksLikePhoneNumber(value) {
  return /^\+?\d{7,15}$/.test(normalizePhoneNumber(value));
}

export function getAccountPasswordChecks(
  value,
  minimumLength = ACCOUNT_PASSWORD_MIN_LENGTH,
) {
  const password = String(value || "");

  return {
    minimumLength,
    hasMinimumLength: password.length >= minimumLength,
    hasLetter: /[A-Za-z]/.test(password),
    hasNumber: /\d/.test(password),
  };
}

export function validateAccountPassword(value, minimumLength = ACCOUNT_PASSWORD_MIN_LENGTH) {
  const checks = getAccountPasswordChecks(value, minimumLength);

  if (!checks.hasMinimumLength) {
    return `Use at least ${minimumLength} characters for your password.`;
  }

  if (!checks.hasLetter || !checks.hasNumber) {
    return "Use at least one letter and one number in your password.";
  }

  return "";
}

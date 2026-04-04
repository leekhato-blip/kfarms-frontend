function toLocalIsoString(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString();
}

export function todayDateInputValue() {
  return toLocalIsoString(new Date()).slice(0, 10);
}

export function toDateInputValue(value, fallback = "") {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  return toLocalIsoString(value).slice(0, 10) || fallback;
}

export function nowDateTimeLocalValue() {
  return toLocalIsoString(new Date()).slice(0, 16);
}

export function toDateTimeLocalValue(value, fallback = "") {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
      return normalized;
    }
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(normalized)) {
      return normalized.replace(" ", "T").slice(0, 16);
    }
  }

  return toLocalIsoString(value).slice(0, 16) || fallback;
}

export function sanitizeCurrencyInput(
  value,
  { allowDecimal = false, maxFractionDigits = 2 } = {},
) {
  const normalized = String(value || "")
    .replace(/,/g, "")
    .replace(/[^\d.]/g, "");

  if (!allowDecimal) {
    return normalized.replace(/\./g, "");
  }

  const [wholePart = "", ...fractionParts] = normalized.split(".");
  if (fractionParts.length === 0) {
    return wholePart;
  }

  const fraction = fractionParts.join("").slice(0, maxFractionDigits);
  return `${wholePart}.${fraction}`;
}

export function formatCurrencyInput(
  value,
  { maximumFractionDigits = 0 } = {},
) {
  const normalized = String(value ?? "").replace(/,/g, "").trim();
  if (!normalized) {
    return "";
  }

  const [wholePart = "", fractionPart = ""] = normalized.split(".");
  const wholeNumber = Number(wholePart || 0);
  const formattedWhole = new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0,
  }).format(wholeNumber);

  if (maximumFractionDigits > 0 && normalized.includes(".")) {
    return `${formattedWhole}.${fractionPart.slice(0, maximumFractionDigits)}`;
  }

  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) {
    return normalized;
  }

  return new Intl.NumberFormat("en-NG", {
    maximumFractionDigits,
  }).format(numeric);
}

export function normalizeCurrencyOnBlur(
  value,
  { allowDecimal = false, maxFractionDigits = 2 } = {},
) {
  const sanitized = sanitizeCurrencyInput(value, {
    allowDecimal,
    maxFractionDigits,
  });

  if (!sanitized) {
    return "";
  }

  const numeric = Number(sanitized);
  if (!Number.isFinite(numeric)) {
    return "";
  }

  if (!allowDecimal) {
    return String(Math.trunc(numeric));
  }

  const [_, fractionPart = ""] = sanitized.split(".");
  if (!fractionPart) {
    return String(numeric);
  }

  return numeric
    .toFixed(Math.min(fractionPart.length, maxFractionDigits))
    .replace(/\.0+$/, "")
    .replace(/(\.\d*[1-9])0+$/, "$1");
}

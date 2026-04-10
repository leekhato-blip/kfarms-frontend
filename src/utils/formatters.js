export function formatNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "0";
  return parsed.toLocaleString();
}

export function replaceCurrencyCodeWithSymbol(value) {
  if (typeof value !== "string") return value;

  return value.replace(/NGN(?:\s|\u00A0)*/g, "₦");
}

export function formatCurrencyValue(value, currency = "NGN", options = {}) {
  const parsed = Number(value);
  const normalizedCurrency = String(currency || "NGN").toUpperCase();
  if (!Number.isFinite(parsed)) {
    return replaceCurrencyCodeWithSymbol(`${normalizedCurrency} 0`);
  }

  const formatted = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: normalizedCurrency,
    maximumFractionDigits: 0,
    ...options,
  }).format(parsed);

  return replaceCurrencyCodeWithSymbol(formatted);
}

export function formatCompactCurrencyValue(value, currency = "NGN", options = {}) {
  const parsed = Number(value);
  const normalizedCurrency = String(currency || "NGN").toUpperCase();

  if (!Number.isFinite(parsed)) {
    return replaceCurrencyCodeWithSymbol(`${normalizedCurrency} 0`);
  }

  const absolute = Math.abs(parsed);
  const compactSteps = [
    { threshold: 1_000_000_000_000, suffix: "T" },
    { threshold: 1_000_000_000, suffix: "B" },
    { threshold: 1_000_000, suffix: "M" },
    { threshold: 1_000, suffix: "K" },
  ];
  const fractionDigits =
    typeof options.maximumFractionDigits === "number"
      ? options.maximumFractionDigits
      : 1;
  const compactStep = compactSteps.find((step) => absolute >= step.threshold);

  if (!compactStep) {
    return formatCurrencyValue(parsed, normalizedCurrency, {
      maximumFractionDigits: 0,
      ...options,
    });
  }

  const compactValue = parsed / compactStep.threshold;
  const compactNumber = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(compactValue);

  return replaceCurrencyCodeWithSymbol(`${normalizedCurrency} ${compactNumber}${compactStep.suffix}`);
}

export function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function normalizePagination(data, fallback = { page: 0, size: 10 }) {
  if (Array.isArray(data)) {
    return {
      items: data,
      page: fallback.page,
      size: fallback.size,
      totalItems: data.length,
      totalPages: 1,
    };
  }

  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.content)
      ? data.content
      : [];

  const totalItems = data?.totalItems ?? data?.totalElements ?? items.length;
  const size = data?.size ?? fallback.size;

  return {
    items,
    page: data?.page ?? data?.number ?? fallback.page,
    size,
    totalItems,
    totalPages: data?.totalPages ?? Math.max(1, Math.ceil(totalItems / Math.max(1, size))),
  };
}

export function readTokenFromPayload(payload) {
  return (
    payload?.token ||
    payload?.accessToken ||
    payload?.jwt ||
    payload?.data?.token ||
    payload?.data?.accessToken ||
    payload?.data?.jwt ||
    ""
  );
}

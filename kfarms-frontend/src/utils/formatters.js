export function formatNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "0";
  return parsed.toLocaleString();
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

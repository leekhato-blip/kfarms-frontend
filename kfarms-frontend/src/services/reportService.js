import api from "./axios";

function getFilenameFromHeaders(headers, fallback = "report.csv") {
  const disposition = headers?.["content-disposition"] || headers?.get?.("content-disposition");
  if (!disposition) return fallback;
  const match = /filename="?([^"]+)"?/.exec(disposition);
  return match?.[1] || fallback;
}

export async function exportReport({ type = "csv", category, start, end } = {}) {
  const response = await api.get("/reports/export", {
    params: {
      type,
      category,
      start: start || undefined,
      end: end || undefined,
    },
    responseType: "blob",
  });

  const filename = getFilenameFromHeaders(response.headers, `${category || "report"}.${type}`);
  return { blob: response.data, filename };
}

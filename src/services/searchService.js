import api from "../api/apiClient";
import { normalizeSearchResult } from "../search/searchUtils";

export async function search(q, limit = 20) {
  const res = await api.get("/search", {
    params: { q, limit },
  });
  const results = res.data?.data ?? res.data;
  return Array.isArray(results) ? results.map(normalizeSearchResult) : [];
}

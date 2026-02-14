import api from "./axios";

export async function search(q, limit = 20) {
  const res = await api.get("/search", {
    params: { q, limit },
  });
  return res.data?.data ?? res.data;
}

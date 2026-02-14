import api from "./axios";

/**
 * Fetch feed summary for Feeds page.
 * Backend route: GET /feeds/summary
 * Returns: { success, message, data }
 */
export async function getFeedSummary() {
  const res = await api.get("/feeds/summary");
  return res.data;
}

/**
 * Fetch all feeds with pagination & filters
 * Backend: GET /api/feeds
 */
export async function getAllFeeds({ page = 0, size = 10, batchType, date } = {}) {
  const params = {
    page,
    size,
    ...(batchType && { batchType }),
    ...(date && { date }),
  };

  const res = await api.get("/feeds", { params });
  return res.data.data;
}

export async function getFeedById(id) {
  const res = await api.get(`/feeds/${id}`);
  return res.data.data;
}

export async function createFeed(payload) {
  const res = await api.post("/feeds", payload);
  return res.data.data;
}

export async function updateFeed(id, payload) {
  const res = await api.put(`/feeds/${id}`, payload);
  return res.data.data;
}

export async function deleteFeed(id) {
  const res = await api.delete(`/feeds/${id}`);
  return res.data.success;
}

export async function restoreFeed(id) {
  const res = await api.put(`/feeds/${id}/restore`);
  return res.data.success;
}

export async function getDeletedFeeds({ page = 0, size = 10 } = {}) {
  const res = await api.get("/feeds", {
    params: { page, size, deleted: true },
  });
  return res.data.data;
}

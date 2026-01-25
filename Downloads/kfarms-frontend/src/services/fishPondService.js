import api from "./axios";
// Get ponds with filters + pagination
export async function getFishPonds(params = {}) {
  const {
    page = 0,
    size = 10,
    pondName,
    pondType,
    status,
    lastWaterChange,
  } = params;

  const res = await api.get("/fishpond", {
    params: {
      page,
      size,
      pondName: pondName || undefined,
      pondType: pondType || undefined,
      status: status || undefined,
      lastWaterChange: lastWaterChange || undefined, // 'YYYY-MM-DD'
    },
  });

  // APIResponse<{ items, page, totalItems, totalPages, hasNext, hasPrevious }>
  return res.data.data;
}

// Get pond summary for dashboard cards
export async function getFishPondSummary() {
  const res = await api.get("/fishpond/summary");
  return res.data.data;
}

// Create new pond
export async function createFishPond(payload) {
  const res = await api.post("/fishpond", payload);
  return res.data.data;
}

// Update pond by ID
export async function updateFishPond(id, payload) {
  const res = await api.put(`/fishpond/${id}`, payload);
  return res.data.data;
}

// Soft-delete pond
export async function deleteFishPond(id) {
  const res = await api.delete(`/fishpond/${id}`);
  return res.data.data;
}

// Restore pond
export async function restoreFishPond(id) {
  const res = await api.put(`/fishpond/${id}/restore`);
  return res.data.data;
}

// Adjust stock
export async function adjustFishPondStock(id, payload) {
  // payload: { quantity: number, reason: string }
  const res = await api.post(`/fishpond/${id}/adjust-stock`, payload);
  return res.data.data;
}

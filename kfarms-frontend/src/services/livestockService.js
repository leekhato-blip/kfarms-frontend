import api from "./axios";

// Get livestock with filters + pagination
export async function getLivestock(params = {}) {
  const { page = 0, size = 10, batchName, type, arrivalDate } = params;

  const res = await api.get("/livestock", {
    params: {
      page,
      size,
      batchName: batchName || undefined,
      type: type || undefined,
      arrivalDate: arrivalDate || undefined, // YYYY-MM-DD
    },
  });

  return res.data.data;
}

// Get livestock summary
export async function getLivestockSummary() {
  const res = await api.get("/livestock/summary");
  return res.data.data;
}

// Get livestock overview
export async function getLivestockOverview() {
  const res = await api.get("/livestock/overview");
  return res.data.data;
}

// Create livestock batch
export async function createLivestock(payload) {
  const res = await api.post("/livestock", payload);
  return res.data.data;
}

// Update livestock batch
export async function updateLivestock(id, payload) {
  const res = await api.put(`/livestock/${id}`, payload);
  return res.data.data;
}

// Soft-delete livestock batch
export async function deleteLivestock(id) {
  const res = await api.delete(`/livestock/${id}`);
  return res.data.data;
}

// Restore livestock batch
export async function restoreLivestock(id) {
  const res = await api.put(`/livestock/${id}/restore`);
  return res.data.data;
}


// Fetch deleted livestock (trash)
export async function getDeletedLivestock(params = {}) {
  const res = await api.get("/livestock", {
    params: { page: params.page ?? 0, size: params.size ?? 10, deleted: true },
  });
  return res.data.data;
}

// Permanent delete livestock batch
export async function permanentDeleteLivestock(id) {
  const res = await api.delete(`/livestock/${id}/permanent`);
  return res.data.data;
}
// Adjust stock
export async function adjustLivestockStock(id, payload) {
  const res = await api.post(`/livestock/${id}/adjust-stock`, payload);
  return res.data.data;
}

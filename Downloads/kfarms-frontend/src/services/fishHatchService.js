import api from "./axios";

// Get all hatch records (backend returns list only)
export async function getFishHatches() {
  const res = await api.get("/fish-hatch");
  return res.data.data;
}

// Create new hatch record
export async function createFishHatch(payload) {
  const res = await api.post("/fish-hatch", payload);
  return res.data.data;
}

// Update hatch record
export async function updateFishHatch(id, payload) {
  const res = await api.put(`/fish-hatch/${id}`, payload);
  return res.data.data;
}

// Soft-delete hatch record
export async function deleteFishHatch(id) {
  const res = await api.delete(`/fish-hatch/${id}`);
  return res.data.data;
}

// Restore hatch record
export async function restoreFishHatch(id) {
  const res = await api.put(`/fish-hatch/${id}/restore`);
  return res.data.data;
}

// Summary (for hatch analytics)
export async function getFishHatchSummary() {
  const res = await api.get("/fish-hatch/summary");
  return res.data.data;
}

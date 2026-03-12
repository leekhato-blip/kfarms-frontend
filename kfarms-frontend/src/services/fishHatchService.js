import api from "../api/apiClient";
import { buildOfflineMutationConfig } from "../offline/offlineStore";

// Get all hatch records (backend returns list only)
export async function getFishHatches() {
  const res = await api.get("/fish-hatch");
  return res.data.data;
}

// Fetch deleted hatch records (trash)
export async function getDeletedFishHatches(params = {}) {
  const { page = 0, size = 10 } = params;
  const res = await api.get("/fish-hatch", {
    params: { page, size, deleted: true },
  });
  return res.data.data;
}

// Create new hatch record
export async function createFishHatch(payload, options = {}) {
  const res = await api.post(
    "/fish-hatch",
    payload,
    buildOfflineMutationConfig({
      resource: "fish-hatch",
      action: "create",
      context: options.context,
    }),
  );
  return res.data.data;
}

// Update hatch record
export async function updateFishHatch(id, payload, options = {}) {
  const res = await api.put(
    `/fish-hatch/${id}`,
    payload,
    buildOfflineMutationConfig({
      resource: "fish-hatch",
      action: "update",
      baseRecord: options.baseRecord,
      context: options.context,
    }),
  );
  return res.data.data;
}

// Soft-delete hatch record
export async function deleteFishHatch(id) {
  const res = await api.delete(`/fish-hatch/${id}`);
  return res.data.data;
}

// Permanently delete hatch record
export async function permanentDeleteFishHatch(id) {
  const res = await api.delete(`/fish-hatch/${id}/permanent`);
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

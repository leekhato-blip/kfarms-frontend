import api from "../api/apiClient";
import { buildOfflineMutationConfig } from "../offline/offlineStore";
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
export async function createFishPond(payload, options = {}) {
  const res = await api.post(
    "/fishpond",
    payload,
    buildOfflineMutationConfig({
      resource: "fishpond",
      action: "create",
      context: options.context,
    }),
  );
  return res.data.data;
}

// Update pond by ID
export async function updateFishPond(id, payload, options = {}) {
  const res = await api.put(
    `/fishpond/${id}`,
    payload,
    buildOfflineMutationConfig({
      resource: "fishpond",
      action: "update",
      baseRecord: options.baseRecord,
      context: options.context,
    }),
  );
  return res.data.data;
}

// Soft-delete pond
export async function deleteFishPond(id) {
  const res = await api.delete(`/fishpond/${id}`);
  return res.data.data;
}

// Permanently delete pond
export async function permanentDeleteFishPond(id) {
  const res = await api.delete(`/fishpond/${id}/permanent`);
  return res.data.data;
}

// Fetch deleted ponds (trash)
export async function getDeletedFishPonds(params = {}) {
  const { page = 0, size = 10 } = params;
  const res = await api.get("/fishpond", {
    params: { page, size, deleted: true },
  });
  return res.data.data;
}

// Restore pond
export async function restoreFishPond(id) {
  const res = await api.put(`/fishpond/${id}/restore`);
  return res.data.data;
}

// Adjust stock
export async function adjustFishPondStock(id, payload, options = {}) {
  // payload: { quantity: number, reason: string }
  const normalizedPayload = {
    ...payload,
    quantityChange: payload?.quantityChange ?? payload?.quantity,
  };
  const res = await api.post(
    `/fishpond/${id}/adjust-stock`,
    normalizedPayload,
    buildOfflineMutationConfig({
      resource: "fishpond",
      action: "adjust",
      baseRecord: options.baseRecord,
      context: options.context,
    }),
  );
  return res.data.data;
}

import api from "../api/apiClient";
import { buildOfflineMutationConfig } from "../offline/offlineStore";

export async function getAllInventory({
  page = 0,
  size = 10,
  itemName,
  category,
  status,
  lastUpdated,
  deleted = false,
} = {}) {
  const params = {
    page,
    size,
    ...(itemName && { itemName }),
    ...(category && { category }),
    ...(status && { status }),
    ...(lastUpdated && { lastUpdated }),
    ...(deleted ? { deleted: true } : {}),
  };

  const res = await api.get("/inventory", { params });
  return res.data.data;
}

export async function getInventoryById(id) {
  const res = await api.get(`/inventory/${id}`);
  return res.data.data;
}

export async function createInventory(payload, options = {}) {
  const res = await api.post(
    "/inventory",
    payload,
    buildOfflineMutationConfig({
      resource: "inventory",
      action: "create",
      context: options.context,
    }),
  );
  return res.data.data;
}

export async function updateInventory(id, payload, options = {}) {
  const res = await api.put(
    `/inventory/${id}`,
    payload,
    buildOfflineMutationConfig({
      resource: "inventory",
      action: "update",
      baseRecord: options.baseRecord,
      context: options.context,
    }),
  );
  return res.data.data;
}

export async function deleteInventory(id) {
  const res = await api.delete(`/inventory/${id}`);
  return res.data.success;
}

export async function restoreInventory(id) {
  const res = await api.put(`/inventory/${id}/restore`);
  return res.data.success;
}

export async function permanentDeleteInventory(id) {
  const res = await api.delete(`/inventory/${id}/permanent`);
  return res.data.success;
}

export async function adjustInventoryStock(id, payload, options = {}) {
  const res = await api.post(
    `/inventory/${id}/adjust`,
    payload,
    buildOfflineMutationConfig({
      resource: "inventory",
      action: "adjust",
      baseRecord: options.baseRecord,
      context: options.context,
    }),
  );
  return res.data.data;
}

export async function getDeletedInventory({ page = 0, size = 10 } = {}) {
  return getAllInventory({ page, size, deleted: true });
}

export async function getInventorySummary() {
  const res = await api.get("/inventory/summary");
  return res.data.data;
}

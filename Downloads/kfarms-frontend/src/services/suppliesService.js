import api from "./axios";

/**
 * Fetch all supplies with pagination & filters
 * Backend: GET /api/supplies
 */
export async function getAllSupplies({
  page = 0,
  size = 10,
  itemName,
  category,
  date,
} = {}) {
  const params = {
    page,
    size,
    ...(itemName && { itemName }),
    ...(category && { category }),
    ...(date && { date }),
  };

  const res = await api.get("/supplies", { params });
  return res.data.data;
}

export async function getSupplyById(id) {
  const res = await api.get(`/supplies/${id}`);
  return res.data.data;
}

export async function createSupply(payload) {
  const res = await api.post("/supplies", payload);
  return res.data.data;
}

export async function updateSupply(id, payload) {
  const res = await api.put(`/supplies/${id}`, payload);
  return res.data.data;
}

/**
 * Soft delete (move to trash)
 * Backend: DELETE /api/supplies/{id}
 */
export async function deleteSupply(id) {
  const res = await api.delete(`/supplies/${id}`);
  return res.data.success;
}

/**
 * Restore from trash
 * Backend: PUT /api/supplies/{id}/restore
 */
export async function restoreSupply(id) {
  const res = await api.put(`/supplies/${id}/restore`);
  return res.data.success;
}

/**
 * Fetch deleted supplies (trash)
 * Backend: GET /api/supplies/deleted
 */
export async function getDeletedSupplies(params = {}) {
  console.log("getDeletedSupplies params =", {
    page: params.page ?? 0,
    size: params.size ?? 10,
  });

  const res = await api.get("/supplies", {
    params: { page: params.page ?? 0, size: params.size ?? 10, deleted: true },
  });

  console.log("getDeletedSupplies totalItems =", res.data?.data?.totalItems);
  return res.data.data;
}

/**
 * Permanent delete from trash
 * Backend: DELETE /api/supplies/{id}/permanent
 */
export async function permanentDeleteSupply(id) {
  const res = await api.delete(`/supplies/${id}/permanent`);
  return res.data.success;
}

/**
 * Fetch supplies summary
 * Backend: GET /api/supplies/summary
 */
export async function getSuppliesSummary() {
  const res = await api.get("/supplies/summary");
  return res.data.data;
}

import api from "./axios";

/**
 * Fetch all sales records with pagination & filters
 * Backend: GET /api/sales
 * Params: page, size, itemName?, category?, date?
 */
export async function getAllSales({
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

  const res = await api.get("/sales", { params });
  return res.data.data;
}

/**
 * Fetch single sales record by ID
 * Backend: GET /api/sales/{id}
 */
export async function getSaleById(id) {
  const res = await api.get(`/sales/${id}`);
  return res.data.data;
}

/**
 * Create a new sales record
 * Backend: POST /api/sales
 * Body: SalesRequestDto
 */
export async function createSale(payload) {
  const res = await api.post("/sales", payload);
  return res.data.data;
}

/**
 * Update an existing sales record
 * Backend: PUT /api/sales/{id}
 * Body: SalesRequestDto
 */
export async function updateSale(id, payload) {
  const res = await api.put(`/sales/${id}`, payload);
  return res.data.data;
}

/**
 * Delete a sales record (soft delete)
 * Backend: DELETE /api/sales/{id}
 */
export async function deleteSale(id) {
  const res = await api.delete(`/sales/${id}`);
  return res.data.success;
}

/**
 * Permanently delete a sales record
 * Backend: DELETE /api/sales/{id}/permanent
 */
export async function permanentDeleteSale(id) {
  const res = await api.delete(`/sales/${id}/permanent`);
  return res.data.success;
}

/**
 * Restore a deleted sales record
 * Backend: PUT /api/sales/{id}/restore
 */
export async function restoreSale(id) {
  const res = await api.put(`/sales/${id}/restore`);
  return res.data.success;
}

/**
 * Fetch sales summary (cards, dashboard stats)
 * Backend: GET /api/sales/summary
 */
export async function getSalesSummary() {
  const res = await api.get("/sales/summary");
  return res.data.data;
}

/**
 * Fetch deleted sales records (trash) with pagination
 * Backend: GET /api/sales?deleted=true
 */
export async function getDeletedSales(params = {}) {
  console.log("getDeletedSales params =", {
    page: params.page ?? 0,
    size: params.size ?? 10,
    deleted: true,
  });

  const res = await api.get("/sales", {
    params: { page: params.page ?? 0, size: params.size ?? 10, deleted: true },
  });

  console.log("getDeletedSales totalItems =", res.data?.data?.totalItems);
  return res.data.data;
}

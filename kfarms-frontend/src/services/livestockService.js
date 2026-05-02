import api from "../api/apiClient";
import { buildOfflineMutationConfig } from "../offline/offlineStore";

function buildTenantRequestConfig(tenantId, config = {}) {
  if (!tenantId) {
    return config;
  }

  return {
    ...config,
    headers: {
      ...(config.headers || {}),
      "X-Tenant-Id": String(tenantId),
    },
  };
}

// Get livestock with filters + pagination
export async function getLivestock(params = {}) {
  const { page = 0, size = 10, batchName, type, arrivalDate, tenantId } = params;

  const res = await api.get(
    "/livestock",
    buildTenantRequestConfig(tenantId, {
      params: {
        page,
        size,
        batchName: batchName || undefined,
        type: type || undefined,
        arrivalDate: arrivalDate || undefined, // YYYY-MM-DD
      },
    }),
  );

  return res.data.data;
}

export async function getLivestockById(id, { tenantId } = {}) {
  const res = await api.get(
    `/livestock/${id}`,
    buildTenantRequestConfig(tenantId),
  );
  return res.data.data;
}

// Get livestock summary
export async function getLivestockSummary({ tenantId } = {}) {
  const res = await api.get("/livestock/summary", buildTenantRequestConfig(tenantId));
  return res.data.data;
}

// Get livestock overview
export async function getLivestockOverview({ tenantId } = {}) {
  const res = await api.get("/livestock/overview", buildTenantRequestConfig(tenantId));
  return res.data.data;
}

// Create livestock batch
export async function createLivestock(payload, options = {}) {
  const res = await api.post(
    "/livestock",
    payload,
    buildOfflineMutationConfig({
      resource: "livestock",
      action: "create",
      context: options.context,
    }),
  );
  return res.data.data;
}

// Update livestock batch
export async function updateLivestock(id, payload, options = {}) {
  const res = await api.put(
    `/livestock/${id}`,
    payload,
    buildOfflineMutationConfig({
      resource: "livestock",
      action: "update",
      baseRecord: options.baseRecord,
      context: options.context,
    }),
  );
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

export async function recordLivestockMortality(id, payload, options = {}) {
  const res = await api.post(
    `/livestock/${id}/mortality`,
    payload,
    buildOfflineMutationConfig({
      resource: "livestock",
      action: "mortality",
      baseRecord: options.baseRecord,
      context: options.context,
    }),
  );
  return res.data.data;
}

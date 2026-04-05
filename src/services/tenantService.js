import apiClient from "../api/apiClient";
<<<<<<< HEAD
import { FARM_MODULES, normalizeFarmModuleId } from "../tenant/tenantModules";

function normalizeTenantCreationModules(modules) {
  if (!Array.isArray(modules)) return [];

  const selectedModules = [];
  const seen = new Set();

  modules.forEach((moduleId) => {
    const normalized = normalizeFarmModuleId(moduleId);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    selectedModules.push(normalized);
  });

  return selectedModules;
}

export function buildTenantModulePayload(modules) {
  const selectedModules = normalizeTenantCreationModules(modules);
=======
import { FARM_MODULES, normalizeEnabledModules } from "../tenant/tenantModules";

export function buildTenantModulePayload(modules) {
  const selectedModules = normalizeEnabledModules(modules);
>>>>>>> 0babf4d (Update frontend application)
  return {
    poultryEnabled: selectedModules.includes(FARM_MODULES.POULTRY),
    fishEnabled: selectedModules.includes(FARM_MODULES.FISH_FARMING),
  };
}

export async function createTenant({ name, slug, modules }) {
  const response = await apiClient.post("/tenants", {
    name,
    slug,
    ...buildTenantModulePayload(modules),
  });
  return response.data?.data ?? response.data;
}

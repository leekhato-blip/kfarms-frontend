import apiClient from "../api/apiClient";
import { FARM_MODULES, normalizeEnabledModules } from "../tenant/tenantModules";

export function buildTenantModulePayload(modules) {
  const selectedModules = normalizeEnabledModules(modules);
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

import { describe, expect, it } from "vitest";
import { FARM_MODULES } from "../tenant/tenantModules";
import { buildTenantModulePayload } from "./tenantService";

describe("buildTenantModulePayload", () => {
  it("keeps an empty module selection empty instead of expanding to both modules", () => {
    expect(buildTenantModulePayload([])).toEqual({
      poultryEnabled: false,
      fishEnabled: false,
    });
  });

  it("maps selected poultry and fish modules into explicit boolean flags", () => {
    expect(buildTenantModulePayload([FARM_MODULES.POULTRY, FARM_MODULES.FISH_FARMING])).toEqual({
      poultryEnabled: true,
      fishEnabled: true,
    });
  });
});

import { describe, expect, it } from "vitest";
import { FARM_MODULES } from "../tenant/tenantModules";
import { detectFeedModule } from "./feedChart";

describe("detectFeedModule", () => {
  it("detects fish feed labels", () => {
    expect(detectFeedModule("Floating Feed 4mm")).toBe(FARM_MODULES.FISH_FARMING);
    expect(detectFeedModule("Fish Feed 2mm")).toBe(FARM_MODULES.FISH_FARMING);
  });

  it("detects poultry feed labels", () => {
    expect(detectFeedModule("Layer Mash")).toBe(FARM_MODULES.POULTRY);
    expect(detectFeedModule("Broiler Finisher")).toBe(FARM_MODULES.POULTRY);
  });
});

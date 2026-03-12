import { describe, expect, it } from "vitest";
import { normalizeSearchResult, resolveSearchTarget } from "./searchUtils";

describe("searchUtils", () => {
  it("normalizes legacy backend routes to valid workspace pages", () => {
    expect(resolveSearchTarget({ url: "/fish-hatches/12" })).toBe("/fish-ponds");
    expect(resolveSearchTarget({ url: "/health-events/7" })).toBe("/dashboard");
  });

  it("keeps feed, inventory, and supply results separated", () => {
    expect(resolveSearchTarget({ title: "Starter feed", subtitle: "Feed" })).toBe("/feeds");
    expect(resolveSearchTarget({ title: "Brooder heater", subtitle: "Inventory" })).toBe(
      "/inventory",
    );
    expect(resolveSearchTarget({ title: "Vaccine", subtitle: "Supply" })).toBe("/supplies");
  });

  it("writes the resolved target back onto normalized search results", () => {
    expect(normalizeSearchResult({ id: 1, title: "Layers", subtitle: "Poultry" })).toMatchObject({
      target: "/poultry",
      url: "/poultry",
    });
  });
});

import { describe, expect, it } from "vitest";
<<<<<<< HEAD
import { KFARMS_ROUTE_REGISTRY } from "../apps/kfarms/paths";
=======
>>>>>>> 0babf4d (Update frontend application)
import { normalizeSearchResult, resolveSearchTarget } from "./searchUtils";

describe("searchUtils", () => {
  it("normalizes legacy backend routes to valid workspace pages", () => {
<<<<<<< HEAD
    expect(resolveSearchTarget({ url: "/fish-hatches/12" })).toBe(KFARMS_ROUTE_REGISTRY.fishPonds.appPath);
    expect(resolveSearchTarget({ url: "/health-events/7" })).toBe(KFARMS_ROUTE_REGISTRY.dashboard.appPath);
  });

  it("keeps feed, inventory, and supply results separated", () => {
    expect(resolveSearchTarget({ title: "Starter feed", subtitle: "Feed" })).toBe(KFARMS_ROUTE_REGISTRY.feeds.appPath);
    expect(resolveSearchTarget({ title: "Brooder heater", subtitle: "Inventory" })).toBe(
      KFARMS_ROUTE_REGISTRY.inventory.appPath,
    );
    expect(resolveSearchTarget({ title: "Vaccine", subtitle: "Supply" })).toBe(KFARMS_ROUTE_REGISTRY.supplies.appPath);
=======
    expect(resolveSearchTarget({ url: "/fish-hatches/12" })).toBe("/fish-ponds");
    expect(resolveSearchTarget({ url: "/health-events/7" })).toBe("/dashboard");
  });

  it("keeps feed, inventory, and supply results separated", () => {
    expect(resolveSearchTarget({ title: "Starter feed", subtitle: "Feed" })).toBe("/feeds");
    expect(resolveSearchTarget({ title: "Brooder heater", subtitle: "Inventory" })).toBe(
      "/inventory",
    );
    expect(resolveSearchTarget({ title: "Vaccine", subtitle: "Supply" })).toBe("/supplies");
>>>>>>> 0babf4d (Update frontend application)
  });

  it("writes the resolved target back onto normalized search results", () => {
    expect(normalizeSearchResult({ id: 1, title: "Layers", subtitle: "Poultry" })).toMatchObject({
<<<<<<< HEAD
      target: KFARMS_ROUTE_REGISTRY.poultry.appPath,
      url: KFARMS_ROUTE_REGISTRY.poultry.appPath,
=======
      target: "/poultry",
      url: "/poultry",
>>>>>>> 0babf4d (Update frontend application)
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  KFARMS_BASE_PATH,
  KFARMS_DEFAULT_APP_PATH,
  KFARMS_ROUTE_REGISTRY,
  normalizeKfarmsLegacyPath,
  toKfarmsAppPath,
  toKfarmsLegacyPath,
} from "./paths";

describe("kfarms paths", () => {
  it("maps legacy workspace routes into the app namespace", () => {
    expect(toKfarmsAppPath("/dashboard")).toBe(KFARMS_ROUTE_REGISTRY.dashboard.appPath);
    expect(toKfarmsAppPath("/billing")).toBe(KFARMS_ROUTE_REGISTRY.billing.appPath);
  });

  it("keeps app paths stable when already namespaced", () => {
    expect(toKfarmsAppPath(KFARMS_ROUTE_REGISTRY.inventory.appPath)).toBe(
      KFARMS_ROUTE_REGISTRY.inventory.appPath,
    );
    expect(toKfarmsAppPath(KFARMS_BASE_PATH)).toBe(KFARMS_DEFAULT_APP_PATH);
  });

  it("normalizes aliases back to canonical legacy workspace routes", () => {
    expect(normalizeKfarmsLegacyPath("/livestock")).toBe(KFARMS_ROUTE_REGISTRY.poultry.legacyPath);
    expect(normalizeKfarmsLegacyPath(KFARMS_ROUTE_REGISTRY.feeds.appPath)).toBe(
      KFARMS_ROUTE_REGISTRY.feeds.legacyPath,
    );
  });

  it("can convert namespaced routes back to legacy workspace paths", () => {
    expect(toKfarmsLegacyPath(KFARMS_ROUTE_REGISTRY.search.appPath)).toBe(
      KFARMS_ROUTE_REGISTRY.search.legacyPath,
    );
  });
});

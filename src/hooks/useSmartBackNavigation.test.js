import { describe, expect, it } from "vitest";
import { hasInAppHistory, isHiddenPath } from "./useSmartBackNavigation";

describe("useSmartBackNavigation helpers", () => {
  it("detects when the current path should hide the back button", () => {
    expect(isHiddenPath("/dashboard", ["/dashboard"])).toBe(true);
    expect(isHiddenPath("/dashboard/", ["/dashboard"])).toBe(true);
    expect(isHiddenPath("/sales", ["/dashboard"])).toBe(false);
  });

  it("detects in-app history from the router history index", () => {
    expect(hasInAppHistory({ idx: 2 })).toBe(true);
    expect(hasInAppHistory({ idx: 0 })).toBe(false);
    expect(hasInAppHistory({})).toBe(false);
    expect(hasInAppHistory(null)).toBe(false);
  });
});

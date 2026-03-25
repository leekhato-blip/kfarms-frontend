import { describe, expect, it } from "vitest";
import { isPlatformPathname } from "./apiClient";

describe("apiClient workspace auth guards", () => {
  it("recognizes platform routes so workspace auth does not hijack them", () => {
    expect(isPlatformPathname("/platform")).toBe(true);
    expect(isPlatformPathname("/platform/login")).toBe(true);
    expect(isPlatformPathname("/platform/users")).toBe(true);
    expect(isPlatformPathname("/auth/login")).toBe(false);
    expect(isPlatformPathname("/dashboard")).toBe(false);
  });
});

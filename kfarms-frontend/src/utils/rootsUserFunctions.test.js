import { describe, expect, it } from "vitest";
import {
  ROOTS_FUNCTION_OPTIONS,
  assignRootsFunction,
  getRootsFunctionLabel,
  getRootsUserFunctionKey,
  inferRootsFunction,
  normalizeRootsFunction,
  resolveRootsFunction,
} from "./rootsUserFunctions";

describe("rootsUserFunctions", () => {
  it("normalizes only supported ROOTS functions", () => {
    expect(normalizeRootsFunction("ops")).toBe("OPS");
    expect(normalizeRootsFunction("support")).toBe("SUPPORT");
    expect(normalizeRootsFunction("logistics")).toBe("OPS");
    expect(normalizeRootsFunction("unknown")).toBe("");
  });

  it("infers ROOTS function from seeded usernames and emails", () => {
    expect(inferRootsFunction({ username: "roots.ops" })).toBe("OPS");
    expect(inferRootsFunction({ email: "success@demo.kfarms.local" })).toBe("SUCCESS");
    expect(inferRootsFunction({ email: "analyst@demo.kfarms.local" })).toBe("ANALYST");
    expect(inferRootsFunction({ email: "onboarding@demo.kfarms.local" })).toBe("SUCCESS");
    expect(inferRootsFunction({ username: "roots.logistics" })).toBe("OPS");
  });

  it("prefers saved assignments over inferred defaults", () => {
    const user = { id: 21, username: "roots.support" };
    const saved = assignRootsFunction(user, "COMPLIANCE", {});

    expect(resolveRootsFunction(user, saved)).toBe("COMPLIANCE");
  });

  it("falls back to username when building a storage key", () => {
    expect(
      getRootsUserFunctionKey({
        email: "",
        username: "roots.ops",
      }),
    ).toBe("roots.ops");
  });

  it("exposes user-facing labels for supported ROOTS functions", () => {
    expect(getRootsFunctionLabel("LOGISTICS")).toBe("Ops");
    expect(getRootsFunctionLabel("")).toBe("Unassigned");
  });

  it("keeps the options list ready for a focused top-seven selector", () => {
    expect(ROOTS_FUNCTION_OPTIONS).toHaveLength(7);
    expect(ROOTS_FUNCTION_OPTIONS.map((option) => option.value)).toContain("FINANCE");
    expect(ROOTS_FUNCTION_OPTIONS.map((option) => option.value)).not.toContain("ONBOARDING");
    expect(ROOTS_FUNCTION_OPTIONS.map((option) => option.value)).not.toContain("LOGISTICS");
  });
});

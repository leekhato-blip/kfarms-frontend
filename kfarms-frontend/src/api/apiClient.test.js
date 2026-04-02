import { describe, expect, it } from "vitest";
import {
  clearWorkspaceToken,
  getWorkspaceToken,
  isBackendUnavailableError,
  isBackendUnavailableResponse,
  isPlatformPathname,
  setWorkspaceToken,
  workspaceTokenStorageKey,
} from "./apiClient";

describe("apiClient workspace auth guards", () => {
  it("recognizes platform routes so workspace auth does not hijack them", () => {
    expect(isPlatformPathname("/platform")).toBe(true);
    expect(isPlatformPathname("/platform/login")).toBe(true);
    expect(isPlatformPathname("/platform/users")).toBe(true);
    expect(isPlatformPathname("/auth/login")).toBe(false);
    expect(isPlatformPathname("/dashboard")).toBe(false);
  });

  it("treats Render no-server and gateway failures as backend unavailable", () => {
    expect(
      isBackendUnavailableResponse({
        status: 503,
        headers: {},
      }),
    ).toBe(true);

    expect(
      isBackendUnavailableResponse({
        status: 405,
        headers: {
          "x-render-routing": "no-server",
        },
      }),
    ).toBe(true);

    expect(
      isBackendUnavailableResponse({
        status: 405,
        headers: {},
      }),
    ).toBe(false);
  });

  it("treats true network and gateway failures as backend unavailable errors", () => {
    expect(
      isBackendUnavailableError({
        code: "ECONNABORTED",
        message: "timeout of 15000ms exceeded",
      }),
    ).toBe(false);

    expect(
      isBackendUnavailableError({
        code: "ERR_NETWORK",
        message: "Network Error",
      }),
    ).toBe(true);

    expect(
      isBackendUnavailableError({
        response: {
          status: 503,
          headers: {},
        },
      }),
    ).toBe(true);

    expect(
      isBackendUnavailableError({
        response: {
          status: 404,
          headers: {
            "x-render-routing": "no-server",
          },
        },
        message: "Request failed with status code 404",
      }),
    ).toBe(true);

    expect(
      isBackendUnavailableError({
        response: {
          status: 401,
          headers: {},
        },
        message: "Request failed with status code 401",
      }),
    ).toBe(false);
  });

  it("stores workspace auth state in its own dedicated token key", () => {
    const storage = new Map();
    const originalWindow = globalThis.window;

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: (key) => storage.get(key) ?? null,
          setItem: (key, value) => storage.set(key, String(value)),
          removeItem: (key) => storage.delete(key),
        },
      },
    });

    try {
      setWorkspaceToken("workspace-token");
      expect(storage.get(workspaceTokenStorageKey)).toBe("workspace-token");
      expect(getWorkspaceToken()).toBe("workspace-token");

      clearWorkspaceToken();
      expect(storage.has(workspaceTokenStorageKey)).toBe(false);
      expect(getWorkspaceToken()).toBe("");
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow,
      });
    }
  });
});

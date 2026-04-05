import { describe, expect, it } from "vitest";
import { getDefaultApiBaseUrl, resolveApiBaseUrl } from "./apiBaseUrl";

describe("apiBaseUrl", () => {
  it("uses the explicit environment base URL when provided", () => {
    expect(resolveApiBaseUrl("https://api.example.com/api/")).toBe("https://api.example.com/api");
  });

  it("falls back to the local backend during localhost development", () => {
    expect(getDefaultApiBaseUrl({ location: { hostname: "localhost" } })).toBe(
      "http://localhost:8080/api",
    );
  });

  it("uses the local Vite proxy during localhost dev on supported Vite ports", () => {
    expect(getDefaultApiBaseUrl({ location: { hostname: "localhost", port: "5173" } })).toBe(
      "/api",
    );
    expect(getDefaultApiBaseUrl({ location: { hostname: "localhost", port: "5174" } })).toBe(
      "/api",
    );
  });

  it("falls back to a same-origin api path outside localhost", () => {
    expect(resolveApiBaseUrl("", { location: { hostname: "app.example.com" } })).toBe("/api");
  });
});

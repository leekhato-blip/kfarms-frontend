import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.fn();

vi.mock("../api/apiClient", () => ({
  default: {
    get: apiGet,
  },
}));

describe("reportService", () => {
  beforeEach(() => {
    apiGet.mockReset();
  });

  it("normalizes export aliases before calling the backend", async () => {
    apiGet.mockResolvedValue({
      data: new Blob(["ok"]),
      headers: {
        "content-disposition": 'attachment; filename="ponds.pdf"',
        "content-type": "application/pdf",
      },
    });

    const { exportReport } = await import("./reportService");
    const result = await exportReport({ type: "PDF", category: "fish-ponds" });

    expect(apiGet).toHaveBeenCalledWith("/reports/export", {
      params: {
        type: "pdf",
        category: "fish",
        start: undefined,
        end: undefined,
      },
      responseType: "blob",
      offline: {
        skipCache: true,
        skipQueue: true,
      },
    });
    expect(result.filename).toBe("ponds.pdf");
  });

  it("falls back to a normalized filename when headers are missing", async () => {
    apiGet.mockResolvedValue({
      data: new Blob(["ok"]),
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });

    const { exportReport } = await import("./reportService");
    const result = await exportReport({ type: "xlsx", category: "productions" });

    expect(result.filename).toBe("eggs.xlsx");
  });

  it("rejects unexpected non-blob export payloads", async () => {
    apiGet.mockResolvedValue({
      data: { broken: true },
      headers: {
        "content-type": "application/pdf",
      },
    });

    const { exportReport } = await import("./reportService");

    await expect(exportReport({ type: "pdf", category: "supplies" })).rejects.toThrow(
      "Unexpected export response. Please try again.",
    );
  });

  it("rejects unexpected content types for pdf exports", async () => {
    apiGet.mockResolvedValue({
      data: new Blob(['{"message":"Export failed"}'], {
        type: "application/json",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const { exportReport } = await import("./reportService");

    await expect(exportReport({ type: "pdf", category: "supplies" })).rejects.toThrow(
      "Export failed",
    );
  });

  it("returns normalized preview metadata for aliased categories and types", async () => {
    const { getExportCategoryMeta, getExportTypeMeta } = await import("./reportService");

    expect(getExportCategoryMeta("fish-ponds")).toMatchObject({
      label: "Fish Ponds",
    });
    expect(getExportCategoryMeta("fish-ponds").fields).toContain("Current Stock");
    expect(getExportTypeMeta("excel")).toMatchObject({
      label: "XLSX",
    });
  });
});

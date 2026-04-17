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
    });
    expect(result.filename).toBe("ponds.pdf");
  });

  it("falls back to a normalized filename when headers are missing", async () => {
    apiGet.mockResolvedValue({
      data: new Blob(["ok"]),
      headers: {},
    });

    const { exportReport } = await import("./reportService");
    const result = await exportReport({ type: "xlsx", category: "productions" });

    expect(result.filename).toBe("eggs.xlsx");
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

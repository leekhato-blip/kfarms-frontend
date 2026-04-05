import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiGet } = vi.hoisted(() => ({
  apiGet: vi.fn(),
}));

vi.mock("../api/apiClient", () => ({
  default: {
    get: apiGet,
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { getEggSummary } from "./eggProductionService";

describe("eggProductionService", () => {
  beforeEach(() => {
    apiGet.mockReset();
  });

  it("backfills historical monthly production when summary data only contains one year", async () => {
    apiGet
      .mockResolvedValueOnce({
        data: {
          data: {
            monthlyProduction: {
              "2026-01": 120,
              "2026-02": 140,
            },
            totalRecords: 48,
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            items: [
              { collectionDate: "2026-01-15", goodEggs: 999 },
              { collectionDate: "2025-12-28", goodEggs: 80 },
            ],
            hasNext: true,
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            items: [
              { collectionDate: "2025-11-08", goodEggs: 95 },
              { collectionDate: "2024-03-11", goodEggs: 60 },
            ],
            hasNext: false,
          },
        },
      });

    const result = await getEggSummary();

    expect(apiGet).toHaveBeenNthCalledWith(1, "/eggs/summary");
    expect(apiGet).toHaveBeenNthCalledWith(2, "/eggs", {
      params: {
        page: 0,
        size: 200,
        livestockId: undefined,
        collectionDate: undefined,
        deleted: undefined,
      },
    });
    expect(apiGet).toHaveBeenNthCalledWith(3, "/eggs", {
      params: {
        page: 1,
        size: 200,
        livestockId: undefined,
        collectionDate: undefined,
        deleted: undefined,
      },
    });
    expect(result.monthlyProduction).toEqual({
      "2024-03": 60,
      "2025-11": 95,
      "2025-12": 80,
      "2026-01": 120,
      "2026-02": 140,
    });
  });

  it("keeps the summary response untouched when it already includes multiple years", async () => {
    apiGet.mockResolvedValueOnce({
      data: {
        data: {
          monthlyProduction: {
            "2026-02": 140,
            "2025-12": 90,
          },
        },
      },
    });

    const result = await getEggSummary();

    expect(apiGet).toHaveBeenCalledTimes(1);
    expect(result.monthlyProduction).toEqual({
      "2026-02": 140,
      "2025-12": 90,
    });
  });
});

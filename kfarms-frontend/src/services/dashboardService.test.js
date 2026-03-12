import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiGet, getAllInventoryMock, hasDemoAccountHintMock } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  getAllInventoryMock: vi.fn(),
  hasDemoAccountHintMock: vi.fn(),
}));

vi.mock("../api/apiClient", () => ({
  default: {
    get: apiGet,
  },
}));

vi.mock("./inventoryService", () => ({
  getAllInventory: getAllInventoryMock,
}));

vi.mock("../auth/demoMode", () => ({
  hasDemoAccountHint: hasDemoAccountHintMock,
}));

describe("dashboardService", () => {
  beforeEach(() => {
    apiGet.mockReset();
    getAllInventoryMock.mockReset();
    hasDemoAccountHintMock.mockReset();
    hasDemoAccountHintMock.mockReturnValue(false);
  });

  it("enriches dashboard production history when the summary only returns one year", async () => {
    apiGet
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            monthlyProduction: {
              "2026-03": 3180,
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            items: [{ collectionDate: "2025-12-14", goodEggs: 1440 }],
            hasNext: false,
          },
        },
      });

    const { getDashboardSummary } = await import("./dashboardService");
    const result = await getDashboardSummary();

    expect(apiGet).toHaveBeenNthCalledWith(1, "/dashboard/summary");
    expect(apiGet).toHaveBeenNthCalledWith(2, "/eggs", {
      params: {
        page: 0,
        size: 200,
        livestockId: undefined,
        collectionDate: undefined,
        deleted: undefined,
      },
    });
    expect(result.data.monthlyProduction).toEqual({
      "2025-12": 1440,
      "2026-03": 3180,
    });
  });

  it("builds the feed watchlist from inventory summary low-stock items", async () => {
    apiGet.mockResolvedValue({
      data: {
        data: {
          lowStockItems: [
            {
              id: 1,
              itemName: "Starter Mash",
              category: "FEED",
              quantity: 0,
              threshold: 40,
              unit: "kg",
            },
            {
              id: 2,
              itemName: "Fish Feed 2mm",
              category: "FEED",
              quantity: 18,
              threshold: 20,
              unit: "kg",
            },
            {
              id: 3,
              itemName: "Vaccine",
              category: "MEDICINE",
              quantity: 1,
              threshold: 5,
              unit: "vials",
            },
            {
              id: 4,
              itemName: "Layer Mash",
              category: "FEED",
              quantity: 5,
              threshold: 25,
              unit: "kg",
            },
          ],
        },
      },
    });

    const { getFeedWatchlist } = await import("./dashboardService");
    const result = await getFeedWatchlist();

    expect(apiGet).toHaveBeenCalledWith("/inventory/summary");
    expect(getAllInventoryMock).not.toHaveBeenCalled();
    expect(result.map((item) => item.id)).toEqual([1, 4, 2]);
    expect(result.every((item) => item.category === "FEED")).toBe(true);
  });

  it("fills the demo watchlist with near-threshold and seeded feed items", async () => {
    hasDemoAccountHintMock.mockReturnValue(true);
    apiGet.mockResolvedValueOnce({
      data: {
        data: {
          lowStockItems: [],
        },
      },
    });
    getAllInventoryMock.mockResolvedValueOnce({
      items: [
        {
          id: 11,
          itemName: "Broiler Finisher",
          category: "FEED",
          quantity: 13,
          minThreshold: 10,
          unit: "bags",
        },
      ],
    });

    const { getFeedWatchlist } = await import("./dashboardService");
    const result = await getFeedWatchlist();

    expect(apiGet).toHaveBeenCalledWith("/inventory/summary");
    expect(getAllInventoryMock).toHaveBeenCalledWith({
      page: 0,
      size: 40,
      category: "FEED",
    });
    expect(result).toHaveLength(4);
    expect(result.some((item) => item.id === 11)).toBe(true);
    expect(result.filter((item) => item.readOnly)).toHaveLength(3);
  });
});

import { describe, expect, it } from "vitest";
import {
  getInventoryStatusKey,
  getRecommendedRestockQuantity,
  sortInventoryRestockPriority,
} from "./inventoryStock";

describe("inventoryStock helpers", () => {
  it("recommends enough stock to clear the reorder level with a small buffer", () => {
    expect(getRecommendedRestockQuantity({ quantity: 18, threshold: 20 })).toBe(4);
    expect(getRecommendedRestockQuantity({ quantity: 0, threshold: 40 })).toBe(44);
  });

  it("sorts out-of-stock items ahead of low-stock items", () => {
    const items = [
      { id: 1, itemName: "Layer Mash", quantity: 5, threshold: 25 },
      { id: 2, itemName: "Fish Feed", quantity: 0, threshold: 40 },
      { id: 3, itemName: "Broiler Finisher", quantity: 18, threshold: 20 },
    ];

    expect([...items].sort(sortInventoryRestockPriority).map((item) => item.id)).toEqual([2, 1, 3]);
    expect(getInventoryStatusKey(items[0])).toBe("low");
    expect(getInventoryStatusKey(items[1])).toBe("out");
  });
});

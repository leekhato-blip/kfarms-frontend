import { describe, expect, it } from "vitest";
import { mergeLivePlatformPortfolio } from "./platformWorkbench";

describe("platformWorkbench", () => {
  it("keeps the known live portfolio apps in the catalog order", () => {
    const portfolio = mergeLivePlatformPortfolio({
      apps: [
        {
          id: "clinic-live",
          name: "Clinic / Hospital Management",
          lifecycle: "PLANNED",
          sortOrder: 1,
        },
        {
          id: "school-live",
          name: "School Management System",
          lifecycle: "PLANNED",
          sortOrder: 2,
        },
        {
          id: "kfarms-live",
          name: "KFarms",
          lifecycle: "LIVE",
          sortOrder: 999,
        },
        {
          id: "property-live",
          name: "Property / Rent Management",
          lifecycle: "PLANNED",
          sortOrder: 3,
        },
      ],
    });

    expect(portfolio.apps.slice(0, 4).map((app) => app.name)).toEqual([
      "KFarms",
      "Property / Rent Management",
      "School Management System",
      "Clinic / Hospital Management",
    ]);

    expect(portfolio.apps.slice(0, 4).map((app) => app.sortOrder)).toEqual([10, 20, 30, 40]);
  });
});

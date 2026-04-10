import { describe, expect, it } from "vitest";
import { KFARMS_ROUTE_REGISTRY } from "../apps/kfarms/paths";
  });

  it("writes the resolved target back onto normalized search results", () => {
    expect(normalizeSearchResult({ id: 1, title: "Layers", subtitle: "Poultry" })).toMatchObject({
      target: KFARMS_ROUTE_REGISTRY.poultry.appPath,
      url: KFARMS_ROUTE_REGISTRY.poultry.appPath,
    });
  });
});

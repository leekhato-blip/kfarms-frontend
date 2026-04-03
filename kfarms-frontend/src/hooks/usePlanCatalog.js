import React from "react";
import { PLAN_TIER_CONFIG } from "../constants/plans";
import {
  PLATFORM_CONTROL_SETTINGS_CHANGED_EVENT,
  PLATFORM_CONTROL_SETTINGS_KEY,
} from "../constants/platformControlSettings";
import { getDisplayPlanCatalog } from "../utils/planPricing";

export function usePlanCatalog() {
  const [plans, setPlans] = React.useState(() =>
    getDisplayPlanCatalog(PLAN_TIER_CONFIG),
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncPlans = () => {
      setPlans(getDisplayPlanCatalog(PLAN_TIER_CONFIG));
    };

    const handleStorage = (event) => {
      if (!event.key || event.key === PLATFORM_CONTROL_SETTINGS_KEY) {
        syncPlans();
      }
    };

    syncPlans();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(
      PLATFORM_CONTROL_SETTINGS_CHANGED_EVENT,
      syncPlans,
    );

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        PLATFORM_CONTROL_SETTINGS_CHANGED_EVENT,
        syncPlans,
      );
    };
  }, []);

  return plans;
}

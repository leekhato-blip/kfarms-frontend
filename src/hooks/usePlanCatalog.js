import React from "react";
import { PLAN_TIER_CONFIG } from "../constants/plans";
import { getDisplayPlanCatalog } from "../utils/planPricing";
import {
  getPlatformControlSettingsSnapshot,
  readPlatformControlSettingsFromSnapshot,
  subscribePlatformControlSettings,
} from "../utils/platformControlStore";

export function usePlanCatalog() {
  const [settingsSnapshot, setSettingsSnapshot] = React.useState(() =>
    getPlatformControlSettingsSnapshot(),
  );

  React.useEffect(() => {
    const syncSnapshot = () => {
      const nextSnapshot = getPlatformControlSettingsSnapshot();
      setSettingsSnapshot((currentSnapshot) =>
        currentSnapshot === nextSnapshot ? currentSnapshot : nextSnapshot,
      );
    };

    syncSnapshot();
    return subscribePlatformControlSettings(syncSnapshot);
  }, []);

  return React.useMemo(
    () =>
      getDisplayPlanCatalog(
        PLAN_TIER_CONFIG,
        readPlatformControlSettingsFromSnapshot(settingsSnapshot),
      ),
    [settingsSnapshot],
  );
}

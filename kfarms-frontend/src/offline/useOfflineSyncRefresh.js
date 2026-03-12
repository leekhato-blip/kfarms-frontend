import React from "react";

export function useOfflineSyncRefresh(refreshCallback) {
  React.useEffect(() => {
    if (typeof window === "undefined" || typeof refreshCallback !== "function") {
      return undefined;
    }

    const handleSyncComplete = () => {
      void refreshCallback();
    };

    window.addEventListener("kf-offline-sync-complete", handleSyncComplete);
    return () => {
      window.removeEventListener("kf-offline-sync-complete", handleSyncComplete);
    };
  }, [refreshCallback]);
}

import React from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import {
  getBackendConnectionSnapshot,
  probeBackendConnection,
} from "../api/apiClient";
import {
  getOfflineQueueSnapshot,
  getOfflineSyncSnapshot,
} from "../offline/offlineStore";

const AUTO_PROBE_INTERVAL_MS = 5000;
const RECOVERY_HIDE_DELAY_MS = 6000;

export default function BackendRecoveryPrompt() {
  const [backendDown, setBackendDown] = React.useState(
    () => getBackendConnectionSnapshot().backendDown,
  );
  const [browserOffline, setBrowserOffline] = React.useState(
    () => typeof window !== "undefined" && !window.navigator.onLine,
  );
  const [showRecovered, setShowRecovered] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [probingConnection, setProbingConnection] = React.useState(false);
  const [queueSnapshot, setQueueSnapshot] = React.useState(() => getOfflineQueueSnapshot());
  const [syncSnapshot, setSyncSnapshot] = React.useState(() => getOfflineSyncSnapshot());
  const hideRecoveredTimerRef = React.useRef(null);
  const probingConnectionRef = React.useRef(false);

  const clearRecoveredTimer = React.useCallback(() => {
    if (!hideRecoveredTimerRef.current) return;
    clearTimeout(hideRecoveredTimerRef.current);
    hideRecoveredTimerRef.current = null;
  }, []);

  const showRecoveredBanner = React.useCallback(() => {
    clearRecoveredTimer();
    setShowRecovered(true);
    setDismissed(false);
    hideRecoveredTimerRef.current = setTimeout(() => {
      setShowRecovered(false);
    }, RECOVERY_HIDE_DELAY_MS);
  }, [clearRecoveredTimer]);

  const queuedChanges = Number(queueSnapshot.total || 0);
  const failedChanges = Number(queueSnapshot.failed || 0);
  const syncingChanges = syncSnapshot.status === "syncing";
  const pausedSync = syncSnapshot.status === "paused";
  const hasConnectionIssue = browserOffline || backendDown || pausedSync;
  const shouldShowQueuePrompt = !hasConnectionIssue && queuedChanges > 0;
  const onLoginPage =
    typeof window !== "undefined" && window.location.pathname === "/auth/login";

  const requestBackendProbe = React.useCallback(async ({
    triggerSync = false,
    bypassBrowserCheck = false,
  } = {}) => {
    if (typeof window === "undefined" || probingConnectionRef.current) return false;

    probingConnectionRef.current = true;
    setProbingConnection(true);
    try {
      const reachable = await probeBackendConnection({
        bypassBrowserCheck,
      });
      if (reachable) {
        setBrowserOffline(false);
        setBackendDown(false);
        if (hasConnectionIssue) {
          showRecoveredBanner();
        }
      }
      if (reachable && triggerSync) {
        window.dispatchEvent(new Event("kf-offline-sync-requested"));
      }
      return reachable;
    } finally {
      probingConnectionRef.current = false;
      setProbingConnection(false);
    }
  }, [hasConnectionIssue, showRecoveredBanner]);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleDown = () => {
      clearRecoveredTimer();
      setShowRecovered(false);
      setBackendDown(true);
      setDismissed(false);
    };

    const handleUp = () => {
      setBrowserOffline(false);
      setBackendDown(false);
      showRecoveredBanner();
    };

    const handleBrowserOffline = () => {
      clearRecoveredTimer();
      setShowRecovered(false);
      setBrowserOffline(true);
      setDismissed(false);
    };
    const handleBrowserOnline = () => {
      setBrowserOffline(false);
      void requestBackendProbe({
        triggerSync: true,
        bypassBrowserCheck: true,
      });
    };
    const handleQueueUpdated = (event) => {
      setQueueSnapshot(event?.detail || getOfflineQueueSnapshot());
    };
    const handleSyncUpdated = (event) => {
      setSyncSnapshot(event?.detail || getOfflineSyncSnapshot());
    };

    window.addEventListener("kf-backend-down", handleDown);
    window.addEventListener("kf-backend-up", handleUp);
    window.addEventListener("online", handleBrowserOnline);
    window.addEventListener("offline", handleBrowserOffline);
    window.addEventListener("kf-offline-queue-updated", handleQueueUpdated);
    window.addEventListener("kf-offline-sync-state", handleSyncUpdated);

    if (!window.navigator.onLine) {
      setBrowserOffline(true);
      setShowRecovered(false);
      setDismissed(false);
    }

    return () => {
      clearRecoveredTimer();
      window.removeEventListener("kf-backend-down", handleDown);
      window.removeEventListener("kf-backend-up", handleUp);
      window.removeEventListener("online", handleBrowserOnline);
      window.removeEventListener("offline", handleBrowserOffline);
      window.removeEventListener("kf-offline-queue-updated", handleQueueUpdated);
      window.removeEventListener("kf-offline-sync-state", handleSyncUpdated);
    };
  }, [clearRecoveredTimer, requestBackendProbe, showRecoveredBanner]);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (!hasConnectionIssue) return undefined;

    const timer = window.setInterval(() => {
      void requestBackendProbe({
        triggerSync: true,
        bypassBrowserCheck: true,
      });
    }, AUTO_PROBE_INTERVAL_MS);

    void requestBackendProbe({
      triggerSync: true,
      bypassBrowserCheck: true,
    });

    return () => {
      window.clearInterval(timer);
    };
  }, [hasConnectionIssue, requestBackendProbe]);

  if ((!hasConnectionIssue && !showRecovered && !shouldShowQueuePrompt) || dismissed) return null;

  const title = browserOffline
    ? "No internet connection"
    : backendDown || pausedSync
      ? "Connection interrupted"
    : syncingChanges
      ? "Syncing saved changes"
      : failedChanges > 0
        ? "Some changes need attention"
        : queuedChanges > 0
          ? "Saved changes are waiting"
          : "Connection restored";

  const description = browserOffline
    ? queuedChanges > 0
      ? `${queuedChanges} change${queuedChanges === 1 ? "" : "s"} ${queuedChanges === 1 ? "is" : "are"} saved locally. Keep working and we will sync automatically when the server is back.`
      : "Your internet connection looks unavailable right now. We will keep checking automatically and reconnect as soon as it returns."
    : backendDown || pausedSync
      ? queuedChanges > 0
        ? `${queuedChanges} saved change${queuedChanges === 1 ? "" : "s"} ${queuedChanges === 1 ? "is" : "are"} waiting while we reconnect to the server.`
        : onLoginPage
          ? "We cannot reach the server right now. Free hosting may take about 2-3 minutes to wake up, and we will keep checking automatically."
          : "We cannot reach the server right now. We will try again automatically."
    : syncingChanges
      ? `Syncing ${Math.max(Number(syncSnapshot.total || 0) - Number(syncSnapshot.remaining || 0), 0)} of ${Number(syncSnapshot.total || 0)} saved change${Number(syncSnapshot.total || 0) === 1 ? "" : "s"}.`
      : failedChanges > 0
        ? `${failedChanges} saved change${failedChanges === 1 ? "" : "s"} could not sync yet. You can try again now.`
        : queuedChanges > 0
          ? `${queuedChanges} saved change${queuedChanges === 1 ? "" : "s"} ${queuedChanges === 1 ? "is" : "are"} queued and ready to sync.`
          : "Service is back online. We are syncing and refreshing automatically.";

  return (
    <div className="fixed inset-x-4 top-4 z-[12000] mx-auto max-w-md">
      <div
        className={`rounded-2xl border px-4 py-3 shadow-neo dark:shadow-dark ${
          hasConnectionIssue
            ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/50 dark:bg-amber-950 dark:text-amber-100"
            : failedChanges > 0
              ? "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-500/40 dark:bg-rose-950 dark:text-rose-100"
            : "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-950 dark:text-emerald-100"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full ${
              hasConnectionIssue
                ? "bg-amber-200 text-amber-700 dark:bg-amber-700/30 dark:text-amber-200"
                : failedChanges > 0
                  ? "bg-rose-200 text-rose-700 dark:bg-rose-700/30 dark:text-rose-200"
                : "bg-emerald-200 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-200"
            }`}
          >
            {hasConnectionIssue || failedChanges > 0 ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" strokeWidth={3} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold font-header">{title}</div>
            <div className="mt-1 text-xs leading-relaxed opacity-90">
              {description}
            </div>
            {(hasConnectionIssue || shouldShowQueuePrompt || failedChanges > 0) && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={probingConnection || syncingChanges}
                  className="rounded-md border border-current/30 bg-transparent px-3 py-1.5 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={async () => {
                    if (hasConnectionIssue) {
                      await requestBackendProbe({
                        triggerSync: true,
                        bypassBrowserCheck: true,
                      });
                      return;
                    }

                    window.dispatchEvent(new Event("kf-offline-sync-requested"));
                  }}
                >
                  {probingConnection
                    ? "Checking..."
                    : hasConnectionIssue
                      ? "Retry"
                      : syncingChanges
                        ? "Syncing..."
                        : "Sync now"}
                </button>
                {queuedChanges > 0 ? (
                  <span className="inline-flex items-center rounded-full border border-current/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">
                    {queuedChanges} queued
                  </span>
                ) : null}
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label="Dismiss message"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

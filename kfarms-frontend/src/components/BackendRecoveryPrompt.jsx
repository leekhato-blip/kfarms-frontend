import React from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { probeBackendConnection } from "../api/apiClient";
import {
  getOfflineQueueSnapshot,
  getOfflineSyncSnapshot,
} from "../offline/offlineStore";

export default function BackendRecoveryPrompt() {
  const [backendDown, setBackendDown] = React.useState(false);
  const [browserOffline, setBrowserOffline] = React.useState(
    () => typeof window !== "undefined" && !window.navigator.onLine,
  );
  const [showRecovered, setShowRecovered] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [probingConnection, setProbingConnection] = React.useState(false);
  const [queueSnapshot, setQueueSnapshot] = React.useState(() => getOfflineQueueSnapshot());
  const [syncSnapshot, setSyncSnapshot] = React.useState(() => getOfflineSyncSnapshot());
  const hideRecoveredTimerRef = React.useRef(null);

  const requestBackendProbe = React.useCallback(async ({ triggerSync = false } = {}) => {
    if (typeof window === "undefined") return false;

    setProbingConnection(true);
    try {
      const reachable = await probeBackendConnection();
      if (reachable && triggerSync) {
        window.dispatchEvent(new Event("kf-offline-sync-requested"));
      }
      return reachable;
    } finally {
      setProbingConnection(false);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const clearRecoveredTimer = () => {
      if (!hideRecoveredTimerRef.current) return;
      clearTimeout(hideRecoveredTimerRef.current);
      hideRecoveredTimerRef.current = null;
    };

    const handleDown = () => {
      clearRecoveredTimer();
      setShowRecovered(false);
      setBackendDown(true);
      setDismissed(false);
    };

    const handleUp = () => {
      clearRecoveredTimer();
      setBackendDown(false);
      setShowRecovered(true);
      setDismissed(false);
      hideRecoveredTimerRef.current = setTimeout(() => {
        setShowRecovered(false);
      }, 6000);
    };

    const handleBrowserOffline = () => {
      setBrowserOffline(true);
      handleDown();
    };
    const handleBrowserOnline = () => {
      setBrowserOffline(false);
      void requestBackendProbe();
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
      handleDown();
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
  }, [requestBackendProbe]);

  const queuedChanges = Number(queueSnapshot.total || 0);
  const failedChanges = Number(queueSnapshot.failed || 0);
  const syncingChanges = syncSnapshot.status === "syncing";
  const pausedSync = syncSnapshot.status === "paused";
  const hasConnectionIssue = browserOffline || backendDown || pausedSync;
  const shouldShowQueuePrompt = !hasConnectionIssue && queuedChanges > 0;
  const onLoginPage =
    typeof window !== "undefined" && window.location.pathname === "/auth/login";

  if ((!hasConnectionIssue && !showRecovered && !shouldShowQueuePrompt) || dismissed) return null;

  const title = browserOffline
    ? "Working offline"
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
      : "You can still review cached data and save basic work locally until the server is back."
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
          : "You’re back online. Data should refresh automatically.";

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
              <CheckCircle2 className="h-4 w-4" />
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
                    if (browserOffline) {
                      window.location.reload();
                      return;
                    }

                    if (hasConnectionIssue) {
                      await requestBackendProbe({ triggerSync: true });
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

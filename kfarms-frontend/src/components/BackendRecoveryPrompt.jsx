import React from "react";
import {
  AlertTriangle,
  Check,
  LoaderCircle,
  RefreshCw,
  WifiOff,
  X,
} from "lucide-react";
import {
  getBackendConnectionSnapshot,
  probeBackendConnection,
} from "../api/apiClient";
import {
  getOfflineQueueSnapshot,
  getOfflineSyncSnapshot,
} from "../offline/offlineStore";

const AUTO_PROBE_INTERVAL_MS = 5000;
const RECOVERY_HIDE_DELAY_MS = 3200;

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
  const hasConnectionIssue = browserOffline || backendDown;
  const shouldShowQueuedStatus = !hasConnectionIssue && queuedChanges > 0;
  const shouldShowFailedStatus = !hasConnectionIssue && failedChanges > 0;
  const shouldShowSyncingStatus = !hasConnectionIssue && syncingChanges;
  const shouldShowPausedStatus = !hasConnectionIssue && pausedSync && queuedChanges > 0;
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
        const recoveredFromIssue = browserOffline || backendDown;
        setBrowserOffline(false);
        setBackendDown(false);
        if (recoveredFromIssue) {
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
  }, [backendDown, browserOffline, showRecoveredBanner]);

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

  if (
    (
      !hasConnectionIssue &&
      !showRecovered &&
      !shouldShowQueuedStatus &&
      !shouldShowFailedStatus &&
      !shouldShowSyncingStatus &&
      !shouldShowPausedStatus
    ) ||
    dismissed
  ) {
    return null;
  }

  const processedChanges = Math.max(
    Number(syncSnapshot.total || 0) - Number(syncSnapshot.remaining || 0),
    0,
  );

  const status = browserOffline
    ? {
        label: "Offline",
        detail:
          queuedChanges > 0
            ? `${queuedChanges} saved ${queuedChanges === 1 ? "change is" : "changes are"} waiting`
            : "Waiting for internet",
        tone: "border-amber-300/75 bg-amber-50/95 text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/80 dark:text-amber-100",
        iconTone: "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
        Icon: WifiOff,
        actionLabel: "",
      }
    : backendDown
      ? {
          label: onLoginPage ? "Server waking up" : "Server unreachable",
          detail:
            queuedChanges > 0
              ? `${queuedChanges} saved ${queuedChanges === 1 ? "change is" : "changes are"} queued`
              : "Reconnecting in the background",
          tone: "border-sky-300/70 bg-sky-50/95 text-sky-950 dark:border-sky-500/40 dark:bg-sky-950/80 dark:text-sky-100",
          iconTone: "bg-sky-500/15 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
          Icon: LoaderCircle,
          actionLabel: "Retry",
        }
      : shouldShowFailedStatus
        ? {
            label: "Sync needs attention",
            detail: `${failedChanges} ${failedChanges === 1 ? "change" : "changes"} failed to sync`,
            tone: "border-rose-300/75 bg-rose-50/95 text-rose-950 dark:border-rose-500/40 dark:bg-rose-950/80 dark:text-rose-100",
            iconTone: "bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
            Icon: AlertTriangle,
            actionLabel: "Sync",
          }
        : shouldShowSyncingStatus
          ? {
              label: "Syncing",
              detail: `${processedChanges}/${Number(syncSnapshot.total || 0)} saved changes`,
              tone: "border-indigo-300/75 bg-indigo-50/95 text-indigo-950 dark:border-indigo-500/40 dark:bg-indigo-950/80 dark:text-indigo-100",
              iconTone: "bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200",
              Icon: LoaderCircle,
              actionLabel: "",
            }
          : shouldShowPausedStatus || shouldShowQueuedStatus
            ? {
                label: shouldShowPausedStatus ? "Saved changes waiting" : "Ready to sync",
                detail: `${queuedChanges} ${queuedChanges === 1 ? "change" : "changes"} queued locally`,
                tone: "border-slate-300/80 bg-white/95 text-slate-900 dark:border-white/12 dark:bg-[#07111f]/88 dark:text-slate-100",
                iconTone: "bg-slate-500/10 text-slate-700 dark:bg-white/10 dark:text-slate-200",
                Icon: RefreshCw,
                actionLabel: "Sync",
              }
            : {
                label: "Back online",
                detail: "Live sync restored",
                tone: "border-emerald-300/75 bg-emerald-50/95 text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-950/80 dark:text-emerald-100",
                iconTone: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
                Icon: Check,
                actionLabel: "",
              };

  const StatusIcon = status.Icon;
  const iconClassName = `h-3.5 w-3.5 ${
    status.label === "Syncing" || status.label === "Server waking up"
      ? "animate-spin"
      : ""
  }`;
  const showActionButton = Boolean(status.actionLabel) && !browserOffline;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[12000] flex justify-center px-3 sm:top-4">
      <div
        className={`pointer-events-auto inline-flex max-w-[min(92vw,28rem)] items-center gap-2.5 rounded-full border px-3 py-2 shadow-[0_18px_35px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:shadow-[0_18px_40px_rgba(0,0,0,0.34)] ${status.tone}`}
      >
        <span
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${status.iconTone}`}
        >
          <StatusIcon className={iconClassName} strokeWidth={2.3} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[0.76rem] font-semibold uppercase tracking-[0.16em] opacity-80">
            {status.label}
          </div>
          <div className="truncate text-sm font-medium">{status.detail}</div>
        </div>

        {showActionButton ? (
          <button
            type="button"
            disabled={probingConnection || syncingChanges}
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-current/15 px-3 text-xs font-semibold transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-white/10"
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
            {probingConnection ? "Checking" : status.actionLabel}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            setShowRecovered(false);
          }}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-current/70 transition hover:bg-black/5 hover:text-current dark:hover:bg-white/10"
          aria-label="Dismiss connection message"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

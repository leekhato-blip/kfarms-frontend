import React from "react";
import {
  AlertTriangle,
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

const AUTO_PROBE_INTERVAL_MS = 8000;
const BACKEND_DOWN_DEBOUNCE_MS = 4200;
const BACKEND_RECOVERY_CONFIRM_MS = 3200;
const RECOVERY_SETTLE_MS = 2800;

export default function BackendRecoveryPrompt() {
  const [backendDown, setBackendDown] = React.useState(
    () => getBackendConnectionSnapshot().backendDown,
  );
  const [browserOffline, setBrowserOffline] = React.useState(
    () => typeof window !== "undefined" && !window.navigator.onLine,
  );
  const [dismissed, setDismissed] = React.useState(false);
  const [probingConnection, setProbingConnection] = React.useState(false);
  const [queueSnapshot, setQueueSnapshot] = React.useState(() => getOfflineQueueSnapshot());
  const [syncSnapshot, setSyncSnapshot] = React.useState(() => getOfflineSyncSnapshot());
  const [suppressSettledStatuses, setSuppressSettledStatuses] = React.useState(false);
  const backendDownTimerRef = React.useRef(null);
  const backendRecoveryTimerRef = React.useRef(null);
  const recoveryTimerRef = React.useRef(null);
  const probingConnectionRef = React.useRef(false);
  const backendDownRef = React.useRef(backendDown);
  const browserOfflineRef = React.useRef(browserOffline);
  const previousConnectionIssueRef = React.useRef(backendDown || browserOffline);

  React.useEffect(() => {
    backendDownRef.current = backendDown;
  }, [backendDown]);

  React.useEffect(() => {
    browserOfflineRef.current = browserOffline;
  }, [browserOffline]);

  const clearBackendDownTimer = React.useCallback(() => {
    if (!backendDownTimerRef.current) return;
    clearTimeout(backendDownTimerRef.current);
    backendDownTimerRef.current = null;
  }, []);

  const clearRecoveryTimer = React.useCallback(() => {
    if (!recoveryTimerRef.current) return;
    clearTimeout(recoveryTimerRef.current);
    recoveryTimerRef.current = null;
  }, []);

  const clearBackendRecoveryTimer = React.useCallback(() => {
    if (!backendRecoveryTimerRef.current) return;
    clearTimeout(backendRecoveryTimerRef.current);
    backendRecoveryTimerRef.current = null;
  }, []);

  const scheduleBackendRecovery = React.useCallback(() => {
    clearBackendRecoveryTimer();
    backendRecoveryTimerRef.current = window.setTimeout(() => {
      setBrowserOffline(false);
      setBackendDown(false);
      backendRecoveryTimerRef.current = null;
    }, BACKEND_RECOVERY_CONFIRM_MS);
  }, [clearBackendRecoveryTimer]);

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
        clearBackendDownTimer();
        scheduleBackendRecovery();
      }

      if (reachable && triggerSync) {
        window.dispatchEvent(new Event("kf-offline-sync-requested"));
      }

      return reachable;
    } finally {
      probingConnectionRef.current = false;
      setProbingConnection(false);
    }
  }, [clearBackendDownTimer, scheduleBackendRecovery]);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleDown = () => {
      setDismissed(false);
      clearBackendRecoveryTimer();
      if (
        browserOfflineRef.current ||
        backendDownRef.current ||
        backendDownTimerRef.current
      ) {
        return;
      }

      backendDownTimerRef.current = window.setTimeout(async () => {
        backendDownTimerRef.current = null;
        const reachable = await requestBackendProbe({
          bypassBrowserCheck: true,
        });

        if (!reachable && !browserOfflineRef.current) {
          setBackendDown(true);
        }
      }, BACKEND_DOWN_DEBOUNCE_MS);
    };

    const handleUp = () => {
      clearBackendDownTimer();
      scheduleBackendRecovery();
    };

    const handleBrowserOffline = () => {
      clearBackendDownTimer();
      clearBackendRecoveryTimer();
      setBrowserOffline(true);
      setBackendDown(false);
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
      clearBackendDownTimer();
      setBrowserOffline(true);
      setDismissed(false);
    }

    return () => {
      clearBackendDownTimer();
      clearBackendRecoveryTimer();
      clearRecoveryTimer();
      window.removeEventListener("kf-backend-down", handleDown);
      window.removeEventListener("kf-backend-up", handleUp);
      window.removeEventListener("online", handleBrowserOnline);
      window.removeEventListener("offline", handleBrowserOffline);
      window.removeEventListener("kf-offline-queue-updated", handleQueueUpdated);
      window.removeEventListener("kf-offline-sync-state", handleSyncUpdated);
    };
  }, [
    clearBackendDownTimer,
    clearBackendRecoveryTimer,
    clearRecoveryTimer,
    requestBackendProbe,
    scheduleBackendRecovery,
  ]);

  const queuedChanges = Number(queueSnapshot.total || 0);
  const failedChanges = Number(queueSnapshot.failed || 0);
  const syncingChanges = syncSnapshot.status === "syncing";
  const pausedSync = syncSnapshot.status === "paused";
  const hasConnectionIssue = browserOffline || backendDown;

  React.useEffect(() => {
    const previousConnectionIssue = previousConnectionIssueRef.current;
    previousConnectionIssueRef.current = hasConnectionIssue;

    if (hasConnectionIssue) {
      clearRecoveryTimer();
      clearBackendRecoveryTimer();
      setSuppressSettledStatuses(false);
      return;
    }

    if (previousConnectionIssue) {
      clearRecoveryTimer();
      setSuppressSettledStatuses(true);
      recoveryTimerRef.current = window.setTimeout(() => {
        setSuppressSettledStatuses(false);
        recoveryTimerRef.current = null;
      }, RECOVERY_SETTLE_MS);
    }
  }, [clearBackendRecoveryTimer, clearRecoveryTimer, hasConnectionIssue]);

  const shouldShowQueuedStatus =
    !hasConnectionIssue && !suppressSettledStatuses && queuedChanges > 0;
  const shouldShowFailedStatus = !hasConnectionIssue && failedChanges > 0;
  const shouldShowSyncingStatus =
    !hasConnectionIssue && !suppressSettledStatuses && syncingChanges;
  const shouldShowPausedStatus =
    !hasConnectionIssue &&
    !suppressSettledStatuses &&
    pausedSync &&
    queuedChanges > 0;
  const onLoginPage =
    typeof window !== "undefined" && window.location.pathname === "/auth/login";

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

  const shouldRender =
    hasConnectionIssue ||
    shouldShowQueuedStatus ||
    shouldShowFailedStatus ||
    shouldShowSyncingStatus ||
    shouldShowPausedStatus;

  if (!shouldRender || dismissed) {
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
            ? `${queuedChanges} saved ${queuedChanges === 1 ? "change is" : "changes are"} waiting for internet`
            : "Waiting for internet before syncing again",
        tone:
          "border-amber-300/75 bg-amber-50/95 text-amber-950 ring-1 ring-amber-200/70 dark:border-amber-500/35 dark:bg-[#1d1203]/92 dark:text-amber-100 dark:ring-amber-500/12",
        iconTone:
          "bg-amber-500/15 text-amber-700 dark:bg-amber-400/14 dark:text-amber-200",
        Icon: WifiOff,
        actionLabel: "",
      }
    : backendDown
      ? {
          label: onLoginPage ? "Server waking up" : "Server unreachable",
          detail:
            queuedChanges > 0
              ? `${queuedChanges} saved ${queuedChanges === 1 ? "change is" : "changes are"} queued locally`
              : "Reconnecting in the background",
          tone:
            "border-sky-300/75 bg-sky-50/95 text-sky-950 ring-1 ring-sky-200/70 dark:border-sky-500/35 dark:bg-[#071628]/92 dark:text-sky-100 dark:ring-sky-500/12",
          iconTone:
            "bg-sky-500/15 text-sky-700 dark:bg-sky-400/14 dark:text-sky-200",
          Icon: LoaderCircle,
          actionLabel: "Retry",
        }
      : shouldShowFailedStatus
        ? {
            label: "Sync needs attention",
            detail: `${failedChanges} ${failedChanges === 1 ? "change" : "changes"} failed to sync`,
            tone:
              "border-rose-300/75 bg-rose-50/95 text-rose-950 ring-1 ring-rose-200/70 dark:border-rose-500/35 dark:bg-[#260812]/92 dark:text-rose-100 dark:ring-rose-500/12",
            iconTone:
              "bg-rose-500/15 text-rose-700 dark:bg-rose-400/14 dark:text-rose-200",
            Icon: AlertTriangle,
            actionLabel: "Sync",
          }
        : shouldShowSyncingStatus
          ? {
              label: "Syncing",
              detail: `${processedChanges}/${Number(syncSnapshot.total || 0)} saved changes`,
              tone:
                "border-indigo-300/75 bg-indigo-50/95 text-indigo-950 ring-1 ring-indigo-200/70 dark:border-indigo-500/35 dark:bg-[#0d1431]/92 dark:text-indigo-100 dark:ring-indigo-500/12",
              iconTone:
                "bg-indigo-500/15 text-indigo-700 dark:bg-indigo-400/14 dark:text-indigo-200",
              Icon: LoaderCircle,
              actionLabel: "",
            }
          : {
              label: shouldShowPausedStatus ? "Saved changes waiting" : "Ready to sync",
              detail: `${queuedChanges} ${queuedChanges === 1 ? "change" : "changes"} queued locally`,
              tone:
                "border-slate-300/80 bg-slate-50/92 text-slate-900 ring-1 ring-slate-200/80 dark:border-white/12 dark:bg-[#0b1322]/94 dark:text-slate-100 dark:ring-white/10",
              iconTone:
                "bg-slate-500/10 text-slate-700 dark:bg-white/10 dark:text-slate-200",
              Icon: RefreshCw,
              actionLabel: "Sync",
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
        className={`pointer-events-auto inline-flex max-w-[min(94vw,30rem)] items-center gap-2.5 rounded-full border px-3 py-2 shadow-[0_18px_35px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:shadow-[0_18px_40px_rgba(0,0,0,0.34)] ${status.tone}`}
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
          <div className="text-sm font-medium leading-5">{status.detail}</div>
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

import React from "react";
<<<<<<< HEAD
import {
  AlertTriangle,
  CheckCheck,
  LoaderCircle,
  RefreshCw,
  WifiOff,
  X,
} from "lucide-react";
import {
  getWorkspaceToken,
  getBackendConnectionSnapshot,
  probeBackendConnection,
} from "../api/apiClient";
=======
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { probeBackendConnection } from "../api/apiClient";
>>>>>>> 0babf4d (Update frontend application)
import {
  getOfflineQueueSnapshot,
  getOfflineSyncSnapshot,
} from "../offline/offlineStore";
<<<<<<< HEAD

const AUTO_PROBE_INTERVAL_MS = 8000;
const BACKEND_DOWN_DEBOUNCE_MS = 4200;
const BACKEND_RECOVERY_CONFIRM_MS = 3200;
const RECOVERY_SETTLE_MS = 2800;
const SYNC_SUCCESS_VISIBLE_MS = 2200;

export default function BackendRecoveryPrompt() {
  const [backendDown, setBackendDown] = React.useState(
    () => getBackendConnectionSnapshot().backendDown,
  );
  const [browserOffline, setBrowserOffline] = React.useState(
    () => typeof window !== "undefined" && !window.navigator.onLine,
  );
  const [isDark, setIsDark] = React.useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );
=======

export default function BackendRecoveryPrompt() {
  const [backendDown, setBackendDown] = React.useState(false);
  const [browserOffline, setBrowserOffline] = React.useState(
    () => typeof window !== "undefined" && !window.navigator.onLine,
  );
  const [showRecovered, setShowRecovered] = React.useState(false);
>>>>>>> 0babf4d (Update frontend application)
  const [dismissed, setDismissed] = React.useState(false);
  const [probingConnection, setProbingConnection] = React.useState(false);
  const [queueSnapshot, setQueueSnapshot] = React.useState(() => getOfflineQueueSnapshot());
  const [syncSnapshot, setSyncSnapshot] = React.useState(() => getOfflineSyncSnapshot());
<<<<<<< HEAD
  const [suppressSettledStatuses, setSuppressSettledStatuses] = React.useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = React.useState(false);
  const backendDownTimerRef = React.useRef(null);
  const backendRecoveryTimerRef = React.useRef(null);
  const recoveryTimerRef = React.useRef(null);
  const syncSuccessTimerRef = React.useRef(null);
  const probingConnectionRef = React.useRef(false);
  const backendDownRef = React.useRef(backendDown);
  const browserOfflineRef = React.useRef(browserOffline);
  const previousConnectionIssueRef = React.useRef(backendDown || browserOffline);
  const previousSyncStatusRef = React.useRef(syncSnapshot.status);

  React.useEffect(() => {
    backendDownRef.current = backendDown;
  }, [backendDown]);

  React.useEffect(() => {
    browserOfflineRef.current = browserOffline;
  }, [browserOffline]);

  React.useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const syncTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

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

  const clearSyncSuccessTimer = React.useCallback(() => {
    if (!syncSuccessTimerRef.current) return;
    clearTimeout(syncSuccessTimerRef.current);
    syncSuccessTimerRef.current = null;
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
=======
  const hideRecoveredTimerRef = React.useRef(null);
>>>>>>> 0babf4d (Update frontend application)

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
<<<<<<< HEAD
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

=======
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
>>>>>>> 0babf4d (Update frontend application)
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
<<<<<<< HEAD
      clearBackendDownTimer();
      setBrowserOffline(true);
      setDismissed(false);
=======
      setBrowserOffline(true);
      handleDown();
>>>>>>> 0babf4d (Update frontend application)
    }

    return () => {
      clearBackendDownTimer();
      clearBackendRecoveryTimer();
      clearRecoveryTimer();
      clearSyncSuccessTimer();
      window.removeEventListener("kf-backend-down", handleDown);
      window.removeEventListener("kf-backend-up", handleUp);
      window.removeEventListener("online", handleBrowserOnline);
      window.removeEventListener("offline", handleBrowserOffline);
      window.removeEventListener("kf-offline-queue-updated", handleQueueUpdated);
      window.removeEventListener("kf-offline-sync-state", handleSyncUpdated);
    };
<<<<<<< HEAD
  }, [
    clearBackendDownTimer,
    clearBackendRecoveryTimer,
    clearRecoveryTimer,
    clearSyncSuccessTimer,
    requestBackendProbe,
    scheduleBackendRecovery,
  ]);

  const hasWorkspaceSession = Boolean(getWorkspaceToken());
=======
  }, [requestBackendProbe]);

>>>>>>> 0babf4d (Update frontend application)
  const queuedChanges = Number(queueSnapshot.total || 0);
  const failedChanges = Number(queueSnapshot.failed || 0);
  const syncingChanges = syncSnapshot.status === "syncing";
  const pausedSync = syncSnapshot.status === "paused";
<<<<<<< HEAD
  const hasConnectionIssue = browserOffline || backendDown;
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const onLoginPage = pathname === "/auth/login";
  const onWorkspaceRoute = pathname.startsWith("/app/");
  const onPlatformRoute = pathname.startsWith("/platform");
  const canShowSyncStatus = hasWorkspaceSession && onWorkspaceRoute;
  const canShowConnectionStatus = onWorkspaceRoute || onLoginPage || onPlatformRoute;

  React.useEffect(() => {
    const previousConnectionIssue = previousConnectionIssueRef.current;
    previousConnectionIssueRef.current = hasConnectionIssue;

    if (hasConnectionIssue) {
      clearRecoveryTimer();
      clearBackendRecoveryTimer();
      clearSyncSuccessTimer();
      setShowSyncSuccess(false);
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
  }, [clearBackendRecoveryTimer, clearRecoveryTimer, clearSyncSuccessTimer, hasConnectionIssue]);

  React.useEffect(() => {
    const previousStatus = previousSyncStatusRef.current;
    previousSyncStatusRef.current = syncSnapshot.status;

    if (!canShowSyncStatus || hasConnectionIssue) {
      clearSyncSuccessTimer();
      setShowSyncSuccess(false);
      return;
    }

    if (
      syncSnapshot.status === "synced" &&
      ["syncing", "paused", "attention"].includes(previousStatus)
    ) {
      clearSyncSuccessTimer();
      setShowSyncSuccess(true);
      syncSuccessTimerRef.current = window.setTimeout(() => {
        setShowSyncSuccess(false);
        syncSuccessTimerRef.current = null;
      }, SYNC_SUCCESS_VISIBLE_MS);
      return;
    }

    if (syncSnapshot.status !== "synced") {
      clearSyncSuccessTimer();
      setShowSyncSuccess(false);
    }
  }, [canShowSyncStatus, clearSyncSuccessTimer, hasConnectionIssue, syncSnapshot.status]);

  const shouldShowQueuedStatus =
    canShowSyncStatus && !hasConnectionIssue && !suppressSettledStatuses && queuedChanges > 0;
  const shouldShowFailedStatus =
    canShowSyncStatus && !hasConnectionIssue && failedChanges > 0;
  const shouldShowSyncingStatus =
    canShowSyncStatus && !hasConnectionIssue && !suppressSettledStatuses && syncingChanges;
  const shouldShowPausedStatus =
    canShowSyncStatus &&
    !hasConnectionIssue &&
    !suppressSettledStatuses &&
    pausedSync &&
    queuedChanges > 0;

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (!hasConnectionIssue) return undefined;
    if (!canShowConnectionStatus) return undefined;

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
  }, [canShowConnectionStatus, hasConnectionIssue, requestBackendProbe]);

  const shouldRender =
    ((hasConnectionIssue && canShowConnectionStatus) ||
    shouldShowQueuedStatus ||
    shouldShowFailedStatus ||
    shouldShowSyncingStatus ||
    shouldShowPausedStatus ||
    showSyncSuccess);

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
        toneLight:
          "border-amber-300/75 bg-amber-50/95 text-amber-950 ring-1 ring-amber-200/70",
        toneDark:
          "border-amber-500/35 bg-[#1d1203]/92 text-amber-100 ring-1 ring-amber-500/12",
        iconToneLight: "bg-amber-500/15 text-amber-700",
        iconToneDark: "bg-amber-400/14 text-amber-200",
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
          toneLight:
            "border-sky-300/75 bg-sky-50/95 text-sky-950 ring-1 ring-sky-200/70",
          toneDark:
            "border-sky-500/35 bg-[#071628]/92 text-sky-100 ring-1 ring-sky-500/12",
          iconToneLight: "bg-sky-500/15 text-sky-700",
          iconToneDark: "bg-sky-400/14 text-sky-200",
          Icon: LoaderCircle,
          actionLabel: "Retry",
        }
      : showSyncSuccess
        ? {
            label: "Synced",
            detail: "All queued changes have been synced successfully",
            toneLight:
              "border-emerald-300/75 bg-emerald-50/95 text-emerald-950 ring-1 ring-emerald-200/70",
            toneDark:
              "border-emerald-500/35 bg-[#082015]/92 text-emerald-100 ring-1 ring-emerald-500/12",
            iconToneLight: "bg-emerald-500/15 text-emerald-700",
            iconToneDark: "bg-emerald-400/14 text-emerald-200",
            Icon: CheckCheck,
            actionLabel: "",
          }
      : shouldShowFailedStatus
        ? {
            label: "Sync needs attention",
            detail: `${failedChanges} ${failedChanges === 1 ? "change" : "changes"} failed to sync`,
            toneLight:
              "border-rose-300/75 bg-rose-50/95 text-rose-950 ring-1 ring-rose-200/70",
            toneDark:
              "border-rose-500/35 bg-[#260812]/92 text-rose-100 ring-1 ring-rose-500/12",
            iconToneLight: "bg-rose-500/15 text-rose-700",
            iconToneDark: "bg-rose-400/14 text-rose-200",
            Icon: AlertTriangle,
            actionLabel: "Sync",
          }
        : shouldShowSyncingStatus
          ? {
              label: "Syncing",
              detail: `${processedChanges}/${Number(syncSnapshot.total || 0)} saved changes`,
              toneLight:
                "border-indigo-300/75 bg-indigo-50/95 text-indigo-950 ring-1 ring-indigo-200/70",
              toneDark:
                "border-indigo-500/35 bg-[#0d1431]/92 text-indigo-100 ring-1 ring-indigo-500/12",
              iconToneLight: "bg-indigo-500/15 text-indigo-700",
              iconToneDark: "bg-indigo-400/14 text-indigo-200",
              Icon: LoaderCircle,
              actionLabel: "",
            }
          : {
              label: shouldShowPausedStatus ? "Saved changes waiting" : "Ready to sync",
              detail: `${queuedChanges} ${queuedChanges === 1 ? "change" : "changes"} queued locally`,
              toneLight:
                "border-slate-300/80 bg-slate-50/92 text-slate-900 ring-1 ring-slate-200/80",
              toneDark:
                "border-white/12 bg-[#0b1322]/94 text-slate-100 ring-1 ring-white/10",
              iconToneLight: "bg-slate-500/10 text-slate-700",
              iconToneDark: "bg-white/10 text-slate-200",
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
=======
  const hasConnectionIssue = browserOffline || backendDown || pausedSync;
  const shouldShowQueuePrompt = !hasConnectionIssue && queuedChanges > 0;

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
        : "We cannot reach the server right now. We will try again automatically."
    : syncingChanges
      ? `Syncing ${Math.max(Number(syncSnapshot.total || 0) - Number(syncSnapshot.remaining || 0), 0)} of ${Number(syncSnapshot.total || 0)} saved change${Number(syncSnapshot.total || 0) === 1 ? "" : "s"}.`
      : failedChanges > 0
        ? `${failedChanges} saved change${failedChanges === 1 ? "" : "s"} could not sync yet. You can try again now.`
        : queuedChanges > 0
          ? `${queuedChanges} saved change${queuedChanges === 1 ? "" : "s"} ${queuedChanges === 1 ? "is" : "are"} queued and ready to sync.`
          : "You’re back online. Data should refresh automatically.";
>>>>>>> 0babf4d (Update frontend application)

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[12000] flex justify-center px-3 sm:top-4">
      <div
<<<<<<< HEAD
        className={`pointer-events-auto inline-flex max-w-[min(94vw,30rem)] items-center gap-2.5 rounded-full border px-3 py-2 shadow-[0_18px_35px_rgba(15,23,42,0.16)] backdrop-blur-xl ${
          isDark
            ? "shadow-[0_18px_40px_rgba(0,0,0,0.34)]"
            : "shadow-[0_18px_35px_rgba(15,23,42,0.16)]"
        } ${isDark ? status.toneDark : status.toneLight}`}
      >
        <span
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isDark ? status.iconToneDark : status.iconToneLight
          }`}
        >
          <StatusIcon className={iconClassName} strokeWidth={2.3} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[0.76rem] font-semibold uppercase tracking-[0.16em] opacity-80">
            {status.label}
=======
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
>>>>>>> 0babf4d (Update frontend application)
          </div>
          <div className="text-sm font-medium leading-5">{status.detail}</div>
        </div>

        {showActionButton ? (
          <button
            type="button"
            disabled={probingConnection || syncingChanges}
            className={`inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-current/15 px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isDark ? "hover:bg-white/10" : "hover:bg-black/5"
            }`}
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
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-current/70 transition hover:text-current ${
            isDark ? "hover:bg-white/10" : "hover:bg-black/5"
          }`}
          aria-label="Dismiss connection message"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

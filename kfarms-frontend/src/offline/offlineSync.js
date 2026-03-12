import apiClient from "../api/apiClient";
import { hasDemoAccountHint } from "../auth/demoMode";
import {
  getOfflineQueueSnapshot,
  listQueuedMutations,
  markQueuedMutationFailed,
  markQueuedMutationQueued,
  markQueuedMutationSyncing,
  removeQueuedMutation,
  setOfflineSyncSnapshot,
} from "./offlineStore";

let initialized = false;
let flushPromise = null;
let autoRetryBlockedUntil = 0;

const AUTO_RETRY_COOLDOWN_MS = 12000;
const REPLAY_REQUEST_TIMEOUT_MS = 10000;

function extractErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Sync failed"
  );
}

function isNetworkFailure(error) {
  return !error?.response;
}

async function replayMutation(mutation) {
  return apiClient.request({
    method: mutation.method,
    url: mutation.path,
    params: mutation.params || undefined,
    data: mutation.payload,
    timeout: REPLAY_REQUEST_TIMEOUT_MS,
    headers: {
      ...(mutation.tenantId ? { "X-Tenant-Id": mutation.tenantId } : {}),
      "X-Client-Request-Id": mutation.requestId,
    },
    offline: {
      skipQueue: true,
    },
  });
}

export async function flushOfflineQueue(options = {}) {
  const source = String(options.source || "system");

  if (flushPromise) return flushPromise;
  if (typeof window !== "undefined" && !window.navigator.onLine) {
    return false;
  }
  if (hasDemoAccountHint()) {
    setOfflineSyncSnapshot({
      status: "idle",
      total: 0,
      remaining: 0,
      failedCount: 0,
      lastSyncedAt: "",
    });
    return false;
  }

  if (
    source !== "manual" &&
    source !== "online" &&
    autoRetryBlockedUntil > Date.now()
  ) {
    return false;
  }

  flushPromise = (async () => {
    const allMutations = listQueuedMutations().filter((item) =>
      item.status === "queued" || item.status === "failed" || item.status === "syncing",
    );

    if (allMutations.length === 0) {
      autoRetryBlockedUntil = 0;
      setOfflineSyncSnapshot({
        status: "idle",
        total: 0,
        remaining: 0,
        failedCount: getOfflineQueueSnapshot().failed,
      });
      return true;
    }

    setOfflineSyncSnapshot({
      status: "syncing",
      total: allMutations.length,
      remaining: allMutations.length,
      failedCount: 0,
    });

    let remaining = allMutations.length;
    let failedCount = 0;

    for (const mutation of allMutations) {
      let pausedForNetworkFailure = false;

      markQueuedMutationSyncing(mutation.requestId);
      try {
        await replayMutation(mutation);
        removeQueuedMutation(mutation.requestId);
      } catch (error) {
        if (isNetworkFailure(error)) {
          pausedForNetworkFailure = true;
          autoRetryBlockedUntil = Date.now() + AUTO_RETRY_COOLDOWN_MS;
          markQueuedMutationQueued(mutation.requestId);
          setOfflineSyncSnapshot({
            status: "paused",
            total: allMutations.length,
            remaining,
            failedCount,
            lastSyncedAt: "",
          });
          return false;
        }

        failedCount += 1;
        markQueuedMutationFailed(mutation.requestId, extractErrorMessage(error));
      } finally {
        if (!pausedForNetworkFailure) {
          remaining = Math.max(remaining - 1, 0);
          setOfflineSyncSnapshot({
            status: remaining === 0 ? (failedCount > 0 ? "attention" : "synced") : "syncing",
            total: allMutations.length,
            remaining,
            failedCount,
            lastSyncedAt: remaining === 0 ? new Date().toISOString() : "",
          });
        }
      }
    }

    autoRetryBlockedUntil = 0;

    window.dispatchEvent(
      new CustomEvent("kf-offline-sync-complete", {
        detail: getOfflineQueueSnapshot(),
      }),
    );

    return failedCount === 0;
  })();

  try {
    return await flushPromise;
  } finally {
    flushPromise = null;
  }
}

export function initializeOfflineSync() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const triggerFlush = (event) => {
    const source =
      event?.type === "kf-offline-sync-requested"
        ? "manual"
        : event?.type === "online"
          ? "online"
          : event?.type === "kf-backend-up"
            ? "backend-up"
            : "system";

    void flushOfflineQueue({ source });
  };

  window.addEventListener("online", triggerFlush);
  window.addEventListener("kf-backend-up", triggerFlush);
  window.addEventListener("kf-offline-sync-requested", triggerFlush);

  if (window.navigator.onLine) {
    void flushOfflineQueue({ source: "startup" });
  }
}

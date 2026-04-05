import {
  applyOfflineMutationToResponse,
  buildOptimisticRecord,
  detectOfflineResource,
} from "./offlineResources";

const ACTIVE_TENANT_STORAGE_KEY = "activeTenantId";
const API_CACHE_STORAGE_KEY = "kf-offline-api-cache-v1";
const MUTATION_QUEUE_STORAGE_KEY = "kf-offline-mutation-queue-v1";
const AUTH_ME_CACHE_SCOPE = "auth-me";
const OFFLINE_QUEUE_EVENT = "kf-offline-queue-updated";
const OFFLINE_SYNC_EVENT = "kf-offline-sync-state";

let syncSnapshot = {
  status: "idle",
  total: 0,
  remaining: 0,
  failedCount: 0,
  lastSyncedAt: "",
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function cloneValue(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function readStorageValue(key, fallback) {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStorageValue(key, value) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function sortObject(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sortObject(item));
  }
  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.keys(value)
    .sort((left, right) => left.localeCompare(right))
    .reduce((acc, key) => {
      const nextValue = value[key];
      if (nextValue === undefined) return acc;
      acc[key] = sortObject(nextValue);
      return acc;
    }, {});
}

function serializeValue(value) {
  return JSON.stringify(sortObject(value ?? {}));
}

function normalizeTenantId(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function resolveTenantScope({ tenantId, path } = {}) {
  if (path === "/api/auth/me") return AUTH_ME_CACHE_SCOPE;

  const directTenantId = normalizeTenantId(tenantId);
  if (directTenantId) return `tenant:${directTenantId}`;

  if (!canUseStorage()) return "public";
  const storedTenantId = normalizeTenantId(window.localStorage.getItem(ACTIVE_TENANT_STORAGE_KEY));
  return storedTenantId ? `tenant:${storedTenantId}` : "public";
}

function buildCacheKey({ tenantId, path, params } = {}) {
  return [resolveTenantScope({ tenantId, path }), String(path || "/"), serializeValue(params)].join("|");
}

function dispatchWindowEvent(name, detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function nowIso() {
  return new Date().toISOString();
}

function createRequestId(resource = "mutation") {
  return `${resource}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function extractTenantIdFromConfig(config) {
  return (
    normalizeTenantId(config?.headers?.["X-Tenant-Id"]) ||
    normalizeTenantId(config?.headers?.["x-tenant-id"]) ||
    normalizeTenantId(config?.offline?.tenantId)
  );
}

function normalizePayload(data) {
  if (!data) return null;
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  return data;
}

function readCacheMap() {
  return readStorageValue(API_CACHE_STORAGE_KEY, {});
}

function writeCacheMap(nextMap) {
  writeStorageValue(API_CACHE_STORAGE_KEY, nextMap);
}

function readMutationQueue() {
  const queue = readStorageValue(MUTATION_QUEUE_STORAGE_KEY, []);
  return Array.isArray(queue) ? queue : [];
}

function writeMutationQueue(nextQueue) {
  writeStorageValue(MUTATION_QUEUE_STORAGE_KEY, nextQueue);
  dispatchWindowEvent(OFFLINE_QUEUE_EVENT, getOfflineQueueSnapshot());
}

function updateMutationQueue(mutator) {
  const current = readMutationQueue();
  const next = mutator(Array.isArray(current) ? current : []);
  writeMutationQueue(next);
  return next;
}

function isQueueVisibleStatus(status) {
  return status === "queued" || status === "syncing" || status === "failed";
}

export function getOfflineQueueSnapshot() {
  const queue = readMutationQueue();
  const queued = queue.filter((item) => item.status === "queued").length;
  const syncing = queue.filter((item) => item.status === "syncing").length;
  const failed = queue.filter((item) => item.status === "failed").length;

  return {
    queued,
    syncing,
    failed,
    total: queue.filter((item) => isQueueVisibleStatus(item.status)).length,
  };
}

export function getOfflineSyncSnapshot() {
  return { ...syncSnapshot };
}

export function setOfflineSyncSnapshot(nextSnapshot = {}) {
  syncSnapshot = {
    ...syncSnapshot,
    ...nextSnapshot,
  };
  dispatchWindowEvent(OFFLINE_SYNC_EVENT, getOfflineSyncSnapshot());
}

export function clearQueuedMutations() {
  writeMutationQueue([]);
  setOfflineSyncSnapshot({
    status: "idle",
    total: 0,
    remaining: 0,
    failedCount: 0,
    lastSyncedAt: "",
  });
}

export function cacheApiResponse({ tenantId, path, params, data } = {}) {
  if (!path || typeof data === "undefined") return;
  const cacheMap = readCacheMap();
  cacheMap[buildCacheKey({ tenantId, path, params })] = {
    cachedAt: nowIso(),
    data,
  };
  writeCacheMap(cacheMap);
}

export function primeCachedApiResponse({ tenantId, path, params, data } = {}) {
  cacheApiResponse({ tenantId, path, params, data });
}

export function clearCachedApiResponse({ tenantId, path, params } = {}) {
  const cacheMap = readCacheMap();
  delete cacheMap[buildCacheKey({ tenantId, path, params })];
  writeCacheMap(cacheMap);
}

export function clearOfflineAuthBootstrap() {
  clearCachedApiResponse({ path: "/api/auth/me" });
}

export function getCachedApiResponse({ tenantId, path, params } = {}) {
  const cacheMap = readCacheMap();
  const cached = cacheMap[buildCacheKey({ tenantId, path, params })];
  if (!cached?.data) return null;

  const nextData = cloneValue(cached.data);
  const queue = readMutationQueue().filter((mutation) => {
    if (!isQueueVisibleStatus(mutation.status)) return false;
    if ((mutation.path || "") !== String(path || "")) {
      const detectedResource = detectOfflineResource(path);
      return Boolean(detectedResource) && detectedResource === mutation.resource;
    }
    return true;
  });

  return queue.reduce((acc, mutation) => {
    return applyOfflineMutationToResponse({
      responseData: acc,
      resource: mutation.resource,
      path,
      mutation,
    });
  }, nextData);
}

export function buildOfflineMutationConfig({ resource, action, baseRecord = null, context = null } = {}) {
  return {
    offline: {
      enabled: true,
      resource,
      action,
      baseRecord,
      context,
    },
  };
}

export function ensureOfflineRequestId(config = {}) {
  config.headers = config.headers || {};
  const currentRequestId =
    config.headers["X-Client-Request-Id"] ||
    config.headers["x-client-request-id"] ||
    config.offline?.requestId;

  if (currentRequestId) {
    config.headers["X-Client-Request-Id"] = currentRequestId;
    if (config.offline) {
      config.offline.requestId = currentRequestId;
    }
    return currentRequestId;
  }

  const nextRequestId = createRequestId(config.offline?.resource || "mutation");
  config.headers["X-Client-Request-Id"] = nextRequestId;
  if (config.offline) {
    config.offline.requestId = nextRequestId;
  }
  return nextRequestId;
}

export function createQueuedAxiosResponse(config = {}, requestPath = "") {
  const offlineConfig = config.offline || {};
  const requestId = ensureOfflineRequestId(config);
  const now = nowIso();
  const payload = normalizePayload(config.data);
  const method = String(config.method || "post").toUpperCase();
  const action =
    offlineConfig.action ||
    (method === "POST" ? "create" : method === "DELETE" ? "delete" : "update");
  const optimisticData = buildOptimisticRecord({
    resource: offlineConfig.resource || detectOfflineResource(requestPath),
    action,
    payload,
    requestId,
    now,
    baseRecord: offlineConfig.baseRecord || null,
    context: offlineConfig.context || null,
    path: requestPath,
  });

  enqueueOfflineMutation({
    requestId,
    method,
    path: requestPath,
    tenantId: extractTenantIdFromConfig(config),
    params: config.params || null,
    payload,
    resource: offlineConfig.resource || detectOfflineResource(requestPath),
    action,
    baseRecord: offlineConfig.baseRecord || null,
    context: offlineConfig.context || null,
    optimisticData,
  });

  return {
    status: 202,
    statusText: "Accepted",
    config,
    headers: {
      "x-offline-queued": "1",
    },
    data: {
      success: true,
      message: "Saved offline. We will sync this change when the connection is back.",
      data: optimisticData,
      meta: {
        offlineQueued: true,
        requestId,
      },
    },
  };
}

export function enqueueOfflineMutation(mutation = {}) {
  const normalizedMutation = {
    id: mutation.requestId,
    requestId: mutation.requestId,
    method: String(mutation.method || "POST").toUpperCase(),
    path: mutation.path || "/",
    tenantId: normalizeTenantId(mutation.tenantId),
    params: mutation.params || null,
    payload: mutation.payload ?? null,
    resource: mutation.resource || detectOfflineResource(mutation.path),
    action: mutation.action || "create",
    baseRecord: mutation.baseRecord || null,
    context: mutation.context || null,
    optimisticData: mutation.optimisticData || null,
    createdAt: mutation.createdAt || nowIso(),
    status: mutation.status || "queued",
    replayCount: mutation.replayCount || 0,
    lastError: mutation.lastError || "",
  };

  updateMutationQueue((currentQueue) => {
    const existingIndex = currentQueue.findIndex(
      (item) =>
        item.requestId === normalizedMutation.requestId &&
        item.method === normalizedMutation.method &&
        item.path === normalizedMutation.path,
    );

    if (existingIndex >= 0) {
      const nextQueue = [...currentQueue];
      nextQueue[existingIndex] = {
        ...nextQueue[existingIndex],
        ...normalizedMutation,
      };
      return nextQueue;
    }

    return [...currentQueue, normalizedMutation];
  });

  return normalizedMutation;
}

export function listQueuedMutations() {
  return readMutationQueue();
}

export function markQueuedMutationSyncing(requestId) {
  updateMutationQueue((currentQueue) =>
    currentQueue.map((item) =>
      item.requestId === requestId
        ? {
            ...item,
            status: "syncing",
            optimisticData: item.optimisticData
              ? {
                  ...item.optimisticData,
                  offlineStatus: "syncing",
                }
              : item.optimisticData,
          }
        : item,
    ),
  );
}

export function markQueuedMutationQueued(requestId) {
  updateMutationQueue((currentQueue) =>
    currentQueue.map((item) =>
      item.requestId === requestId
        ? {
            ...item,
            status: "queued",
            optimisticData: item.optimisticData
              ? {
                  ...item.optimisticData,
                  offlineStatus: "queued",
                }
              : item.optimisticData,
          }
        : item,
    ),
  );
}

export function markQueuedMutationFailed(requestId, lastError = "") {
  updateMutationQueue((currentQueue) =>
    currentQueue.map((item) =>
      item.requestId === requestId
        ? {
            ...item,
            status: "failed",
            replayCount: Number(item.replayCount || 0) + 1,
            lastError,
            optimisticData: item.optimisticData
              ? {
                  ...item.optimisticData,
                  offlineStatus: "needs_attention",
                }
              : item.optimisticData,
          }
        : item,
    ),
  );
}

export function removeQueuedMutation(requestId) {
  updateMutationQueue((currentQueue) =>
    currentQueue.filter((item) => item.requestId !== requestId),
  );
}

export function shouldServeOfflineImmediately(config = {}) {
  if (typeof window === "undefined") return false;
  if (config.offline?.skipQueue) return false;
  return !window.navigator.onLine;
}

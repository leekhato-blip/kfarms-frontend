import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hasDemoAccountHintMock: vi.fn(() => false),
  requestMock: vi.fn(),
<<<<<<< HEAD
  isBackendUnavailableErrorMock: vi.fn((error) => !error?.response),
  getWorkspaceTokenMock: vi.fn(() => "workspace-token"),
=======
>>>>>>> 0babf4d (Update frontend application)
  getOfflineQueueSnapshotMock: vi.fn(() => ({ failed: 0 })),
  listQueuedMutationsMock: vi.fn(),
  markQueuedMutationFailedMock: vi.fn(),
  markQueuedMutationQueuedMock: vi.fn(),
  markQueuedMutationSyncingMock: vi.fn(),
  removeQueuedMutationMock: vi.fn(),
  setOfflineSyncSnapshotMock: vi.fn(),
}));

vi.mock("../api/apiClient", () => ({
  default: {
    request: mocks.requestMock,
  },
<<<<<<< HEAD
  getWorkspaceToken: mocks.getWorkspaceTokenMock,
  isBackendUnavailableError: mocks.isBackendUnavailableErrorMock,
=======
>>>>>>> 0babf4d (Update frontend application)
}));

vi.mock("../auth/demoMode", () => ({
  hasDemoAccountHint: mocks.hasDemoAccountHintMock,
}));

vi.mock("./offlineStore", () => ({
  getOfflineQueueSnapshot: mocks.getOfflineQueueSnapshotMock,
  listQueuedMutations: mocks.listQueuedMutationsMock,
  markQueuedMutationFailed: mocks.markQueuedMutationFailedMock,
  markQueuedMutationQueued: mocks.markQueuedMutationQueuedMock,
  markQueuedMutationSyncing: mocks.markQueuedMutationSyncingMock,
  removeQueuedMutation: mocks.removeQueuedMutationMock,
  setOfflineSyncSnapshot: mocks.setOfflineSyncSnapshotMock,
}));

import { flushOfflineQueue } from "./offlineSync";

describe("offlineSync", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.requestMock.mockReset();
<<<<<<< HEAD
    mocks.isBackendUnavailableErrorMock.mockReset();
    mocks.isBackendUnavailableErrorMock.mockImplementation((error) => !error?.response);
    mocks.getWorkspaceTokenMock.mockReset();
    mocks.getWorkspaceTokenMock.mockReturnValue("workspace-token");
=======
>>>>>>> 0babf4d (Update frontend application)
    mocks.hasDemoAccountHintMock.mockReset();
    mocks.hasDemoAccountHintMock.mockReturnValue(false);
    mocks.getOfflineQueueSnapshotMock.mockReturnValue({ failed: 0 });
    mocks.listQueuedMutationsMock.mockReset();
    mocks.markQueuedMutationFailedMock.mockReset();
    mocks.markQueuedMutationQueuedMock.mockReset();
    mocks.markQueuedMutationSyncingMock.mockReset();
    mocks.removeQueuedMutationMock.mockReset();
    mocks.setOfflineSyncSnapshotMock.mockReset();

    globalThis.window = {
      navigator: { onLine: true },
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    globalThis.CustomEvent = class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    };
  });

<<<<<<< HEAD
  it("retries immediately when the backend comes back after a paused sync", async () => {
=======
  it("keeps paused state on network failure and throttles immediate backend-up retries", async () => {
>>>>>>> 0babf4d (Update frontend application)
    mocks.listQueuedMutationsMock.mockReturnValue([
      {
        requestId: "req-1",
        status: "queued",
        method: "POST",
        path: "/api/tasks",
        payload: { title: "Check pond pumps" },
        tenantId: 7,
      },
    ]);

    mocks.requestMock.mockRejectedValueOnce(new Error("Network Error"));

    const firstResult = await flushOfflineQueue({ source: "manual" });

    expect(firstResult).toBe(false);
    expect(mocks.markQueuedMutationQueuedMock).toHaveBeenCalledWith("req-1");
    expect(mocks.setOfflineSyncSnapshotMock.mock.calls.at(-1)?.[0]).toMatchObject({
      status: "paused",
      remaining: 1,
      failedCount: 0,
    });

    mocks.requestMock.mockResolvedValueOnce({ data: { success: true } });

    const secondResult = await flushOfflineQueue({ source: "backend-up" });

<<<<<<< HEAD
    expect(secondResult).toBe(true);
    expect(mocks.requestMock).toHaveBeenCalledTimes(2);
  });

  it("treats backend unavailable responses as temporary sync pauses", async () => {
    mocks.listQueuedMutationsMock.mockReturnValue([
      {
        requestId: "req-2",
        status: "queued",
        method: "POST",
        path: "/api/tasks",
        payload: { title: "Restart aerator" },
        tenantId: 7,
      },
    ]);
    mocks.isBackendUnavailableErrorMock.mockReturnValue(true);
    mocks.requestMock.mockRejectedValueOnce({
      response: {
        status: 503,
        headers: {},
      },
    });

    const result = await flushOfflineQueue({ source: "manual" });

    expect(result).toBe(false);
    expect(mocks.markQueuedMutationQueuedMock).toHaveBeenCalledWith("req-2");
    expect(mocks.markQueuedMutationFailedMock).not.toHaveBeenCalled();
    expect(mocks.setOfflineSyncSnapshotMock.mock.calls.at(-1)?.[0]).toMatchObject({
      status: "paused",
      remaining: 1,
    });
  });

  it("treats replay timeouts as temporary sync pauses instead of failed mutations", async () => {
    mocks.listQueuedMutationsMock.mockReturnValue([
      {
        requestId: "req-timeout",
        status: "queued",
        method: "POST",
        path: "/api/sales",
        payload: { itemName: "Layers", quantity: 3 },
        tenantId: 7,
      },
    ]);
    mocks.requestMock.mockRejectedValueOnce({
      code: "ECONNABORTED",
      message: "timeout of 25000ms exceeded",
    });

    const result = await flushOfflineQueue({ source: "manual" });

    expect(result).toBe(false);
    expect(mocks.markQueuedMutationQueuedMock).toHaveBeenCalledWith("req-timeout");
    expect(mocks.markQueuedMutationFailedMock).not.toHaveBeenCalled();
    expect(mocks.setOfflineSyncSnapshotMock.mock.calls.at(-1)?.[0]).toMatchObject({
      status: "paused",
      remaining: 1,
      failedCount: 0,
    });
  });

=======
    expect(secondResult).toBe(false);
    expect(mocks.requestMock).toHaveBeenCalledTimes(1);

    const thirdResult = await flushOfflineQueue({ source: "manual" });

    expect(thirdResult).toBe(true);
    expect(mocks.requestMock).toHaveBeenCalledTimes(2);
  });

>>>>>>> 0babf4d (Update frontend application)
  it("skips replay entirely while demo mode is active", async () => {
    mocks.hasDemoAccountHintMock.mockReturnValue(true);
    mocks.listQueuedMutationsMock.mockReturnValue([
      {
        requestId: "req-demo",
        status: "queued",
        method: "POST",
        path: "/api/sales",
        payload: { itemName: "Demo eggs" },
        tenantId: 3,
      },
    ]);

    const result = await flushOfflineQueue({ source: "manual" });

    expect(result).toBe(false);
    expect(mocks.requestMock).not.toHaveBeenCalled();
    expect(mocks.setOfflineSyncSnapshotMock).toHaveBeenCalledWith({
      status: "idle",
      total: 0,
      remaining: 0,
      failedCount: 0,
      lastSyncedAt: "",
    });
  });
<<<<<<< HEAD

  it("waits for a workspace session before replaying queued changes", async () => {
    mocks.getWorkspaceTokenMock.mockReturnValue("");
    mocks.listQueuedMutationsMock.mockReturnValue([
      {
        requestId: "req-auth",
        status: "queued",
        method: "POST",
        path: "/api/inventory",
        payload: { itemName: "Fish feed" },
        tenantId: 7,
      },
    ]);

    const result = await flushOfflineQueue({ source: "startup" });

    expect(result).toBe(false);
    expect(mocks.requestMock).not.toHaveBeenCalled();
    expect(mocks.setOfflineSyncSnapshotMock).toHaveBeenCalledWith({
      status: "idle",
      total: 0,
      remaining: 0,
      failedCount: 0,
      lastSyncedAt: "",
    });
  });

  it("treats auth bootstrap failures as temporary pauses instead of permanent failures", async () => {
    mocks.listQueuedMutationsMock.mockReturnValue([
      {
        requestId: "req-auth-pause",
        status: "queued",
        method: "POST",
        path: "/api/sales",
        payload: { itemName: "Egg trays", quantity: 2 },
        tenantId: 7,
      },
    ]);
    mocks.requestMock.mockRejectedValueOnce({
      response: {
        status: 401,
        data: {
          message: "Not authenticated",
        },
      },
    });

    const result = await flushOfflineQueue({ source: "manual" });

    expect(result).toBe(false);
    expect(mocks.markQueuedMutationQueuedMock).toHaveBeenCalledWith("req-auth-pause");
    expect(mocks.markQueuedMutationFailedMock).not.toHaveBeenCalled();
    expect(mocks.setOfflineSyncSnapshotMock.mock.calls.at(-1)?.[0]).toMatchObject({
      status: "paused",
      remaining: 1,
      failedCount: 0,
    });
  });
=======
>>>>>>> 0babf4d (Update frontend application)
});

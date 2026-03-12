import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hasDemoAccountHintMock: vi.fn(() => false),
  requestMock: vi.fn(),
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

  it("keeps paused state on network failure and throttles immediate backend-up retries", async () => {
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

    expect(secondResult).toBe(false);
    expect(mocks.requestMock).toHaveBeenCalledTimes(1);

    const thirdResult = await flushOfflineQueue({ source: "manual" });

    expect(thirdResult).toBe(true);
    expect(mocks.requestMock).toHaveBeenCalledTimes(2);
  });

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
});

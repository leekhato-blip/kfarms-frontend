import { describe, expect, it } from "vitest";

import {
  applyOfflineMutationToResponse,
  buildOptimisticRecord,
  detectOfflineResource,
} from "./offlineResources";

function createTaskListResponse(tasks = []) {
  return {
    success: true,
    data: tasks,
  };
}

describe("offline task resources", () => {
  it("detects task resource paths for upcoming task caches", () => {
    expect(detectOfflineResource("/api/tasks")).toBe("tasks");
    expect(detectOfflineResource("/api/tasks/upcoming")).toBe("tasks");
    expect(detectOfflineResource("/api/tasks/42/complete")).toBe("tasks");
  });

  it("builds optimistic task records for queued creates", () => {
    const record = buildOptimisticRecord({
      resource: "tasks",
      action: "create",
      payload: {
        title: "Check brooder temperature",
        dueDate: "2026-03-11T08:00:00.000Z",
        priority: 1,
        type: "HEALTH",
      },
      requestId: "task-req-1",
      now: "2026-03-11T07:45:00.000Z",
    });

    expect(record.id).toBe("offline-task-task-req-1");
    expect(record.title).toBe("Check brooder temperature");
    expect(record.offlinePending).toBe(true);
    expect(record.offlineStatus).toBe("queued");
    expect(record.priority).toBe(1);
  });

  it("adds queued task creates into cached upcoming task responses", () => {
    const responseData = createTaskListResponse([
      {
        id: 2,
        title: "Inspect feed bins",
        dueDate: "2026-03-11T12:00:00.000Z",
        priority: 2,
      },
    ]);

    const optimisticTask = buildOptimisticRecord({
      resource: "tasks",
      action: "create",
      payload: {
        title: "Check pond aerator",
        dueDate: "2026-03-11T09:00:00.000Z",
        priority: 1,
      },
      requestId: "task-req-2",
      now: "2026-03-11T08:30:00.000Z",
    });

    const patched = applyOfflineMutationToResponse({
      responseData,
      resource: "tasks",
      path: "/api/tasks/upcoming",
      mutation: {
        action: "create",
        optimisticData: optimisticTask,
      },
    });

    expect(patched.data).toHaveLength(2);
    expect(patched.data[0].title).toBe("Check pond aerator");
    expect(patched.data[1].title).toBe("Inspect feed bins");
  });

  it("removes queued task completions and deletes from cached lists", () => {
    const originalTasks = [
      {
        id: 7,
        title: "Flush drinkers",
        dueDate: "2026-03-11T08:00:00.000Z",
        priority: 1,
      },
      {
        id: 8,
        title: "Review hatch notes",
        dueDate: "2026-03-11T10:00:00.000Z",
        priority: 2,
      },
    ];
    const completionSource = originalTasks.map((task) => ({ ...task }));
    const deletionSource = originalTasks.map((task) => ({ ...task }));

    const completedTask = buildOptimisticRecord({
      resource: "tasks",
      action: "complete",
      payload: null,
      requestId: "task-req-3",
      now: "2026-03-11T08:10:00.000Z",
      baseRecord: completionSource[0],
    });

    const afterComplete = applyOfflineMutationToResponse({
      responseData: createTaskListResponse(completionSource),
      resource: "tasks",
      path: "/api/tasks/upcoming",
      mutation: {
        action: "complete",
        optimisticData: completedTask,
      },
    });

    expect(afterComplete.data).toHaveLength(1);
    expect(afterComplete.data[0].id).toBe(8);

    const deletedTask = buildOptimisticRecord({
      resource: "tasks",
      action: "delete",
      payload: null,
      requestId: "task-req-4",
      now: "2026-03-11T08:15:00.000Z",
      baseRecord: deletionSource[1],
    });

    const afterDelete = applyOfflineMutationToResponse({
      responseData: createTaskListResponse(deletionSource),
      resource: "tasks",
      path: "/api/tasks",
      mutation: {
        action: "delete",
        optimisticData: deletedTask,
      },
    });

    expect(afterDelete.data).toHaveLength(1);
    expect(afterDelete.data[0].id).toBe(7);
  });
});

import api from "../api/apiClient";
import { buildOfflineMutationConfig } from "../offline/offlineStore";

/**
 * Fetches upcoming tasks.
 * Backend: GET /api/tasks/upcoming?limit=4
 * Returns: { success, message, data: [Task] }
 */
export async function getUpcomingTasks(limit = 4) {
    const res = await api.get("/tasks/upcoming", {
        params: { limit },
    });
    return res.data.data;
}

/**
 * Fetches all pending tasks.
 * Backend: GET /api/tasks
 * Returns: { success, message, data: [Task] }
 */
export async function getAllPendingTasks() {
    const res = await api.get("/tasks");
    return res.data.data;
}

/**
 * Creates a new task.
 * Backend: POST /api/tasks
 * Body: TaskRequestDto
 */
export async function createTask(payload) {
    const res = await api.post(
        "/tasks",
        payload,
        buildOfflineMutationConfig({
            resource: "tasks",
            action: "create",
        }),
    );
    return res.data.data;
}

/**
 * Updates an existing task.
 * Backend: PUT /api/tasks/{id}
 * Body: TaskRequestDto
 */
export async function updateTask(id, payload, options = {}) {
    const res = await api.put(
        `/tasks/${id}`,
        payload,
        buildOfflineMutationConfig({
            resource: "tasks",
            action: "update",
            baseRecord: options.baseRecord,
        }),
    );
    return res.data.data;
}

/**
 * Deletes a task.
 * Backend: DELETE /api/tasks/{id}
 */
export async function deleteTask(id, options = {}) {
    const res = await api.delete(
        `/tasks/${id}`,
        buildOfflineMutationConfig({
            resource: "tasks",
            action: "delete",
            baseRecord: options.baseRecord,
        }),
    );

    return {
        success: Boolean(res.data?.success),
        data: res.data?.data ?? null,
        offlineQueued: Boolean(res.data?.meta?.offlineQueued),
    };
}

/**
 * Marks a task as complete.
 * Backend: PATCH /api/tasks/{id}/complete
 */
export async function completeTask(id, options = {}) {
    const res = await api.patch(
        `/tasks/${id}/complete`,
        null,
        buildOfflineMutationConfig({
            resource: "tasks",
            action: "complete",
            baseRecord: options.baseRecord,
        }),
    );
    return res.data.data;
}

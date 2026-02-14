import api from "./axios";

/**
 * Fetches upcoming tasks.
 * Backend: GET /api/tasks/upcoming?limit=4
 * Returns: { success, message, data: [Task] }
 */
export async function getUpcomingTasks(limit = 4) {
    const res = await api.get(`/tasks/upcoming?limit=${limit}`);
    console.log("Upcoming tasks response:", res);
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
    const res = await api.post("/tasks", payload);
    return res.data.data;
}

/**
 * Updates an existing task.
 * Backend: PUT /api/tasks/{id}
 * Body: TaskRequestDto
 */
export async function updateTask(id, payload) {
    const res = await api.put(`/tasks/${id}`, payload);
    return res.data.data;
}

/**
 * Deletes a task.
 * Backend: DELETE /api/tasks/{id}
 */
export async function deleteTask(id) {
    const res = await api.delete(`/tasks/${id}`);
    return res.data.success;
}

/**
 * Marks a task as complete.
 * Backend: PATCH /api/tasks/{id}/complete
 */
export async function completeTask(id) {
    const res = await api.patch(`/tasks/${id}/complete`);
    return res.data.data;
}

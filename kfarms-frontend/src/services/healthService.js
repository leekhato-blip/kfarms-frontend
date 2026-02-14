import api from "./axios";

/**
 * Fetch all active health events
 * GET /health/events
 * Returns: { success, message, data: [HealthEventDTO] }
 */
export async function getHealthEvents() {
  const res = await api.get("/health/events");
  return res.data.data;
}

/**
 * Trigger a rule manually
 * POST /health/rules/{ruleId}/trigger?contextNote=...
 * Returns: { success, message, data: HealthEventDTO }
 */
export async function triggerHealthRule(ruleId, contextNote) {
  const res = await api.post(`/health/rules/${ruleId}/trigger`, null, {
    params: { contextNote },
  });
  return res.data.data;
}

/**
 * Acknowledge an event
 * PUT /health/events/{id}/acknowledge
 * Returns: { success, message, data: HealthEventDTO }
 */
export async function acknowledgeHealthEvent(eventId) {
  const res = await api.put(`/health/events/${eventId}/acknowledge`);
  return res.data.data;
}

/**
 * Handle an event
 * POST /health/events/{id}/handle
 * Returns: { success, message, data: HealthEventDTO }
 */
export async function handleHealthEvent(eventId) {
  const res = await api.post(`/health/events/${eventId}/handle`);
  return res.data.data;
}

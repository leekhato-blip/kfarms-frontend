import api from "../api/apiClient";
import { hasDemoAccountHint } from "../auth/demoMode";

const DEMO_ALERT_FILL_TARGET = 3;

const SEVERITY_ORDER = {
  CRITICAL: 0,
  WARNING: 1,
  INFO: 2,
};

function normalizeSeverity(value, fallback = "INFO") {
  const normalized = String(value || fallback).trim().toUpperCase();
  return SEVERITY_ORDER[normalized] != null ? normalized : fallback;
}

function normalizeStatus(value) {
  const normalized = String(value || "NEW").trim().toUpperCase();
  if (["ACKNOWLEDGED", "HANDLED", "NEW"].includes(normalized)) {
    return normalized;
  }
  if (["RESOLVED", "CLOSED", "DONE"].includes(normalized)) {
    return "HANDLED";
  }
  if (["OPEN", "ACTIVE", "PENDING"].includes(normalized)) {
    return "NEW";
  }
  return "NEW";
}

function normalizeResponseMinutes(value) {
  const minutes = Number(value);
  return Number.isFinite(minutes) ? minutes : null;
}

function normalizeTimestamp(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toISOString();
}

function detectHealthTheme(raw = {}) {
  const title = String(raw.title || "");
  const category = String(raw.category || "");
  const contextNote = String(raw.contextNote || "");
  const haystack = `${title} ${category} ${contextNote}`.toLowerCase();

  if (/(mortality|dead bird|dead fish|death|die-off|outbreak|sudden loss)/.test(haystack)) {
    return "MORTALITY";
  }
  if (/(heat|hot|temperature|panting|pant|dehydration|humidity)/.test(haystack)) {
    return "HEAT_STRESS";
  }
  if (/(oxygen|pond|water|aeration|ammonia|ph |ph:|dissolved oxygen)/.test(haystack)) {
    return "WATER_QUALITY";
  }
  if (/(respiratory|cough|sneeze|gasp|nasal|breathing)/.test(haystack)) {
    return "RESPIRATORY";
  }
  if (/(feed|feeder|ration|intake|drink|water intake|stockout)/.test(haystack)) {
    return "FEED_INTAKE";
  }
  if (/(biosecurity|visitor|footbath|disinfect|quarantine)/.test(haystack)) {
    return "BIOSECURITY";
  }
  return String(category || "GENERAL").trim().toUpperCase() || "GENERAL";
}

function getThemeAdviceSteps(theme) {
  switch (theme) {
    case "HEAT_STRESS":
      return [
        "Move the flock or pen into cooler airflow and reduce crowding immediately.",
        "Top up clean drinking water and add electrolytes if your team uses them.",
        "Recheck breathing, wing spreading, and water intake within 30 minutes.",
      ];
    case "MORTALITY":
      return [
        "Isolate the affected flock, pond, or pen and record the loss count now.",
        "Remove dead stock quickly and disinfect boots, trays, and shared tools after handling.",
        "Escalate to a vet or supervisor if the loss trend rises again on the next round.",
      ];
    case "WATER_QUALITY":
      return [
        "Check dissolved oxygen, temperature, and recent water color changes before the next feed.",
        "Confirm aeration or water exchange is running as expected and reduce feeding if fish are stressed.",
        "Log the pond, time, and any mortality or gasping behavior for follow-up.",
      ];
    case "RESPIRATORY":
      return [
        "Inspect ventilation, litter moisture, and ammonia smell in the affected house.",
        "Separate clearly sick birds from the main flock if your setup allows it.",
        "Track coughing, sneezing, or nasal discharge again on the next welfare check.",
      ];
    case "FEED_INTAKE":
      return [
        "Check feeder access, water flow, and whether the ration changed in the last 24 hours.",
        "Inspect the remaining feed for dampness, mold, or unusual smell before the next round.",
        "Compare the next intake check against the normal daily pattern and log any further drop.",
      ];
    case "BIOSECURITY":
      return [
        "Restrict movement into the affected area until the team confirms the cause.",
        "Refresh footbaths, clean entry points, and review the most recent visitor or delivery activity.",
        "Record the affected area and brief the team on the control steps for the next shift.",
      ];
    default:
      return [
        "Inspect the affected area and record the main symptoms or signal clearly.",
        "Check feed, water, temperature, and movement before the next routine round.",
        "Escalate early if the signal grows stronger or repeats on the same day.",
      ];
  }
}

function buildContextNote(raw = {}, theme, responseMinutes) {
  const existing = String(raw.contextNote || "").trim();
  if (existing) return existing;

  const timingNote =
    responseMinutes != null ? `Open for ${responseMinutes} min.` : "Needs review on the next check.";

  switch (theme) {
    case "HEAT_STRESS":
      return `${timingNote} Watch airflow, water access, and bird panting closely.`;
    case "MORTALITY":
      return `${timingNote} Mortality pressure is above routine tolerance and needs a direct count.`;
    case "WATER_QUALITY":
      return `${timingNote} Pond conditions may be driving stress or reduced feeding response.`;
    case "RESPIRATORY":
      return `${timingNote} Early respiratory signs need a house-level inspection before they spread.`;
    case "FEED_INTAKE":
      return `${timingNote} Intake drift often starts with feed quality, access, or water flow.`;
    case "BIOSECURITY":
      return `${timingNote} Tighten movement control until the source is clearer.`;
    default:
      return timingNote;
  }
}

function inferSeverity(raw = {}, theme, responseMinutes) {
  const explicit = normalizeSeverity(raw.severity, "");
  const title = String(raw.title || "");
  const contextNote = String(raw.contextNote || "");
  const haystack = `${title} ${contextNote}`.toLowerCase();

  let severity = explicit || "INFO";

  if (
    theme === "MORTALITY" ||
    /(critical|urgent|outbreak|oxygen crash|sudden mortality|mass death)/.test(haystack)
  ) {
    severity = "CRITICAL";
  } else if (
    severity === "INFO" &&
    ["HEAT_STRESS", "RESPIRATORY", "FEED_INTAKE", "WATER_QUALITY"].includes(theme)
  ) {
    severity = "WARNING";
  }

  if (responseMinutes != null && responseMinutes >= 240 && severity === "INFO") {
    severity = "WARNING";
  }
  if (responseMinutes != null && responseMinutes >= 360 && severity === "WARNING") {
    severity = "CRITICAL";
  }

  return normalizeSeverity(severity);
}

function mergeAdviceSteps(existingSteps = [], theme) {
  const seen = new Set();
  const next = [];

  [...existingSteps, ...getThemeAdviceSteps(theme)].forEach((step) => {
    const value = String(step || "").trim();
    if (!value) return;
    const key = value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    next.push(value);
  });

  return next.slice(0, 4);
}

function sortAlerts(left, right) {
  const leftSeverity = SEVERITY_ORDER[left?.severity] ?? 99;
  const rightSeverity = SEVERITY_ORDER[right?.severity] ?? 99;
  if (leftSeverity !== rightSeverity) {
    return leftSeverity - rightSeverity;
  }

  const leftStatusRank = left?.status === "NEW" ? 0 : left?.status === "ACKNOWLEDGED" ? 1 : 2;
  const rightStatusRank =
    right?.status === "NEW" ? 0 : right?.status === "ACKNOWLEDGED" ? 1 : 2;
  if (leftStatusRank !== rightStatusRank) {
    return leftStatusRank - rightStatusRank;
  }

  const leftResponse = Number.isFinite(left?.responseMinutes) ? left.responseMinutes : -1;
  const rightResponse = Number.isFinite(right?.responseMinutes) ? right.responseMinutes : -1;
  if (leftResponse !== rightResponse) {
    return rightResponse - leftResponse;
  }

  const leftTime = new Date(left?.triggeredAt || 0).getTime();
  const rightTime = new Date(right?.triggeredAt || 0).getTime();
  return rightTime - leftTime;
}

function addMinutes(baseDate, deltaMinutes) {
  return new Date(baseDate.getTime() + deltaMinutes * 60 * 1000).toISOString();
}

function buildDemoHealthAlerts() {
  const now = new Date();
  return [
    {
      id: "demo-health-heat-stress",
      title: "Heat Stress Warning",
      category: "HEAT_STRESS",
      severity: "WARNING",
      status: "NEW",
      triggeredAt: addMinutes(now, -22),
      responseMinutes: 22,
      contextNote: "House 2 reached 33.8C and birds started panting near the drinker line.",
      adviceSteps: getThemeAdviceSteps("HEAT_STRESS"),
      readOnly: true,
      source: "demo",
    },
    {
      id: "demo-health-feed-intake",
      title: "Feed Intake Drop",
      category: "FEED_INTAKE",
      severity: "WARNING",
      status: "NEW",
      triggeredAt: addMinutes(now, -84),
      responseMinutes: 84,
      contextNote: "Layer pen B ate below its normal morning level after the latest ration switch.",
      adviceSteps: getThemeAdviceSteps("FEED_INTAKE"),
      readOnly: true,
      source: "demo",
    },
    {
      id: "demo-health-respiratory",
      title: "Respiratory Check Needed",
      category: "RESPIRATORY",
      severity: "INFO",
      status: "NEW",
      triggeredAt: addMinutes(now, -165),
      responseMinutes: 165,
      contextNote: "A few birds in Grower House A showed sneezing and mild nasal discharge.",
      adviceSteps: getThemeAdviceSteps("RESPIRATORY"),
      readOnly: true,
      source: "demo",
    },
    {
      id: "demo-health-biosecurity",
      title: "Biosecurity Routine Tighten-Up",
      category: "BIOSECURITY",
      severity: "INFO",
      status: "ACKNOWLEDGED",
      triggeredAt: addMinutes(now, -320),
      responseMinutes: 320,
      contextNote: "A delivery and two visitors came through the same entry route this morning.",
      adviceSteps: getThemeAdviceSteps("BIOSECURITY"),
      readOnly: true,
      source: "demo",
    },
  ];
}

function getAlertIdentity(alert) {
  const theme = detectHealthTheme(alert);
  return `${theme}:${String(alert?.title || "").trim().toLowerCase()}`;
}

function mergeDemoAlerts(alerts = []) {
  const normalizedAlerts = Array.isArray(alerts) ? alerts : [];
  if (normalizedAlerts.length >= DEMO_ALERT_FILL_TARGET) {
    return normalizedAlerts.slice().sort(sortAlerts);
  }

  const seen = new Set(normalizedAlerts.map(getAlertIdentity));
  const seeded = buildDemoHealthAlerts().filter((alert) => {
    const key = getAlertIdentity(alert);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return [...normalizedAlerts, ...seeded]
    .sort(sortAlerts)
    .slice(0, Math.max(DEMO_ALERT_FILL_TARGET, normalizedAlerts.length));
}

function normalizeHealthEvent(raw = {}) {
  const theme = detectHealthTheme(raw);
  const responseMinutes = normalizeResponseMinutes(raw.responseMinutes);
  const severity = inferSeverity(raw, theme, responseMinutes);

  return {
    id: raw.id,
    title: String(raw.title || "Health alert"),
    category: String(raw.category || theme).toUpperCase(),
    severity,
    status: normalizeStatus(raw.status),
    triggeredAt: normalizeTimestamp(raw.triggeredAt || raw.createdAt),
    responseMinutes,
    adviceSteps: mergeAdviceSteps(raw.adviceSteps, theme),
    contextNote: buildContextNote(raw, theme, responseMinutes),
    contact: raw.contact || raw.contactPhone || raw.phone || "",
    readOnly: Boolean(raw.readOnly),
    source: raw.source || "api",
  };
}

/**
 * Fetch all active health events
 * GET /health/events
 * Returns: { success, message, data: [HealthEventDTO] }
 */
export async function getHealthEvents() {
  const res = await api.get("/health/events");
  const payload = Array.isArray(res.data?.data) ? res.data.data : [];
  const normalized = payload.map((entry) => normalizeHealthEvent(entry)).sort(sortAlerts);
  return hasDemoAccountHint() ? mergeDemoAlerts(normalized) : normalized;
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
  return normalizeHealthEvent(res.data?.data ?? {});
}

/**
 * Acknowledge an event
 * PUT /health/events/{id}/acknowledge
 * Returns: { success, message, data: HealthEventDTO }
 */
export async function acknowledgeHealthEvent(eventId) {
  const res = await api.put(`/health/events/${eventId}/acknowledge`);
  return normalizeHealthEvent(res.data?.data ?? {});
}

/**
 * Handle an event
 * POST /health/events/{id}/handle
 * Returns: { success, message, data: HealthEventDTO }
 */
export async function handleHealthEvent(eventId) {
  const res = await api.post(`/health/events/${eventId}/handle`);
  return normalizeHealthEvent(res.data?.data ?? {});
}

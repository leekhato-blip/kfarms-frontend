import apiClient from "../api/apiClient";

const SUPPORT_TICKETS_STORAGE_KEY = "kf-placeholder-support-tickets";

const SUPPORT_ENDPOINTS = {
  resources: "/support/resources",
  tickets: "/support/tickets",
};

export const SUPPORT_CHANNELS = [
  {
    id: "email",
    label: "Email us",
    value: "support@kfarms.app",
    note: "Replies within one business day.",
    href: "mailto:support@kfarms.app",
  },
  {
    id: "phone",
    label: "Call us",
    value: "+234 903 5085 579",
    note: "Mon - Fri, 9:00 AM to 5:00 PM (WAT).",
    href: "tel:+2349035085579",
  },
  {
    id: "safety",
    label: "Safety emergency",
    value: "Call emergency services first for life-threatening incidents.",
    note: "Use app support after immediate safety response.",
    href: "",
  },
];

export const FARMER_GUIDES = [
  {
    id: "pond-health-daily",
    category: "Fish Ponds",
    title: "Daily Pond Health Checklist",
    summary: "Keep ponds stable with a 10-minute morning and evening routine.",
    steps: [
      "Check dissolved oxygen, temperature, and water color before first feed.",
      "Log unusual fish behavior, gasping, or surface clustering immediately.",
      "Confirm inlet and outlet flow is normal and record any blockage risk.",
      "Remove visible debris and verify aeration equipment is running.",
      "Repeat a quick evening check and note changes in the dashboard.",
    ],
    tip: "If fish feed response drops suddenly, treat it as an early warning sign.",
  },
  {
    id: "feed-planning-weekly",
    category: "Feeds & Nutrition",
    title: "Weekly Feed Planning For Better Margins",
    summary: "Plan feed purchase and usage by biomass and growth stage.",
    steps: [
      "Estimate biomass per pond using latest sample weights and stock counts.",
      "Apply feeding rate by growth stage, then set daily feed target.",
      "Cross-check actual feed dispensed against planned quantity.",
      "Flag ponds with poor appetite and investigate water quality before increasing feed.",
      "Set reorder thresholds in Inventory to avoid emergency buying.",
    ],
    tip: "Track feed conversion trends weekly to spot profit leaks early.",
  },
  {
    id: "livestock-health-logs",
    category: "Poultry",
    title: "Poultry Health Logging Workflow",
    summary: "A simple workflow for recording symptoms, treatment, and outcome.",
    steps: [
      "Capture affected batch/pen and symptom onset date.",
      "Record feed change, vaccination status, and recent stress factors.",
      "Log treatment details and withdrawal period where applicable.",
      "Set follow-up reminders for review and containment checks.",
      "Close the case only after condition and mortality trend normalize.",
    ],
    tip: "Consistent health logs improve prevention and daily decision-making.",
  },
  {
    id: "sales-cashflow",
    category: "Sales & Revenue",
    title: "Sales Recording For Accurate Cashflow",
    summary: "Capture every sale cleanly so reporting and decisions stay reliable.",
    steps: [
      "Record quantity, unit price, buyer details, and payment status same day.",
      "Tag sales by product line to compare pond and poultry profitability.",
      "Reconcile cash and transfer entries against your bank or wallet daily.",
      "Use weekly sales trend view to identify high-demand periods.",
      "Review overdue invoices at least twice a week.",
    ],
    tip: "Small data gaps create big finance blind spots over time.",
  },
  {
    id: "inventory-reorder",
    category: "Inventory & Supplies",
    title: "Reorder System That Prevents Stockouts",
    summary: "Build a predictable stock process for feed, treatments, and equipment.",
    steps: [
      "Set reorder levels from average weekly usage and supplier lead time.",
      "Classify items as critical, operational, or low-risk.",
      "Review low-stock and out-of-stock alerts each morning.",
      "Track delivery lead times to identify unreliable suppliers.",
      "Close the loop by confirming received quantities against purchase intent.",
    ],
    tip: "Critical items should have a safety stock buffer, not just a reorder trigger.",
  },
  {
    id: "team-workspace-onboarding",
    category: "Team & Farm Access",
    title: "Bring Your Team In Without Data Confusion",
    summary: "Set roles and responsibilities so records stay clean across teams.",
    steps: [
      "Invite users to the correct farm and confirm access level.",
      "Define who enters pond data, who reviews, and who approves changes.",
      "Use a short naming convention for ponds, batches, and stock items.",
      "Review activity logs weekly for unusual edits or missed records.",
      "Keep one lead person responsible for regular data checks.",
    ],
    tip: "Clear ownership prevents duplicate records and missing updates.",
  },
];

export const SUPPORT_FAQS = [
  {
    id: "faq-1",
    question: "How often should I update pond records?",
    answer:
      "At least once daily. High-risk periods (weather changes, disease concern, feed response drops) should be logged more frequently.",
  },
  {
    id: "faq-2",
    question: "Can I track both fish and poultry in one account?",
    answer:
      "Yes. KFarms supports fish ponds, poultry, feeds, supplies, sales, and inventory in one farm account.",
  },
  {
    id: "faq-3",
    question: "What should I do when a critical support issue happens?",
    answer:
      "For safety emergencies, call emergency services first. Then send an urgent help request with clear steps, screenshots, and times.",
  },
  {
    id: "faq-4",
    question: "How do I request plan or billing help?",
    answer:
      "Ask for help under Billing & plan, or open Billing to review your current plan and payment status.",
  },
];

function wait(ms = 250) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function shouldUsePlaceholder(error) {
  const status = error?.response?.status;
  if (!error?.response) return true;
  return [404, 405, 501, 502, 503].includes(status);
}

function extractErrorMessage(error, fallback) {
  const payload = error?.response?.data;
  if (typeof payload === "string" && payload.trim()) return payload;
  if (typeof payload?.message === "string" && payload.message.trim()) return payload.message;
  if (typeof payload?.error === "string" && payload.error.trim()) return payload.error;
  return fallback;
}

function readStorageMap(key) {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorageMap(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getTenantKey(tenantId) {
  const parsed = Number(tenantId);
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : "default";
}

function normalizePriority(value, fallback = "MEDIUM") {
  const normalized = String(value || "").trim().toUpperCase();
  if (["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(normalized)) return normalized;
  return fallback;
}

function normalizeStatus(value, fallback = "OPEN") {
  const normalized = String(value || "").trim().toUpperCase();
  if (["OPEN", "PENDING", "RESOLVED"].includes(normalized)) return normalized;
  if (normalized === "CLOSED") return "RESOLVED";
  return fallback;
}

function normalizeMessage(entry = {}) {
  return {
    id: String(entry.id || `MSG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
    body: String(entry.body || entry.message || "").trim(),
    authorType: String(entry.authorType || entry.senderType || "USER").toUpperCase() === "SUPPORT"
      ? "SUPPORT"
      : "USER",
    authorName: String(entry.authorName || entry.senderName || "Farmer"),
    createdAt: entry.createdAt || entry.timestamp || new Date().toISOString(),
  };
}

function normalizeTicket(raw = {}) {
  const initialMessage = String(raw.description || raw.body || "").trim();
  const list = Array.isArray(raw.messages) ? raw.messages : [];
  const normalizedMessages = list
    .map((entry) => normalizeMessage(entry))
    .filter((message) => Boolean(message.body));

  if (normalizedMessages.length === 0 && initialMessage) {
    normalizedMessages.push(
      normalizeMessage({
        body: initialMessage,
        authorType: "USER",
        authorName: raw.createdByName || "Farmer",
        createdAt: raw.createdAt,
      }),
    );
  }

  return {
    id: String(raw.id || raw.ticketId || `TKT-${Date.now()}`),
    subject: String(raw.subject || raw.title || "Help request"),
    category: String(raw.category || "General"),
    priority: normalizePriority(raw.priority, "MEDIUM"),
    status: normalizeStatus(raw.status, "OPEN"),
    lane: String(raw.lane || "STANDARD").toUpperCase(),
    laneLabel: String(raw.laneLabel || ""),
    plan: String(raw.plan || raw.tenantPlan || "FREE").toUpperCase(),
    description: initialMessage || (normalizedMessages[0]?.body ?? ""),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
    messages: normalizedMessages,
  };
}

function getPlaceholderTicketsForTenant(tenantId) {
  const key = getTenantKey(tenantId);
  const map = readStorageMap(SUPPORT_TICKETS_STORAGE_KEY);
  const list = Array.isArray(map[key]) ? map[key] : [];
  return list.map((ticket) => normalizeTicket(ticket));
}

function setPlaceholderTicketsForTenant(tenantId, tickets = []) {
  const key = getTenantKey(tenantId);
  const map = readStorageMap(SUPPORT_TICKETS_STORAGE_KEY);
  map[key] = tickets.map((ticket) => normalizeTicket(ticket));
  writeStorageMap(SUPPORT_TICKETS_STORAGE_KEY, map);
  return map[key];
}

function generateSupportAck(subject = "") {
  const context = subject ? `about "${subject}"` : "with your request";
  return `Thanks. We saved your help request ${context} and will reply with the next step shortly.`;
}

function hasItems(list) {
  return Array.isArray(list) && list.length > 0;
}

export async function getSupportResources() {
  try {
    const response = await apiClient.get(SUPPORT_ENDPOINTS.resources);
    const payload = response.data?.data ?? response.data ?? {};
    return {
      guides: hasItems(payload.guides) ? payload.guides : FARMER_GUIDES,
      faqs: hasItems(payload.faqs) ? payload.faqs : SUPPORT_FAQS,
      channels: hasItems(payload.channels) ? payload.channels : SUPPORT_CHANNELS,
      source: "api",
    };
  } catch (error) {
    if (!shouldUsePlaceholder(error)) {
      throw new Error(extractErrorMessage(error, "Could not load help information."));
    }

    await wait(120);
    return {
      guides: FARMER_GUIDES,
      faqs: SUPPORT_FAQS,
      channels: SUPPORT_CHANNELS,
      source: "placeholder",
    };
  }
}

export async function getSupportTickets({ tenantId } = {}) {
  try {
    const response = await apiClient.get(SUPPORT_ENDPOINTS.tickets);
    const payload = response.data?.data ?? response.data;
    const items = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
        ? payload
        : [];
    return {
      tickets: items.map((ticket) => normalizeTicket(ticket)),
      source: "api",
    };
  } catch (error) {
    if (!shouldUsePlaceholder(error)) {
      throw new Error(extractErrorMessage(error, "Could not load help requests."));
    }

    await wait();
    return {
      tickets: getPlaceholderTicketsForTenant(tenantId),
      source: "placeholder",
    };
  }
}

export async function createSupportTicket({
  tenantId,
  subject,
  category,
  priority = "MEDIUM",
  description,
  createdByName = "Farmer",
} = {}) {
  const trimmedSubject = String(subject || "").trim();
  const trimmedDescription = String(description || "").trim();
  const normalizedPriority = normalizePriority(priority, "MEDIUM");

  if (!trimmedSubject) {
    throw new Error("Please add a short title.");
  }
  if (!trimmedDescription) {
    throw new Error("Please explain the problem clearly.");
  }

  try {
    const response = await apiClient.post(SUPPORT_ENDPOINTS.tickets, {
      subject: trimmedSubject,
      category: String(category || "General"),
      priority: normalizedPriority,
      description: trimmedDescription,
    });
    const payload = response.data?.data ?? response.data ?? {};
    return {
      ticket: normalizeTicket(payload.ticket || payload),
      source: "api",
    };
  } catch (error) {
    if (!shouldUsePlaceholder(error)) {
      throw new Error(extractErrorMessage(error, "Could not send your help request."));
    }

    await wait(220);
    const now = new Date().toISOString();
    const existing = getPlaceholderTicketsForTenant(tenantId);
    const nextTicket = normalizeTicket({
      id: `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      subject: trimmedSubject,
      category: String(category || "General"),
      priority: normalizedPriority,
      status: "PENDING",
      description: trimmedDescription,
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: `MSG-${Date.now()}-A`,
          body: trimmedDescription,
          authorType: "USER",
          authorName: createdByName,
          createdAt: now,
        },
        {
          id: `MSG-${Date.now()}-B`,
          body: generateSupportAck(trimmedSubject),
          authorType: "SUPPORT",
          authorName: "KFarms Support",
          createdAt: now,
        },
      ],
    });
    setPlaceholderTicketsForTenant(tenantId, [nextTicket, ...existing]);
    return {
      ticket: nextTicket,
      source: "placeholder",
    };
  }
}

export async function addSupportTicketReply({
  tenantId,
  ticketId,
  message,
  authorName = "Farmer",
} = {}) {
  const ticketKey = String(ticketId || "").trim();
  const body = String(message || "").trim();

  if (!ticketKey) {
    throw new Error("Help request number is required.");
  }
  if (!body) {
    throw new Error("Message cannot be empty.");
  }

  try {
    const response = await apiClient.post(`${SUPPORT_ENDPOINTS.tickets}/${encodeURIComponent(ticketKey)}/messages`, {
      body,
    });
    const payload = response.data?.data ?? response.data ?? {};
    return {
      ticket: normalizeTicket(payload.ticket || payload),
      source: "api",
    };
  } catch (error) {
    if (!shouldUsePlaceholder(error)) {
      throw new Error(extractErrorMessage(error, "Could not send your message."));
    }

    await wait(180);
    const existing = getPlaceholderTicketsForTenant(tenantId);
    const next = existing.map((ticket) => {
      if (ticket.id !== ticketKey) return ticket;
      const now = new Date().toISOString();
      return normalizeTicket({
        ...ticket,
        status: "PENDING",
        updatedAt: now,
        messages: [
          ...(Array.isArray(ticket.messages) ? ticket.messages : []),
          {
            id: `MSG-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            body,
            authorType: "USER",
            authorName,
            createdAt: now,
          },
        ],
      });
    });
    setPlaceholderTicketsForTenant(tenantId, next);
    const updatedTicket = next.find((ticket) => ticket.id === ticketKey);
    if (!updatedTicket) {
      throw new Error("Help request not found.");
    }
    return {
      ticket: updatedTicket,
      source: "placeholder",
    };
  }
}

export async function updateSupportTicketStatus({
  tenantId,
  ticketId,
  status,
} = {}) {
  const ticketKey = String(ticketId || "").trim();
  const nextStatus = normalizeStatus(status, "OPEN");

  if (!ticketKey) {
    throw new Error("Help request number is required.");
  }

  try {
    const response = await apiClient.patch(`${SUPPORT_ENDPOINTS.tickets}/${encodeURIComponent(ticketKey)}`, {
      status: nextStatus,
    });
    const payload = response.data?.data ?? response.data ?? {};
    return {
      ticket: normalizeTicket(payload.ticket || payload),
      source: "api",
    };
  } catch (error) {
    if (!shouldUsePlaceholder(error)) {
      throw new Error(extractErrorMessage(error, "Could not update this help request."));
    }

    await wait(150);
    const existing = getPlaceholderTicketsForTenant(tenantId);
    const next = existing.map((ticket) => {
      if (ticket.id !== ticketKey) return ticket;
      return normalizeTicket({
        ...ticket,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
    });
    setPlaceholderTicketsForTenant(tenantId, next);
    const updatedTicket = next.find((ticket) => ticket.id === ticketKey);
    if (!updatedTicket) {
      throw new Error("Help request not found.");
    }
    return {
      ticket: updatedTicket,
      source: "placeholder",
    };
  }
}

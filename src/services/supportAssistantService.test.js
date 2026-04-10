import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.fn();
const apiPost = vi.fn();
const apiDelete = vi.fn();

vi.mock("../api/apiClient", () => ({
  default: {
    get: apiGet,
    post: apiPost,
    delete: apiDelete,
  },
}));

function createLocalStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

describe("supportAssistantService", () => {
  beforeEach(() => {
    vi.resetModules();
    apiGet.mockReset();
    apiPost.mockReset();
    apiDelete.mockReset();

    globalThis.window = {
      localStorage: createLocalStorage(),
    };
  });

  it("keeps topic context across follow-up questions in placeholder mode", async () => {
    apiPost.mockRejectedValue({ response: { status: 404 } });

    const { askSupportAssistant } = await import("./supportAssistantService");

    await askSupportAssistant({
      tenantId: 11,
      tenantName: "Delta Farm",
      userName: "Lee",
      message: "Show me a daily pond checklist",
      context: {
        currentPath: "/dashboard",
        modules: ["FISH_FARMING"],
      },
    });

    const result = await askSupportAssistant({
      tenantId: 11,
      tenantName: "Delta Farm",
      userName: "Lee",
      message: "What next?",
      context: {
        currentPath: "/dashboard",
        modules: ["FISH_FARMING"],
      },
    });

    expect(result.reply.toLowerCase()).toContain("pond");
    expect(result.reply.toLowerCase()).toContain("oxygen");
    expect(result.actions.map((action) => action.label)).toContain("Open Fish Ponds");
  });

  it("responds to a greeting conversationally without calling the API", async () => {
    const { askSupportAssistant } = await import("./supportAssistantService");

    const result = await askSupportAssistant({
      tenantId: 12,
      tenantName: "Delta Farm",
      userName: "Lee",
      message: "hi",
      context: {
        currentPath: "/dashboard",
        modules: ["FISH_FARMING", "POULTRY"],
      },
    });

    expect(apiPost).not.toHaveBeenCalled();
    expect(result.source).toBe("hybrid");
    expect(result.reply.toLowerCase()).toContain("nice to hear from you");
    expect(result.reply.toLowerCase()).toContain("what would you like help with today");
    expect(result.suggestions).toContain("What needs attention today?");
  });

  it("answers capability questions with a friendly summary", async () => {
    const { askSupportAssistant } = await import("./supportAssistantService");

    const result = await askSupportAssistant({
      tenantId: 13,
      tenantName: "Delta Farm",
      userName: "Lee",
      message: "what can you do",
      context: {
        currentPath: "/feeds",
        modules: ["POULTRY"],
      },
    });

    expect(apiPost).not.toHaveBeenCalled();
    expect(result.reply.toLowerCase()).toContain("absolutely");
    expect(result.reply).toContain("KAI Free");
  it("answers sales summary requests honestly in placeholder mode and offers the right actions", async () => {
    apiPost.mockRejectedValue({ response: { status: 404 } });

    const { askSupportAssistant } = await import("./supportAssistantService");
    const result = await askSupportAssistant({
      tenantId: 9,
      tenantName: "Delta Farm",
      userName: "Lee",
      message: "How are sales this week?",
      context: {
        currentPath: "/dashboard",
        modules: ["POULTRY"],
      },
    });

    expect(result.reply).toContain("KAI Free local mode");
    expect(result.actions.some((action) => action.target === "/app/kfarms/sales")).toBe(true);
    expect(result.suggestions).toContain("What sales fields are mandatory?");
  });

  it("adds enterprise-grade coaching for dashboard fallback replies", async () => {
    apiPost.mockRejectedValue({ response: { status: 404 } });

    const { askSupportAssistant } = await import("./supportAssistantService");
    const result = await askSupportAssistant({
      tenantId: 30,
      tenantName: "Delta Farm",
      userName: "Lee",
      message: "What needs attention today?",
      context: {
        currentPath: "/dashboard",
        modules: ["POULTRY", "FISH_FARMING"],
        plan: "ENTERPRISE",
      },
    });

    expect(result.reply).toContain("KAI Enterprise local mode");
    expect(result.reply).toContain("KAI Enterprise lens:");
    expect(result.suggestions).toContain("What should leaders escalate today?");
    expect(result.actions.some((action) => action.label === "Open Users")).toBe(true);
  });

  it("fills in suggestions and actions when the API reply omits them", async () => {
    apiPost.mockResolvedValue({
      data: {
        data: {
          reply: "Check your low-stock items first, then review reorder levels.",
          messages: [
            { role: "assistant", content: "Check your low-stock items first, then review reorder levels." },
          ],
          suggestions: [],
          actions: [],
        },
      },
    });

    const { askSupportAssistant } = await import("./supportAssistantService");
    const result = await askSupportAssistant({
      tenantId: 4,
      tenantName: "Delta Farm",
      userName: "Lee",
      message: "How do I prioritize critical inventory items?",
      context: {
        currentPath: "/inventory",
        modules: ["POULTRY"],
      },
    });

    expect(result.source).toBe("api");
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.actions.some((action) => action.target === "/app/kfarms/inventory")).toBe(true);
  });

  it("replaces generic snapshot replies with a smarter topic-specific answer", async () => {
    apiPost.mockResolvedValue({
      data: {
        data: {
          reply: [
            "Here is the current workspace snapshot for Delta Farm:",
            "- Inventory: 0 low stock, 0 out of stock.",
            "- Tasks: 2 overdue, 0 due soon.",
            "- Unread alerts include \"No Sales Activity\".",
          ].join("\n"),
          messages: [],
          suggestions: [],
          actions: [],
        },
      },
    });

    const { askSupportAssistant } = await import("./supportAssistantService");
    const result = await askSupportAssistant({
      tenantId: 18,
      tenantName: "Delta Farm",
      userName: "Lee",
      message: "how can i add new sale?",
      context: {
        currentPath: "/dashboard",
        modules: ["POULTRY"],
      },
    });

    expect(result.source).toBe("hybrid");
    expect(result.reply.toLowerCase()).toContain("to add a new sale");
    expect(result.actions.some((action) => action.target === "/app/kfarms/sales")).toBe(true);
  });
});

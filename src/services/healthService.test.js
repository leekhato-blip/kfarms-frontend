import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiGet, apiPost, apiPut, hasDemoAccountHintMock } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  hasDemoAccountHintMock: vi.fn(),
}));

vi.mock("../api/apiClient", () => ({
  default: {
    get: apiGet,
    post: apiPost,
    put: apiPut,
  },
}));

vi.mock("../auth/demoMode", () => ({
  hasDemoAccountHint: hasDemoAccountHintMock,
}));

describe("healthService", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiPut.mockReset();
    hasDemoAccountHintMock.mockReset();
    hasDemoAccountHintMock.mockReturnValue(false);
  });

  it("enriches sparse alerts with smarter severity and recommended steps", async () => {
    apiGet.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 1,
            title: "Heat stress warning",
            severity: "INFO",
            status: "OPEN",
            triggeredAt: "2026-03-10T11:11:00Z",
            contextNote: "Temp: 33.8C | Humidity: 28%",
            adviceSteps: [],
          },
        ],
      },
    });

    const { getHealthEvents } = await import("./healthService");
    const result = await getHealthEvents();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 1,
      severity: "WARNING",
      status: "NEW",
      category: "HEAT_STRESS",
    });
    expect(result[0].adviceSteps.length).toBeGreaterThanOrEqual(3);
    expect(result[0].adviceSteps.join(" ").toLowerCase()).toContain("water");
  });

  it("adds demo preview alerts when the backend returns too few events", async () => {
    hasDemoAccountHintMock.mockReturnValue(true);
    apiGet.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 1,
            title: "Heat stress warning",
            severity: "WARNING",
            status: "NEW",
            triggeredAt: "2026-03-10T11:11:00Z",
            contextNote: "Temp: 33.8C | Humidity: 28%",
          },
        ],
      },
    });

    const { getHealthEvents } = await import("./healthService");
    const result = await getHealthEvents();

    expect(result).toHaveLength(3);
    expect(result.filter((item) => item.readOnly)).toHaveLength(2);
    expect(result.some((item) => String(item.id).startsWith("demo-health-"))).toBe(true);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import apiClient from "../api/apiClient";
import {
  createCheckoutSession,
  downloadBillingInvoice,
  getBillingOverview,
  verifyCheckoutSession,
} from "./billingService";

function createStorage() {
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

describe("billingService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    apiClient.get.mockReset();
    apiClient.post.mockReset();

    const localStorage = createStorage();
    globalThis.window = {
      localStorage,
      dispatchEvent: vi.fn(),
      location: {
        origin: "https://app.example.com",
      },
    };
    globalThis.localStorage = localStorage;

    if (!globalThis.Event) {
      globalThis.Event = class Event {
        constructor(type) {
          this.type = type;
        }
      };
    }
  });

  it("falls back to the last saved billing snapshot when billing is offline", async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        data: {
          planId: "PRO",
          status: "ACTIVE",
          amount: 10000,
          currency: "NGN",
          interval: "MONTHLY",
          provider: "PAYSTACK",
        },
      },
      headers: {},
    });

    const liveResult = await getBillingOverview({ tenantId: 12, tenantPlan: "FREE" });
    expect(liveResult.source).toBe("api");
    expect(liveResult.billing.planId).toBe("PRO");

    apiClient.get.mockRejectedValueOnce(new Error("Network Error"));

    const offlineResult = await getBillingOverview({ tenantId: 12, tenantPlan: "FREE" });
    expect(offlineResult.source).toBe("offline");
    expect(offlineResult.billing.planId).toBe("PRO");
    expect(offlineResult.billing.provider).toBe("PAYSTACK");
  });

  it("returns placeholder billing data when billing endpoints are not available yet", async () => {
    apiClient.get.mockRejectedValueOnce({
      response: {
        status: 404,
        data: {
          message: "Not found",
        },
      },
    });

    const result = await getBillingOverview({ tenantId: 7, tenantPlan: "FREE" });
    expect(result.source).toBe("placeholder");
    expect(result.billing.planId).toBe("FREE");
    expect(result.billing.amount).toBe(0);
  });

  it("simulates placeholder checkout verification and creates a local invoice", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1710000000000);
    vi.spyOn(Math, "random").mockReturnValue(0.123456);

    apiClient.post.mockRejectedValueOnce({
      response: {
        status: 404,
        data: {
          message: "Not found",
        },
      },
    });

    const checkout = await createCheckoutSession({
      tenantId: 22,
      planId: "PRO",
      billingInterval: "ANNUAL",
      successUrl: "https://app.example.com/billing",
      customerEmail: "owner@farm.test",
    });

    expect(checkout.mode).toBe("placeholder");
    expect(checkout.checkoutUrl).toContain("paymentStatus=success");
    expect(checkout.checkoutUrl).toContain(`reference=${encodeURIComponent(checkout.reference)}`);
    expect(checkout.checkoutUrl).toContain("interval=ANNUAL");

    apiClient.post.mockRejectedValueOnce({
      response: {
        status: 404,
        data: {
          message: "Not found",
        },
      },
    });

    const verified = await verifyCheckoutSession({
      tenantId: 22,
      reference: checkout.reference,
      planId: "PRO",
      billingInterval: "ANNUAL",
    });

    expect(verified.mode).toBe("placeholder");
    expect(verified.billing.planId).toBe("PRO");
    expect(verified.billing.provider).toBe("TEST MODE");
    expect(verified.billing.interval).toBe("ANNUAL");
    expect(verified.billing.amount).toBe(90000);
    expect(verified.invoice.reference).toBe(checkout.reference);

    const overrides = JSON.parse(
      globalThis.window.localStorage.getItem("kf-placeholder-tenant-plan-overrides"),
    );
    expect(overrides["22"]).toBe("PRO");
  });

  it("sends the selected billing interval and omits blank billing emails", async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        data: {
          checkoutUrl: "https://paystack.test/checkout",
          reference: "CHK-123",
          provider: "PAYSTACK",
          amount: 90000,
          currency: "NGN",
          billingInterval: "ANNUAL",
        },
      },
    });

    const result = await createCheckoutSession({
      tenantId: 12,
      planId: "PRO",
      billingInterval: "ANNUAL",
      successUrl: "https://app.example.com/billing",
      cancelUrl: "https://app.example.com/billing?paymentStatus=cancelled",
      customerEmail: "   ",
    });

    expect(result.interval).toBe("ANNUAL");
    expect(apiClient.post).toHaveBeenCalledWith(
      "/billing/checkout/session",
      expect.objectContaining({
        planId: "PRO",
        billingInterval: "ANNUAL",
      }),
      expect.any(Object),
    );
    expect(apiClient.post.mock.calls[0][1]).not.toHaveProperty("customerEmail");
  });

  it("generates a local text receipt for placeholder invoices", async () => {
    const result = await downloadBillingInvoice({
      id: "INV-123",
      reference: "TEST-123",
      amount: 10000,
      currency: "NGN",
      description: "PRO subscription payment",
      mode: "placeholder",
    });

    expect(result.mode).toBe("placeholder");
    expect(result.filename).toBe("invoice-INV-123.txt");
    await expect(result.blob.text()).resolves.toContain("KFarms Billing Receipt");
  });
});

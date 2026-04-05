import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDisplayPlanById,
  readPlanPromoSettings,
} from "./planPricing";
import {
  readPlatformControlSettings,
  subscribePlatformControlSettings,
  writePlatformControlSettings,
} from "./platformControlStore";

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

function createWindowMock() {
  const listeners = new Map();
  const localStorage = createStorage();

  return {
    localStorage,
    addEventListener(type, listener) {
      const next = listeners.get(type) || new Set();
      next.add(listener);
      listeners.set(type, next);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    dispatchEvent(event) {
      listeners.get(event.type)?.forEach((listener) => listener(event));
      return true;
    },
  };
}

describe("planPricing", () => {
  beforeEach(() => {
    const windowMock = createWindowMock();
    globalThis.window = windowMock;
    globalThis.localStorage = windowMock.localStorage;

    if (!globalThis.Event) {
      globalThis.Event = class Event {
        constructor(type) {
          this.type = type;
        }
      };
    }
  });

  it("reads a temporary discount from shared platform controls", () => {
    writePlatformControlSettings({
      promotions: {
        kfarms: {
          enabled: true,
          planId: "PRO",
          type: "discount",
          discountPrice: "7000",
          durationDays: "90",
        },
      },
    });

    expect(readPlatformControlSettings()).toMatchObject({
      promotions: {
        kfarms: {
          enabled: true,
          planId: "PRO",
          type: "discount",
          discountPrice: "7000",
          durationDays: "90",
        },
      },
    });

    expect(readPlanPromoSettings()).toMatchObject({
      enabled: true,
      planId: "PRO",
      type: "discount",
      discountPrice: "7000",
      durationDays: "90",
    });

    const plan = getDisplayPlanById("PRO");
    expect(plan.compareAtPriceLabel).toBe("NGN 10,000");
    expect(plan.priceLabel).toBe("NGN 7,000");
    expect(plan.cycleLabel).toBe("intro price per month");
    expect(plan.promoNote).toBe("Regular price returns after 90 days");
  });

  it("switches the Pro card into a free trial offer", () => {
    writePlatformControlSettings({
      promotions: {
        kfarms: {
          enabled: true,
          planId: "PRO",
          type: "trial",
          trialMonths: "1",
        },
      },
    });

    const plan = getDisplayPlanById("PRO");
    expect(plan.compareAtPriceLabel).toBe("NGN 10,000");
    expect(plan.priceLabel).toBe("Free");
    expect(plan.cycleLabel).toBe("1-month free trial");
    expect(plan.promoNote).toBe("Then NGN 10,000 per month");
  });

  it("notifies shared subscribers when the platform controls change", () => {
    const listener = vi.fn();
    const unsubscribe = subscribePlatformControlSettings(listener);

    writePlatformControlSettings({
      promotions: {
        kfarms: {
          enabled: true,
          planId: "PRO",
          type: "discount",
          discountPrice: "7000",
        },
      },
    });

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("ignores promos staged for other apps when rendering KFarms pricing", () => {
    writePlatformControlSettings({
      promotions: {
        "property-rent-management": {
          enabled: true,
          planId: "PRO",
          type: "discount",
          discountPrice: "3000",
        },
      },
    });

    const plan = getDisplayPlanById("PRO");
    expect(plan.compareAtPriceLabel).toBe("NGN 10,000");
    expect(plan.priceLabel).toBe("NGN 7,000");
  });
});

import { describe, expect, it } from "vitest";
import {
  formatCompactCurrencyValue,
  formatCurrencyValue,
  replaceCurrencyCodeWithSymbol,
} from "./formatters";

describe("formatters currency display", () => {
  it("replaces NGN with the naira symbol in display text", () => {
    expect(replaceCurrencyCodeWithSymbol("NGN 12,500")).toBe("₦12,500");
    expect(replaceCurrencyCodeWithSymbol("Value: NGN 5,000")).toBe("Value: ₦5,000");
  });

  it("formats full NGN currency values with the naira symbol", () => {
    expect(formatCurrencyValue(12500, "NGN")).toContain("₦");
  });

  it("formats compact NGN currency values with the naira symbol", () => {
    expect(formatCompactCurrencyValue(1250000, "NGN")).toBe("₦1.3M");
  });
});

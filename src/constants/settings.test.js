import { describe, expect, it } from "vitest";
import {
  DEFAULT_ORGANIZATION_SETTINGS,
  normalizeOrganizationSettings,
} from "./settings";

describe("normalizeOrganizationSettings", () => {
  it("preserves the critical sms toggle when enabled", () => {
    expect(
      normalizeOrganizationSettings({
        criticalSmsAlertsEnabled: true,
      }).criticalSmsAlertsEnabled,
    ).toBe(true);
  });

  it("falls back to the default critical sms toggle when missing", () => {
    expect(normalizeOrganizationSettings({}).criticalSmsAlertsEnabled).toBe(
      DEFAULT_ORGANIZATION_SETTINGS.criticalSmsAlertsEnabled,
    );
  });
});

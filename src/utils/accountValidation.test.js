import { describe, expect, it } from "vitest";
import {
  ACCOUNT_PASSWORD_MIN_LENGTH,
  getAccountPasswordChecks,
  looksLikeEmail,
  looksLikePhoneNumber,
  normalizePhoneNumber,
  validateAccountPassword,
} from "./accountValidation";

describe("accountValidation", () => {
  it("accepts clean email addresses", () => {
    expect(looksLikeEmail("ops@kfarms.app")).toBe(true);
    expect(looksLikeEmail("bad-email")).toBe(false);
  });

  it("normalizes phone numbers while preserving a leading plus", () => {
    expect(normalizePhoneNumber("+234 803-000-1234")).toBe("+2348030001234");
    expect(normalizePhoneNumber("(0803) 000 1234")).toBe("08030001234");
  });

  it("validates realistic phone numbers", () => {
    expect(looksLikePhoneNumber("+2348030001234")).toBe(true);
    expect(looksLikePhoneNumber("123")).toBe(false);
  });

  it("requires a password with letters and numbers", () => {
    expect(validateAccountPassword("abc12", ACCOUNT_PASSWORD_MIN_LENGTH)).toContain("at least");
    expect(validateAccountPassword("abcdef", ACCOUNT_PASSWORD_MIN_LENGTH)).toContain(
      "letter and one number",
    );
    expect(validateAccountPassword("farm123", ACCOUNT_PASSWORD_MIN_LENGTH)).toBe("");
  });

  it("returns live password requirement flags", () => {
    expect(getAccountPasswordChecks("farm1", ACCOUNT_PASSWORD_MIN_LENGTH)).toEqual({
      minimumLength: ACCOUNT_PASSWORD_MIN_LENGTH,
      hasMinimumLength: false,
      hasLetter: true,
      hasNumber: true,
    });

    expect(getAccountPasswordChecks("farm123", ACCOUNT_PASSWORD_MIN_LENGTH)).toEqual({
      minimumLength: ACCOUNT_PASSWORD_MIN_LENGTH,
      hasMinimumLength: true,
      hasLetter: true,
      hasNumber: true,
    });
  });
});

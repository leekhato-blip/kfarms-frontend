import { describe, expect, it } from "vitest";
import { normalizeContactVerificationState } from "./contactVerification";

describe("normalizeContactVerificationState", () => {
  it("does not require phone verification when no phone is present", () => {
    expect(
      normalizeContactVerificationState({
        email: "farmer@example.com",
        emailVerified: false,
        phoneVerified: false,
      }),
    ).toMatchObject({
      hasPhoneNumber: false,
      phoneVerified: false,
      requiresPhoneVerification: false,
      verificationRequired: true,
    });
  });

  it("requires phone verification when a phone number is present but not verified", () => {
    expect(
      normalizeContactVerificationState({
        emailVerified: true,
        maskedPhoneNumber: "+234••••1234",
        phoneVerified: false,
      }),
    ).toMatchObject({
      hasPhoneNumber: true,
      phoneVerified: false,
      requiresPhoneVerification: true,
      verificationRequired: true,
    });
  });

  it("detects preview mode from available verification codes", () => {
    expect(
      normalizeContactVerificationState({
        preview: {
          emailCode: "123456",
        },
      }),
    ).toMatchObject({
      previewMode: true,
    });
  });
});

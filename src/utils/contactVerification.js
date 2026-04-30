export function hasVerificationPreview(preview) {
  return Boolean(
    preview &&
      typeof preview === "object" &&
      (preview.emailCode || preview.phoneCode),
  );
}

export function normalizeContactVerificationState(payload = {}) {
  const source = payload && typeof payload === "object" ? payload : {};
  const preview = source.preview && typeof source.preview === "object" ? source.preview : null;
  const phoneNumber = String(source.phoneNumber || "").trim();
  const maskedPhoneNumber = String(source.maskedPhoneNumber || "").trim();
  const hasPhoneNumber = source.hasPhoneNumber ?? Boolean(phoneNumber || maskedPhoneNumber);
  const emailVerified = Boolean(source.emailVerified);
  const phoneVerified = Boolean(hasPhoneNumber && source.phoneVerified);
  const requiresPhoneVerification = Boolean(
    source.requiresPhoneVerification ?? (hasPhoneNumber && !phoneVerified),
  );

  return {
    email: String(source.email || "").trim(),
    phoneNumber,
    hasPhoneNumber: Boolean(hasPhoneNumber),
    maskedEmail: String(source.maskedEmail || "").trim(),
    maskedPhoneNumber,
    emailVerified,
    phoneVerified,
    requiresPhoneVerification,
    verificationRequired: Boolean(
      source.verificationRequired ?? (!emailVerified || requiresPhoneVerification),
    ),
    preview,
    previewMode: Boolean(source.previewMode ?? hasVerificationPreview(preview)),
  };
}

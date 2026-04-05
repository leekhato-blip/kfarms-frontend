export const authTrustTextByPage = {
  login: "Protected by encryption • Trusted by teams.",
  signup: "Protected by encryption • Trusted by teams.",
  forgot: "Protected by encryption • Trusted by teams.",
  reset: "Protected by encryption • Trusted by teams.",
  default: "Protected by encryption • Trusted by teams.",
};

export const getAuthTrustText = (key) =>
  authTrustTextByPage[key] || authTrustTextByPage.default;

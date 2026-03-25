import api from "../api/apiClient";
import { normalizeEmail, normalizePhoneNumber } from "../utils/accountValidation";
import {
  clearOfflineAuthBootstrap,
  primeCachedApiResponse,
} from "../offline/offlineStore";

/**
 * login (payload) -> POST /auth/login
 * logout () -> POST /auth/logout
 * me () -> GET /auth/me
 *
 * These functions return response data for easy consumption in pages/hooks.
 */

export async function login({ identifier, password }) {
  // identifier may be email or username
  const body = { emailOrUsername: identifier, password };
  const res = await api.post("/auth/login", body);
  const payload = res.data?.data ?? res.data;
  const user = payload?.user ?? payload;
  if (user) {
    primeCachedApiResponse({
      path: "/api/auth/me",
      data: {
        success: true,
        message: "OK",
        data: user,
      },
    });
  }
  return payload;
}

export async function logout() {
  const res = await api.post("/auth/logout");
  clearOfflineAuthBootstrap();
  return res.data?.data ?? res.data;
}

export async function me() {
  const res = await api.get("/auth/me", { skipAuthInvalid: true });
  return res.data?.data ?? res.data;
}

export async function signUser({ email, username, password, phoneNumber }) {
  const body = {
    email: normalizeEmail(email),
    username,
    password,
    phoneNumber: normalizePhoneNumber(phoneNumber),
  };
  const res = await api.post("/auth/signup", body);
  return res.data;
}

export async function verifyContact({ email, emailCode, phoneCode }) {
  const res = await api.post("/auth/verify-contact", {
    email: normalizeEmail(email),
    emailCode,
    phoneCode,
  });
  return res.data;
}

export async function resendContactVerification({ email, channel }) {
  const res = await api.post("/auth/resend-contact-verification", {
    email: normalizeEmail(email),
    channel,
  });
  return res.data;
}

export async function forgotPassword({ email }) {
  const body = { email };
  const res = await api.post("/auth/forgot-password", body);
  return res.data;
}

export async function resetPassword({ token, newPassword }) {
  const body = { token, newPassword };
  const res = await api.post("/auth/reset-password", body);
  return res.data;
}

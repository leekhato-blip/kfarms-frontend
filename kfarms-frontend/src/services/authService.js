import api from "./axios";

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
  return res.data?.data ?? res.data;
}

export async function logout() {
  const res = await api.post("/auth/logout");
  return res.data?.data ?? res.data;
}

export async function me() {
  const res = await api.get("/auth/me", { skipAuthInvalid: true });
  return res.data?.data ?? res.data;
}

export async function signUser({ email, username, password }) {
  const body = { email, username, password };
  const res = await api.post("/auth/signup", body);
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

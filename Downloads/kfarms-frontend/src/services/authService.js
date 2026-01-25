import api from "./axios";

/**
 * login (payload) -> POST /auth/login 
 * signup (payload) -> POST /auth/signup 
 * 
 * These functions return the axios response (so the pages can read data/message).
 */

export async function loginUser({ identifier, password }) {
    // identifier may be email or username
    const body = {emailOrUsername: identifier, password};
    const res = await api.post("/auth/login", body);
    return res.data.data;
}

export async function signUser({email, username, password}) {
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
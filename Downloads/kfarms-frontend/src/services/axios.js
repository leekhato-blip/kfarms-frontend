import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

/**
 * Create base axios instance. Simple and exports helper to set token
 */
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Attach token automatically if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kf_token");
  if (token && !(config.url || "").includes("/auth/")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

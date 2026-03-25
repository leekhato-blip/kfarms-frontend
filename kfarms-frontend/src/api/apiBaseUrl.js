const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);
const LOCAL_PROXY_PORTS = new Set(["5173", "5174"]);

export function getDefaultApiBaseUrl(windowLike = globalThis?.window) {
  const hostname = windowLike?.location?.hostname;
  const port = `${windowLike?.location?.port || ""}`;
  if (hostname && LOCAL_HOSTNAMES.has(hostname)) {
    if (LOCAL_PROXY_PORTS.has(port)) {
      return "/api";
    }
    return "http://localhost:8080/api";
  }
  return "/api";
}

export function resolveApiBaseUrl(envValue, windowLike = globalThis?.window) {
  const explicitBaseUrl = `${envValue || ""}`.trim();
  const baseUrl = explicitBaseUrl || getDefaultApiBaseUrl(windowLike);
  return baseUrl.replace(/\/+$/, "");
}

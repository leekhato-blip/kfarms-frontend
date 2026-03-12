import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogIn, Moon, ShieldCheck, Sun } from "lucide-react";
import {
  AUTH_LOGIN_FALLBACK_URL,
  AUTH_LOGIN_IDENTIFIER_KEY,
  AUTH_LOGIN_URL,
  HAS_CUSTOM_AUTH_LOGIN_URL,
} from "../../api/endpoints";
import {
  PLATFORM_FLASH_KEY,
  getApiErrorMessage,
  platformAxios,
  unwrapApiResponse,
} from "../../api/platformClient";
import { usePlatformAuth } from "../../auth/AuthProvider";
import { ToastProvider, useToast } from "../../components/ToastProvider";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { readTokenFromPayload } from "../../utils/formatters";
import { useTheme } from "../../hooks/useTheme";
import rootsLogo from "../../assets/roots-logo.png";

async function loginWithEndpoint(endpoint, identifier, password) {
  const identifierKeys = Array.from(
    new Set([AUTH_LOGIN_IDENTIFIER_KEY, "emailOrUsername", "username", "email"].filter(Boolean)),
  );
  let lastError;

  for (let index = 0; index < identifierKeys.length; index += 1) {
    const key = identifierKeys[index];
    const isLast = index === identifierKeys.length - 1;

    try {
      const payload = {
        [key]: identifier,
        password,
      };

      const response = await platformAxios.post(endpoint, payload, {
        skipPlatformAuthHandling: true,
      });

      const data = unwrapApiResponse(response.data, "Login failed");
      const token = readTokenFromPayload(data) || readTokenFromPayload(response.data);

      if (!token) {
        throw new Error("Login succeeded but token is missing in response payload.");
      }

      return {
        token,
        message: response?.data?.message || "Login successful",
      };
    } catch (error) {
      lastError = error;
      const message = getApiErrorMessage(error, "").toLowerCase();
      const shouldTryNextKey =
        !isLast &&
        (message.includes("unrecognized field") ||
          message.includes("unknown property") ||
          message.includes("cannot deserialize"));

      if (!shouldTryNextKey) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Unable to sign in.");
}

function shouldTryFallbackEndpoint(error) {
  const status = error?.response?.status;
  const message = getApiErrorMessage(error, "").toLowerCase();

  if (status === 404 || status === 405) return true;
  if (status === 400 && message.includes("x-tenant-id")) return true;

  return false;
}

function PlatformLoginContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useToast();
  const { isAuthenticated, login } = usePlatformAuth();
  const { isDark, toggleTheme } = useTheme();

  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [inlineError, setInlineError] = React.useState("");

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/platform", { replace: true });
      return;
    }

    const flashMessage = window.localStorage.getItem(PLATFORM_FLASH_KEY);
    if (flashMessage) {
      notify(flashMessage, "info");
      window.localStorage.removeItem(PLATFORM_FLASH_KEY);
    }
  }, [isAuthenticated, navigate, notify]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setInlineError("");
    setLoading(true);

    try {
      const endpoints = Array.from(new Set([AUTH_LOGIN_URL, AUTH_LOGIN_FALLBACK_URL].filter(Boolean)));
      let result;
      let lastError;

      for (let index = 0; index < endpoints.length; index += 1) {
        const endpoint = endpoints[index];
        const isLast = index === endpoints.length - 1;

        try {
          result = await loginWithEndpoint(endpoint, identifier, password);
          break;
        } catch (error) {
          lastError = error;
          const canFallback = !HAS_CUSTOM_AUTH_LOGIN_URL && !isLast && shouldTryFallbackEndpoint(error);

          if (!canFallback) {
            throw error;
          }
        }
      }

      if (!result) {
        throw lastError || new Error("Unable to sign in.");
      }

      login(result.token);
      notify(result.message || "Welcome back", "success");

      const from = location.state?.from;
      navigate(from || "/platform", { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to sign in.");
      setInlineError(message);
      notify(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="atlas-theme atlas-root-network min-h-screen px-4 py-10">
      <div className="mx-auto flex max-w-md flex-col">
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)] p-2 text-[var(--atlas-text)] hover:bg-[color:var(--atlas-surface-hover)]"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <Card className="rounded-2xl border-[color:var(--atlas-border-strong)] p-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-300" />
            <img src={rootsLogo} alt="ROOTS" className="h-3.5 w-3.5 object-contain" />
            Platform
          </div>

          <h1 className="mt-4 text-2xl font-bold text-[var(--atlas-text-strong)]">Platform Control Plane</h1>
          <p className="mt-1 text-sm text-[var(--atlas-muted)]">Sign in with platform admin credentials.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-[var(--atlas-text)]">Email or Username</label>
              <input
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="h-11 w-full rounded-md border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] px-3 text-sm text-[var(--atlas-text-strong)] outline-none transition placeholder:text-[var(--atlas-muted-soft)] focus:border-blue-400/50"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-[var(--atlas-text)]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full rounded-md border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] px-3 text-sm text-[var(--atlas-text-strong)] outline-none transition placeholder:text-[var(--atlas-muted-soft)] focus:border-blue-400/50"
                autoComplete="current-password"
                required
              />
            </div>

            {inlineError && (
              <div className="rounded-md border border-violet-300/60 bg-violet-50 px-3 py-2 text-sm text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/20 dark:text-violet-100">
                {inlineError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn size={15} />
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function PlatformLoginPage() {
  return (
    <ToastProvider>
      <PlatformLoginContent />
    </ToastProvider>
  );
}

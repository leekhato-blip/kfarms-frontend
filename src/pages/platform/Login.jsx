import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
<<<<<<< HEAD
import { Eye, EyeOff, LogIn, Monitor, Moon, Sun } from "lucide-react";
=======
import { LogIn, Moon, ShieldCheck, Sun } from "lucide-react";
>>>>>>> 0babf4d (Update frontend application)
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
<<<<<<< HEAD
import { isBackendUnavailableError, waitForBackendConnection } from "../../api/apiClient";
=======
>>>>>>> 0babf4d (Update frontend application)
import { usePlatformAuth } from "../../auth/AuthProvider";
import { ToastProvider, useToast } from "../../components/ToastProvider";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { readTokenFromPayload } from "../../utils/formatters";
import { useTheme } from "../../hooks/useTheme";
<<<<<<< HEAD
import { formatThemePreferenceLabel, THEME_SCOPES } from "../../constants/settings";
import rootsLogo from "../../assets/roots-logo-trimmed.png";
=======
import rootsLogo from "../../assets/roots-logo.png";
>>>>>>> 0babf4d (Update frontend application)

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
<<<<<<< HEAD
  if (isBackendUnavailableError(error)) return false;

=======
>>>>>>> 0babf4d (Update frontend application)
  const status = error?.response?.status;
  const message = getApiErrorMessage(error, "").toLowerCase();

  if (status === 404 || status === 405) return true;
  if (status === 400 && message.includes("x-tenant-id")) return true;

  return false;
}

<<<<<<< HEAD
function resolveFriendlyLoginError(error) {
  if (isBackendUnavailableError(error)) {
    return "Platform services are still waking up or temporarily unavailable. Try again shortly.";
  }

  const status = Number(error?.response?.status || 0);
  const rawMessage = getApiErrorMessage(error, "").trim();
  const normalized = rawMessage.toLowerCase();

  if (status === 401 || status === 403 || normalized.includes("bad credentials")) {
    return "That sign-in did not work. Check your email or username and password, then try again.";
  }

  if (normalized.includes("disabled")) {
    return "This account is currently disabled. Please contact a platform admin.";
  }

  if (status === 429) {
    return "Too many sign-in attempts. Please wait a moment, then try again.";
  }

  if (status === 404 || status === 405) {
    return "Platform sign-in is temporarily unavailable. Refresh the page and try again.";
  }

  if (status >= 500) {
    return "We could not sign you in right now. Please try again in a moment.";
  }

  if (rawMessage && !/^request failed with status code/i.test(rawMessage)) {
    return rawMessage;
  }

  return "We could not sign you in right now. Please try again.";
}
=======
>>>>>>> 0babf4d (Update frontend application)
function PlatformLoginContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useToast();
<<<<<<< HEAD
  const { isAuthenticated, canAccessPlatform, login, logout, profileLoading } = usePlatformAuth();
  const { theme, isDark, toggleTheme } = useTheme(THEME_SCOPES.PLATFORM);
  const themeLabel = formatThemePreferenceLabel(theme);

  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [inlineError, setInlineError] = React.useState("");
  const deniedSessionRef = React.useRef(false);

  React.useEffect(() => {
    if (isAuthenticated && !profileLoading && canAccessPlatform) {
      deniedSessionRef.current = false;
=======
  const { isAuthenticated, login } = usePlatformAuth();
  const { isDark, toggleTheme } = useTheme();

  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [inlineError, setInlineError] = React.useState("");

  React.useEffect(() => {
    if (isAuthenticated) {
>>>>>>> 0babf4d (Update frontend application)
      navigate("/platform", { replace: true });
      return;
    }

<<<<<<< HEAD
      if (isAuthenticated && !profileLoading && !canAccessPlatform) {
      if (!deniedSessionRef.current) {
        const message =
          "This account can sign in, but platform access is not enabled here yet.";
        deniedSessionRef.current = true;
        setInlineError(message);
        notify(message, "error", 3000);
      }
      logout();
      return;
    }

    deniedSessionRef.current = false;
  }, [
    canAccessPlatform,
    isAuthenticated,
    location.state?.from,
    logout,
    navigate,
    notify,
    profileLoading,
  ]);

  React.useEffect(() => {
=======
>>>>>>> 0babf4d (Update frontend application)
    const flashMessage = window.localStorage.getItem(PLATFORM_FLASH_KEY);
    if (flashMessage) {
      notify(flashMessage, "info");
      window.localStorage.removeItem(PLATFORM_FLASH_KEY);
    }
<<<<<<< HEAD
  }, [notify]);

  React.useEffect(() => {
    if (!inlineError) return undefined;

    const timer = window.setTimeout(() => {
      setInlineError("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [inlineError]);

  React.useEffect(() => {
    void waitForBackendConnection({
      timeoutMs: 90000,
      intervalMs: 2500,
      silent: true,
    });
  }, []);
=======
  }, [isAuthenticated, navigate, notify]);
>>>>>>> 0babf4d (Update frontend application)

  const handleSubmit = async (event) => {
    event.preventDefault();
    setInlineError("");
    setLoading(true);

    try {
<<<<<<< HEAD
      const backendReady = await waitForBackendConnection({
        timeoutMs: 90000,
        intervalMs: 2500,
        silent: false,
      });

      if (!backendReady) {
        const message = "Platform services are still waking up. Please try again in a moment.";
        setInlineError(message);
        notify(message, "error", 3000);
        return;
      }

=======
>>>>>>> 0babf4d (Update frontend application)
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
<<<<<<< HEAD
      const message = resolveFriendlyLoginError(error);
      setInlineError(message);
      notify(message, "error", 3000);
=======
      const message = getApiErrorMessage(error, "Unable to sign in.");
      setInlineError(message);
      notify(message, "error");
>>>>>>> 0babf4d (Update frontend application)
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="atlas-theme atlas-root-network flex min-h-[100dvh] items-center justify-center px-4 py-4 sm:px-5 sm:py-6">
      <div className="w-full max-w-[27rem]">
        <Card className="atlas-stage-card rounded-[1.75rem] border-[color:var(--atlas-border-strong)] px-5 py-5 sm:px-6 sm:py-6">
          <div className="relative z-10">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={toggleTheme}
                className="shrink-0 rounded-xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)]/88 p-2 text-[var(--atlas-text)] transition hover:bg-[color:var(--atlas-surface-hover)]"
                aria-label={`Theme: ${themeLabel}. Click to cycle theme.`}
                title={`Theme: ${themeLabel}`}
              >
                {theme === "system" ? <Monitor size={16} /> : isDark ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </div>

            <div className="mt-2 text-center">
              <img
                src={rootsLogo}
                alt="ROOTS"
                className="mx-auto w-[10.75rem] max-w-full object-contain sm:w-[12.25rem]"
              />
              <h1 className="mt-3 font-header text-[1.45rem] font-semibold leading-tight tracking-tight text-[var(--atlas-text-strong)] sm:text-[1.6rem]">
                Platform login
              </h1>
            </div>

            <p className="mt-3 text-center text-sm leading-6 text-[var(--atlas-muted)]">
              Use your email or username to continue.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--atlas-text)]">
                  Email or Username
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] px-4 text-sm text-[var(--atlas-text-strong)] outline-none transition placeholder:text-[var(--atlas-muted-soft)] focus:border-violet-400/50"
                  autoComplete="username"
                  placeholder="Email or username"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--atlas-text)]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 w-full rounded-2xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] px-4 pr-20 text-sm text-[var(--atlas-text-strong)] outline-none transition placeholder:text-[var(--atlas-muted-soft)] focus:border-violet-400/50"
                    autoComplete="current-password"
                    placeholder="Password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-3 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--atlas-muted)] transition hover:text-[var(--atlas-text-strong)]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <>
                        <EyeOff size={16} />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye size={16} />
                        <span>Show</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {inlineError && (
                <div className="rounded-2xl border border-violet-300/60 bg-violet-50 px-3 py-2.5 text-sm text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/20 dark:text-violet-100">
                  {inlineError}
                </div>
              )}

              <Button type="submit" className="w-full !rounded-2xl" disabled={loading}>
                <LogIn size={15} />
                {loading ? "Signing in..." : "Sign in"}
              </Button>

              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/70 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#16a34a] dark:text-[#4ade80]">
                    Protected access
                  </p>
                  <p className="mt-1 text-xs text-[var(--atlas-muted)]">
                    Sign in with your ROOTS account to continue securely to the platform.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[#16a34a] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(22,163,74,0.22)]">
                  Secure sign-in
                </span>
              </div>
            </form>
          </div>
=======
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
>>>>>>> 0babf4d (Update frontend application)
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

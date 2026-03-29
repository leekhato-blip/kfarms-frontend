import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, Moon, ShieldCheck, Sun } from "lucide-react";
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
import {
  canUsePlatformDevSession,
  createPlatformDevToken,
  findPlatformDemoUser,
  writePlatformDevSession,
} from "../../auth/platformDevSession";
import { isBackendUnavailableError, waitForBackendConnection } from "../../api/apiClient";
import { usePlatformAuth } from "../../auth/AuthProvider";
import { ToastProvider, useToast } from "../../components/ToastProvider";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { readTokenFromPayload } from "../../utils/formatters";
import { useTheme } from "../../hooks/useTheme";
import { writePlatformDataMode } from "./platformWorkbench";
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
  if (isBackendUnavailableError(error)) return false;

  const status = error?.response?.status;
  const message = getApiErrorMessage(error, "").toLowerCase();

  if (status === 404 || status === 405) return true;
  if (status === 400 && message.includes("x-tenant-id")) return true;

  return false;
}

function resolveFriendlyLoginError(error) {
  if (isBackendUnavailableError(error)) {
    return "ROOTS services are still waking up or temporarily unavailable. Try again shortly, or open the demo while Render comes back online.";
  }

  const status = Number(error?.response?.status || 0);
  const rawMessage = getApiErrorMessage(error, "").trim();
  const normalized = rawMessage.toLowerCase();

  if (status === 401 || status === 403 || normalized.includes("bad credentials")) {
    return "That sign-in did not work. Check your email or username and password, then try again.";
  }

  if (normalized.includes("disabled")) {
    return "This ROOTS account is currently disabled. Please contact a ROOTS admin.";
  }

  if (status === 429) {
    return "Too many sign-in attempts. Please wait a moment, then try again.";
  }

  if (status === 404 || status === 405) {
    return "ROOTS sign-in is temporarily unavailable. Refresh the page and try again.";
  }

  if (status >= 500) {
    return "We could not sign you in right now. Please try again in a moment.";
  }

  if (rawMessage && !/^request failed with status code/i.test(rawMessage)) {
    return rawMessage;
  }

  return "We could not sign you in right now. Please try again.";
}

function shouldUseDevPlatformLoginFallback(error) {
  if (!canUsePlatformDevSession()) return false;
  return isBackendUnavailableError(error);
}

function activatePlatformDemoAccess({ demoUser, from, login, navigate, notify }) {
  if (!demoUser) return false;

  writePlatformDevSession(demoUser);
  writePlatformDataMode("demo");
  login(createPlatformDevToken(demoUser));
  notify(`Signed in as ${demoUser.username || demoUser.email}`, "success");
  navigate(from || "/platform", { replace: true });
  return true;
}

function PlatformLoginContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useToast();
  const { isAuthenticated, canAccessPlatform, login, logout, profileLoading } = usePlatformAuth();
  const { isDark, toggleTheme } = useTheme();

  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [inlineError, setInlineError] = React.useState("");
  const deniedSessionRef = React.useRef(false);
  const demoAccessEnabled = canUsePlatformDevSession();
  const defaultDemoUser = React.useMemo(
    () => findPlatformDemoUser("kato") || findPlatformDemoUser("leekhato@gmail.com"),
    [],
  );

  React.useEffect(() => {
    if (isAuthenticated && !profileLoading && canAccessPlatform) {
      deniedSessionRef.current = false;
      navigate("/platform", { replace: true });
      return;
    }

    if (isAuthenticated && !profileLoading && !canAccessPlatform) {
      if (!deniedSessionRef.current) {
        const message =
          "This account can sign in, but it does not have ROOTS platform access here yet.";
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
    const flashMessage = window.localStorage.getItem(PLATFORM_FLASH_KEY);
    if (flashMessage) {
      notify(flashMessage, "info");
      window.localStorage.removeItem(PLATFORM_FLASH_KEY);
    }
  }, [notify]);

  React.useEffect(() => {
    if (!inlineError) return undefined;

    const timer = window.setTimeout(() => {
      setInlineError("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [inlineError]);

  const handleOpenDemo = React.useCallback(() => {
    if (!demoAccessEnabled || !defaultDemoUser) return;

    setInlineError("");
    setIdentifier(defaultDemoUser.username || defaultDemoUser.email || "kato");
    setPassword("");
    activatePlatformDemoAccess({
      demoUser: defaultDemoUser,
      from: location.state?.from,
      login,
      navigate,
      notify,
    });
  }, [defaultDemoUser, demoAccessEnabled, location.state?.from, login, navigate, notify]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setInlineError("");
    setLoading(true);

    try {
      const matchedDemoUser = demoAccessEnabled ? findPlatformDemoUser(identifier) : null;
      const backendReady = await waitForBackendConnection({
        timeoutMs: matchedDemoUser ? 15000 : 90000,
        intervalMs: 5000,
        silent: false,
      });

      if (!backendReady) {
        if (
          matchedDemoUser &&
          activatePlatformDemoAccess({
            demoUser: matchedDemoUser,
            from: location.state?.from,
            login,
            navigate,
            notify,
          })
        ) {
          return;
        }

        const message = demoAccessEnabled
          ? "ROOTS services are still waking up. Try again shortly, or open the demo while Render comes back online."
          : "ROOTS services are still waking up. Please try again in a moment.";
        setInlineError(message);
        notify(message, "error", 3000);
        return;
      }

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
      if (shouldUseDevPlatformLoginFallback(error)) {
        const demoUser = findPlatformDemoUser(identifier);

        if (
          activatePlatformDemoAccess({
            demoUser,
            from: location.state?.from,
            login,
            navigate,
            notify,
          })
        ) {
          setLoading(false);
          return;
        }
      }

      const message = resolveFriendlyLoginError(error);
      setInlineError(message);
      notify(message, "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="atlas-theme atlas-root-network min-h-screen px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="w-full max-w-[30rem]">
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)]/88 p-2 text-[var(--atlas-text)] transition hover:bg-[color:var(--atlas-surface-hover)]"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          <Card className="atlas-stage-card rounded-[2rem] border-[color:var(--atlas-border-strong)] px-6 py-7 md:px-8 md:py-9">
            <div className="relative z-10">
              <div className="text-center">
                <div className="mx-auto inline-flex rounded-full border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--atlas-muted)]">
                  <ShieldCheck size={14} className="mr-2 text-violet-600 dark:text-violet-300" />
                  ROOTS Platform
                </div>

                <div className="mx-auto mt-6 flex h-28 w-28 items-center justify-center rounded-[2rem] border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface-soft)]/85 shadow-[0_18px_48px_rgba(15,23,42,0.18)]">
                  <img src={rootsLogo} alt="ROOTS" className="h-20 w-20 object-contain" />
                </div>

                <div className="mt-6">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--atlas-muted)]">
                    ROOTS
                  </div>
                  <h1 className="mt-3 font-header text-4xl font-semibold tracking-tight text-[var(--atlas-text-strong)] md:text-[3rem]">
                    Enter the ROOTS control room
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-[var(--atlas-muted)]">
                    Sign in to run the network.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--atlas-text)]">
                    Email or Username
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] px-4 text-sm text-[var(--atlas-text-strong)] outline-none transition placeholder:text-[var(--atlas-muted-soft)] focus:border-violet-400/50"
                    autoComplete="username"
                    placeholder="Work email or username"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--atlas-text)]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-12 w-full rounded-2xl border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-input-bg)] px-4 pr-20 text-sm text-[var(--atlas-text-strong)] outline-none transition placeholder:text-[var(--atlas-muted-soft)] focus:border-violet-400/50"
                      autoComplete="current-password"
                      placeholder="Password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute inset-y-0 right-3 inline-flex items-center gap-1.5 justify-center text-xs font-semibold text-[var(--atlas-muted)] transition hover:text-[var(--atlas-text-strong)]"
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

                <Button type="submit" className="mt-2 w-full !rounded-2xl" disabled={loading}>
                  <LogIn size={15} />
                  {loading ? "Signing in..." : "Sign In"}
                </Button>

                {demoAccessEnabled && defaultDemoUser ? (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-3.5 py-2.5 text-left dark:border-emerald-400/20 dark:bg-emerald-500/10">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-200">
                      Render waking up? Open the demo instantly as{" "}
                      <span className="font-semibold">{defaultDemoUser.username || "kato"}</span>.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenDemo}
                      className="shrink-0 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                    >
                      Open demo
                    </button>
                  </div>
                ) : null}
              </form>

              <div className="mt-5 text-center text-xs uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                ROOTS platform access
              </div>
            </div>
          </Card>
        </div>
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

import React from "react";
import AuthCard from "../components/AuthCard";
import AuthWatermark from "../components/AuthWatermark";
import GlassToast from "../components/GlassToast";
import { useAuth } from "../hooks/useAuth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import FloatingInput from "../components/FloatingInput";
import PageLoader from "../components/PageLoader";
import { getAuthTrustText } from "../constants/authCopy";
import { useTenant } from "../tenant/TenantContext";
import { toKfarmsAppPath } from "../apps/kfarms/paths";
import {
  DEMO_ACCOUNT_EMAIL,
  DEMO_ACCOUNT_INFO,
  DEMO_ACCOUNT_PASSWORD,
  isDemoAccountUser,
} from "../auth/demoMode";
import kfarmsLogo from "../assets/Kfarms_logo.png";
import AuthThemeSwitcher from "../components/AuthThemeSwitcher";
import { writePendingContactVerification } from "../auth/contactVerificationStorage";
import { waitForBackendConnection } from "../api/apiClient";
import { normalizeContactVerificationState } from "../utils/contactVerification";

/**
 * Login page:
 * - displays inline errors (auto-hide after 3s)
 * - uses GlassToast for system messages (success or error)
 * - centers correctly using .app-full wrapper
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const postAuthRedirect =
    typeof location.state?.postAuthRedirect === "string"
      ? location.state.postAuthRedirect
      : "";
  const { login, loading: authLoading } = useAuth();
  const { refreshTenants, ensureActiveTenant, setActiveTenant, resetTenantState } = useTenant();
  const brandName = "KFarms";
  const brandLogo = kfarmsLogo;
  const brandPrimaryColor = "#2563EB";
  const brandAccentColor = "#10B981";
  const brandHeadline = "Welcome back";
  const brandMessage = "Sign in to keep operations moving";

  // form state
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [loginLoaderVisible, setLoginLoaderVisible] = React.useState(false);
  const [loaderLabel, setLoaderLabel] = React.useState("Signing you in...");
  const loaderStartRef = React.useRef(0);
  const loginSuccessRef = React.useRef(false);

  // message
  const [inlineError, setInlineError] = React.useState("");
  const [toast, setToast] = React.useState({ message: "", type: "info" });

  React.useEffect(() => {
    const prefilledIdentifier = location.state?.prefillIdentifier;
    const signupRecoveryMessage = location.state?.signupRecoveryMessage;
    const passwordResetMessage = location.state?.passwordResetMessage;

    if (prefilledIdentifier) {
      setIdentifier(String(prefilledIdentifier));
    }

    if (signupRecoveryMessage) {
      setToast({
        message: "Your account is ready. Please sign in to continue.",
        type: "info",
      });
    }

    if (passwordResetMessage) {
      setToast({
        message: "Password updated. Sign in with your new password.",
        type: "success",
      });
    }
  }, [location.state]);

  // auto-clear inline error after 3s
  React.useEffect(() => {
    if (!inlineError) return;
    const t = setTimeout(() => setInlineError(""), 3000);
    return () => clearTimeout(t);
  }, [inlineError]);

  React.useEffect(() => {
    void waitForBackendConnection({ silent: false, intervalMs: 2500 });
  }, []);

  const getLoginErrorMessage = (err) => {


    const status = err?.response?.status;
    const isNetwork =
      err?.message === "Network Error" ||
      err?.code === "ECONNABORTED" ||
      status === 502 ||
      status === 503 ||
      status === 504 ||
      !err?.response;

    if (isNetwork) {
      return "The server is still waking up on free hosting. Please wait a moment and try again.";
    }

    if (status === 401 || status === 400) {
      return "Invalid email/username or password. Please try again.";
    }

    return "Login failed. Please try again in a moment.";
  };

  async function submitLogin(nextIdentifier, nextPassword) {
    setLoading(true);
    loaderStartRef.current = Date.now();
    loginSuccessRef.current = false;
    setLoginLoaderVisible(true);
    setLoaderLabel("Starting secure connection...");
    setInlineError("");
    try {
      const backendReady = await waitForBackendConnection({ silent: false, intervalMs: 2500 });
      if (!backendReady) {
        setInlineError("The server is still starting. Please wait about 2-3 minutes, then try again.");
        return;
      }

      setLoaderLabel("Signing you in...");
      const loggedInUser = await login({ identifier: nextIdentifier, password: nextPassword });
      loginSuccessRef.current = true;
      resetTenantState();

      const tenantList = await refreshTenants({ force: true });
      const hasTenants = Array.isArray(tenantList) && tenantList.length > 0;

      if (hasTenants) {
        const ensuredTenantId = ensureActiveTenant(tenantList);
        if (!ensuredTenantId) {
          const firstTenantId = Number(tenantList[0]?.tenantId);
          if (Number.isFinite(firstTenantId)) {
            setActiveTenant(firstTenantId);
          }
        }
      }

      setToast({
        message: isDemoAccountUser(loggedInUser)
          ? "Demo mode active. Explore freely. Changes are disabled."
          : "Login successful. Redirecting...",
        type: "success",
      });

      if (hasTenants) {
        navigate(postAuthRedirect || toKfarmsAppPath("/dashboard"), {
          replace: true,
        });
        return;
      }

      navigate("/onboarding/create-tenant", {
        replace: true,
        state: postAuthRedirect ? { postCreateRedirect: postAuthRedirect } : undefined,
      });
    } catch (err) {
      const verificationPayload = err?.response?.data?.data;
      if (verificationPayload?.verificationRequired) {
        const pendingVerification = normalizeContactVerificationState({
          ...verificationPayload,
          email: verificationPayload.email || nextIdentifier,
        });
        writePendingContactVerification(pendingVerification);
        navigate("/auth/verify-contact", {
          replace: true,
          state: pendingVerification,
        });
        return;
      }
      setInlineError(getLoginErrorMessage(err));
    } finally {
      const elapsed = Date.now() - loaderStartRef.current;
      const minVisible = loginSuccessRef.current ? 900 : 500;
      const remaining = Math.max(minVisible - elapsed, 0);
      setTimeout(() => {
        setLoading(false);
        if (!loginSuccessRef.current) {
          setLoginLoaderVisible(false);
        }
      }, remaining);
    }
  }

  function handleLogin(e) {
    e.preventDefault();
    void submitLogin(identifier, password);
  }

  function handleDemoLogin() {
    setIdentifier(DEMO_ACCOUNT_EMAIL);
    setPassword(DEMO_ACCOUNT_PASSWORD);
    void submitLogin(DEMO_ACCOUNT_EMAIL, DEMO_ACCOUNT_PASSWORD);
  }

  return (
    <PageWrapper>
      {(loginLoaderVisible || authLoading) && (
        <PageLoader label={loaderLabel} />
      )}
      <div className="relative app-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 text-slate-800 dark:from-darkbg dark:via-[#0A0A0F] dark:to-[#111827] dark:text-darkText">
        <AuthWatermark />
        <AuthThemeSwitcher />
        <Link
          to="/"
          className="absolute left-3 top-3 z-20 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20 sm:left-4 sm:top-4"
          aria-label="Back to landing page"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        {/* Toast */}
        <GlassToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "info" })}
        />

        <div className="relative z-10 mx-auto grid h-full w-full max-w-4xl grid-cols-1 items-center gap-4 px-0 pb-4 pt-16 sm:px-4 sm:pb-6 sm:pt-20 md:grid-cols-2 md:gap-8">
          {/* Brand - Left side */}
          <div className="hidden md:flex flex-col items-start gap-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4" style={{ color: brandAccentColor }} />
              Trusted Access
            </div>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 grid place-items-center overflow-hidden">
                <img
                  src={brandLogo}
                  alt={brandName}
                  className="h-full w-full object-contain scale-[2] saturate-110 contrast-110"
                />
              </div>
              <div className="text-5xl font-header" style={{ color: brandPrimaryColor }}>
                {brandName}
              </div>
            </div>
            <p className="max-w-md font-body text-base text-slate-600 dark:text-slate-300">
              {brandMessage}
            </p>
            <div className="grid gap-2 text-sm text-slate-400">
              <div>Live pond insights, all in one dashboard.</div>
              <div>Alerts that help you act early.</div>
              <div>Clean reports ready for audits.</div>
            </div>
          </div>
          {/* Login Card */}
          <div className="flex items-center justify-center">
            <AuthCard
              title={brandHeadline}
              subtitle={brandMessage}
              trustText={getAuthTrustText("login")}
              accentColor={brandPrimaryColor}
            >
              <form onSubmit={handleLogin} className="space-y-3.5 sm:space-y-4">
                {/* Inline error that auto-hides */}
                {inlineError && (
                  <div className="text-sm text-status-danger">{inlineError}</div>
                )}

                <div>
                  <FloatingInput
                    label="Email or Username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username"
                    required
                  />

                  <FloatingInput
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="submit"
                    style={{
                      backgroundColor: brandPrimaryColor,
                      borderColor: `${brandPrimaryColor}66`,
                    }}
                    className={`inline-flex min-h-11 w-full items-center justify-center rounded-md border px-3 py-2 text-sm font-header text-white transition-all duration-300 sm:w-auto ${
                      loading ? "pointer-events-none opacity-70" : "hover:bg-blue-600"
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      "Sign in"
                    )}
                  </button>
                  <Link
                    to="/auth/signup"
                    state={postAuthRedirect ? { postAuthRedirect } : undefined}
                    className="text-sm text-slate-600 hover:text-accent-primary dark:text-slate-300"
                  >
                    Create account
                  </Link>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">
                      Demo workspace
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                      {DEMO_ACCOUNT_INFO}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    disabled={loading || authLoading}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(5,150,105,0.22)] transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                  >
                    <span>Open demo</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-300">
                  <Link
                    to="/auth/forgot-password"
                    className="text-xs text-slate-700 hover:underline dark:text-darkText"
                  >
                    Forgot password
                  </Link>
                </div>

                <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Verified access • Only you can view your account.
                </div>

                <div className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-xs">
                  By using KFarms, you agree to the{" "}
                  <Link
                    className="font-semibold text-accent-primary"
                    to="/terms"
                    state={{ returnTo: "/auth/login" }}
                  >
                    Terms & Conditions
                  </Link>
                  .
                </div>
              </form>
            </AuthCard>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

import React from "react";
import AuthCard from "../components/AuthCard";
import AuthWatermark from "../components/AuthWatermark";
import GlassToast from "../components/GlassToast";
import { useAuth } from "../hooks/useAuth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import FloatingInput from "../components/FloatingInput";
import PageLoader from "../components/PageLoader";
import { getAuthTrustText } from "../constants/authCopy";
import { useTenant } from "../tenant/TenantContext";
import {
  DEMO_ACCOUNT_EMAIL,
  DEMO_ACCOUNT_PASSWORD,
  DEMO_ACCOUNT_USERNAME,
  isDemoAccountUser,
} from "../auth/demoMode";
import kfarmsLogo from "../assets/Kfarms_logo.png";
import AuthThemeSwitcher from "../components/AuthThemeSwitcher";

/**
 * Login page:
 * - displays inline errors (auto-hide after 3s)
 * - uses GlassToast for system messages (success or error)
 * - centers correctly using .app-full wrapper
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading: authLoading } = useAuth();
  const { refreshTenants, ensureActiveTenant, setActiveTenant } = useTenant();
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

  const getLoginErrorMessage = (err) => {
    const status = err?.response?.status;
    const isNetwork =
      err?.message === "Network Error" ||
      err?.code === "ECONNABORTED" ||
      !err?.response;

    if (isNetwork) {
      return "We couldn't reach the server. Check your connection and try again.";
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
    setInlineError("");
    try {
      const loggedInUser = await login({ identifier: nextIdentifier, password: nextPassword });
      loginSuccessRef.current = true;

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

      navigate(hasTenants ? "/dashboard" : "/onboarding/create-tenant", {
        replace: true,
      });
    } catch (err) {
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

  function handleUseDemoAccount() {
    setIdentifier(DEMO_ACCOUNT_EMAIL);
    setPassword(DEMO_ACCOUNT_PASSWORD);
    setInlineError("");
  }

  function handleDemoLogin() {
    setIdentifier(DEMO_ACCOUNT_EMAIL);
    setPassword(DEMO_ACCOUNT_PASSWORD);
    void submitLogin(DEMO_ACCOUNT_EMAIL, DEMO_ACCOUNT_PASSWORD);
  }


  return (
    <PageWrapper>
      {(loginLoaderVisible || authLoading) && (
        <PageLoader label="Signing you in…" />
      )}
      <div className="relative app-full bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 text-slate-800 dark:from-darkbg dark:via-[#0A0A0F] dark:to-[#111827] dark:text-darkText">
        <AuthWatermark />
        <AuthThemeSwitcher />
        <Link
          to="/"
          className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
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

        <div className="relative z-10 w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center px-4">
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
              <form onSubmit={handleLogin} className="space-y-4">
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

                <div className="flex md:flex-row gap-2 items-center justify-between">
                  <button
                    type="submit"
                    style={{
                      backgroundColor: brandPrimaryColor,
                      borderColor: `${brandPrimaryColor}66`,
                    }}
                    className={`rounded-md border px-3 py-2 text-sm font-header text-white transition-all duration-300 ${
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
                    className="text-sm text-slate-600 hover:text-accent-primary dark:text-slate-300"
                  >
                    Create account
                  </Link>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-300">
                  <Link
                    to="/auth/forgot-password"
                    className="text-xs text-slate-700 hover:underline dark:text-darkText"
                  >
                    Forgot password
                  </Link>
                </div>

                <div className="rounded-2xl border border-dashed border-emerald-200/80 bg-emerald-50/80 p-4 text-left dark:border-emerald-400/20 dark:bg-emerald-500/10">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-200">
                        Demo Account
                      </div>
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                        View the full product with sample data. All write actions are blocked because this is a showroom workspace.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDemoLogin}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
                    >
                      Enter demo mode
                    </button>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      Username: <span className="font-mono text-slate-900 dark:text-slate-100">{DEMO_ACCOUNT_USERNAME}</span>
                    </div>
                    <div>
                      Email: <span className="font-mono text-slate-900 dark:text-slate-100">{DEMO_ACCOUNT_EMAIL}</span>
                    </div>
                    <div>
                      Password: <span className="font-mono text-slate-900 dark:text-slate-100">{DEMO_ACCOUNT_PASSWORD}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleUseDemoAccount}
                    className="mt-3 text-xs font-semibold text-emerald-700 transition hover:text-emerald-600 dark:text-emerald-200"
                  >
                    Fill these demo credentials
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Verified access • Only you can view your account.
                </div>
              </form>
            </AuthCard>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

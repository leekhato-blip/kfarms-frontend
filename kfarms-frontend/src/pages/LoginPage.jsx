import React from "react";
import AuthCard from "../components/AuthCard";
import GlassToast from "../components/GlassToast";
import { useAuth } from "../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import FloatingInput from "../components/FloatingInput";
import PageLoader from "../components/PageLoader";
import { getAuthTrustText } from "../constants/authCopy";
import { useTenant } from "../tenant/TenantContext";

/**
 * Login page:
 * - displays inline errors (auto-hide after 3s)
 * - uses GlassToast for system messages (success or error)
 * - centers correctly using .app-full wrapper
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading: authLoading } = useAuth();
  const { refreshTenants, ensureActiveTenant, setActiveTenant } = useTenant();

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

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    loaderStartRef.current = Date.now();
    loginSuccessRef.current = false;
    setLoginLoaderVisible(true);
    setInlineError("");
    try {
      await login({ identifier, password });
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
        message: "Login successful. Redirecting...",
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


  return (
    <PageWrapper>
      {(loginLoaderVisible || authLoading) && (
        <PageLoader label="Signing you in…" />
      )}
      <div className="relative app-full bg-gradient-to-br from-darkbg via-[#0A0A0F] to-[#111827] text-darkText px-4">
        <Link
          to="/"
          className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/20 transition"
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

        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center px-4">
          {/* Brand - Left side */}
          <div className="hidden md:flex flex-col items-start gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/10 text-xs font-semibold text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Trusted Access
            </div>
            <div className="text-5xl font-header text-accent-primary">
              KFarms
            </div>
            <p className="font-body text-base text-textSecondary max-w-md">
              Fast, secure sign-in to the tools your team relies on every day.
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
              title="Welcome back"
              subtitle="Sign in to keep operations moving"
              trustText={getAuthTrustText("login")}
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
                    className={`text-sm font-header px-3 py-2 rounded-md
                      border border-darkbg/30 hover:border-accent-primary/40 
                                bg-accent-primary transition-all duration-300 
                      ${
                        loading
                          ? "opacity-70 pointer-events-none"
                          : "hover:bg-blue-600"
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
                    className="text-sm text-textSecondary hover:text-accent-primary"
                  >
                    Create account
                  </Link>
                </div>

                <div className="text-xs text-textSecondary">
                  <Link
                    to="/auth/forgot-password"
                    className="hover:underline text-darkText text-xs"
                  >
                    Forgot password
                  </Link>
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

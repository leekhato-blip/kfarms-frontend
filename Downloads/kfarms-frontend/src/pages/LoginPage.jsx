import React from "react";
import AuthCard from "../components/AuthCard";
import GlassToast from "../components/GlassToast";
import { loginUser } from "../services/authService";
import { useAuth } from "../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import ForgotPasswordPage from "./ForgotPasswordPage";
import PageWrapper from "../components/PageWrapper";
import FloatingInput from "../components/FloatingInput";

/**
 * Login page:
 * - displays inline errors (auto-hide after 3s)
 * - uses GlassToast for system messages (success or error)
 * - centers correctly using .app-full wrapper
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // form state
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // message
  const [inlineError, setInlineError] = React.useState("");
  const [toast, setToast] = React.useState({ message: "", type: "info" });

  // auto-clear inline error after 3s
  React.useEffect(() => {
    if (!inlineError) return;
    const t = setTimeout(() => setInlineError(""), 3000);
    return () => clearTimeout(t);
  }, [inlineError]);

async function handleLogin(e) {
  e.preventDefault();
  setLoading(true);
  setInlineError("");
  try {
    const loginResponse = await loginUser({ identifier, password });

    // loginResponse = { token, user }
    login({
      token: loginResponse.token,
      user: loginResponse.user, 
    });

    setToast({
      message: "Login successful. Redirecting...",
      type: "success",
    });

    setTimeout(() => navigate("/", { replace: true }), 700);
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || "Network error";
    setInlineError(msg);
  } finally {
    setLoading(false);
  }
}


  return (
    <PageWrapper>
      <div className="app-full bg-gradient-to-br from-darkbg via-[#0A0A0F] to-[#111827] text-darkText px-4">
        {/* Toast */}
        <GlassToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "info" })}
        />

        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center px-4">
          {/* Brand - Left side */}
          <div className="hidden md:flex flex-col items-start gap-6">
            <div className="text-5xl font-header text-accent-primary">KFarms</div>
            <p className="font-body text-base text-textSecondary max-w-md">
              Manage your farm efficiently. Track supplies, production, and
              tanks—all in one place.
            </p>
          </div>
          {/* Login Card */}
          <div className="flex items-center justify-center">
            <AuthCard
              title="Welcome back"
              subtitle="Sign in to your KFarms account"
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
              </form>
            </AuthCard>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

import React from "react";
import AuthCard from "../components/AuthCard";
import GlassToast from "../components/GlassToast";
import { forgotPassword } from "../services/authService";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { div } from "framer-motion/client";
import PageWrapper from "../components/PageWrapper";
import FloatingInput from "../components/FloatingInput";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [inlineError, setInlineError] = React.useState("");
  const [toast, setToast] = React.useState({ message: "", type: "" });

  // auto-clear inline error
  React.useEffect(() => {
    if (!inlineError) return;
    const t = setTimeout(() => setInlineError(""), 3000);
    return () => clearTimeout(t);
  }, [inlineError]);

  async function handleForgot(e) {
    e.preventDefault();
    setLoading(true);
    setInlineError("");

    try {
      const res = await forgotPassword({ email });
      if (res?.success) {
        setToast({
          message: "Password reset link sent to your email. Redirecting...",
          type: "success",
        });
        setEmail("");
        setTimeout(() => navigate("/auth/login"), 1500);
      } else {
        setInlineError(res?.message || "Request failed");
      }
    } catch (err) {
      setInlineError(
        err?.response?.data?.message || err.message || "Network error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageWrapper>
      <div className="app-full bg-gradient-to-br from-darkbg via-[#0A0A0F] to-[#111827] bg-darkbg text-darkText px-4">
        <GlassToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "" })}
        />

        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gat-8 items-center px-4">
          {/* Left side info */}
          <div className="hidden md:flex flex-col items-start">
            <div className="text-5xl font-header text-accent-primary">KFarms</div>
            <p className="font-body text-base text-textSecondary max-w-md">
              Enter your email, and we'll send
              you a reset link.
            </p>
          </div>

          {/* Form card */}
          <div className="flex items-center justify-center">
            <AuthCard
              title="Forgot Password"
              subtitle="Enter your registered email"
            >
              <form onSubmit={handleForgot} className="space-y-4">
                {inlineError && (
                  <div className="text-sm text-status-danger">{inlineError}</div>
                )}

                <FloatingInput
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                  className="w-full rounded-md p-3 bg-darkbg/50 border border-transparent focus:border-accent-primary outline-none text-darkText"
                />

                <div className="flex items-center justify-between">
                  <Link
                    to="/auth/login"
                    className="text-sm text-darkText hover:text-accent-primary"
                  >
                    Back to login
                  </Link>

                  <button
                    type="submit"
                    className={`text-sm font-header px-3 py-2 rounded-md
                      border border-darkbg/30 hover:border-accent-primary/40 
                                bg-accent-primary transition-all duration-300 ${
                                  loading
                                    ? "opacity-70 pointer-events-none"
                                    : ""
                                }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </div>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </div>
              </form>
            </AuthCard>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

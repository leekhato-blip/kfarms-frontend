import React from "react";
import AuthCard from "../components/AuthCard";
import AuthWatermark from "../components/AuthWatermark";
import GlassToast from "../components/GlassToast";
import { forgotPassword } from "../services/authService";
import { Link, useNavigate } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
import FloatingInput from "../components/FloatingInput";
import { getAuthTrustText } from "../constants/authCopy";
import kfarmsLogo from "../assets/Kfarms_logo.png";
import AuthThemeSwitcher from "../components/AuthThemeSwitcher";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const redirectTimerRef = React.useRef(null);
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [inlineError, setInlineError] = React.useState("");
  const [toast, setToast] = React.useState({ message: "", type: "" });

  const looksLikeEmail = React.useCallback(
    (value) => /\S+@\S+\.\S+/.test(String(value || "").trim()),
    [],
  );

  // auto-clear inline error
  React.useEffect(() => {
    if (!inlineError) return;
    const t = setTimeout(() => setInlineError(""), 3000);
    return () => clearTimeout(t);
  }, [inlineError]);

  React.useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  async function handleForgot(e) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setInlineError("");

    if (!normalizedEmail) {
      setInlineError("Please enter your email address.");
      return;
    }

    if (!looksLikeEmail(normalizedEmail)) {
      setInlineError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await forgotPassword({ email: normalizedEmail });
      if (res?.success) {
        setToast({
          message: "If that email is registered, a reset link is on the way. Redirecting...",
          type: "success",
        });
        setEmail("");
        redirectTimerRef.current = window.setTimeout(() => {
          navigate("/auth/login", {
            state: {
              prefillIdentifier: normalizedEmail,
            },
          });
        }, 1800);
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
      <div className="relative app-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 text-slate-800 dark:from-darkbg dark:via-[#0A0A0F] dark:to-[#111827] dark:text-darkText">
        <AuthWatermark />
        <AuthThemeSwitcher />
        <GlassToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "" })}
        />

        <div className="relative z-10 mx-auto grid h-full w-full max-w-4xl grid-cols-1 items-center gap-5 px-1 pb-4 pt-16 sm:px-4 sm:pb-6 sm:pt-20 md:grid-cols-2 md:gap-8">
          {/* Left side info */}
          <div className="hidden md:flex flex-col items-start">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 grid place-items-center overflow-hidden">
                <img
                  src={kfarmsLogo}
                  alt="KFarms"
                  className="h-full w-full object-contain scale-[2] saturate-110 contrast-110"
                />
              </div>
              <div className="text-5xl font-header text-accent-primary">KFarms</div>
            </div>
            <p className="max-w-md font-body text-base text-slate-600 dark:text-slate-300">
              Enter your email and we&apos;ll help you get back in with a fresh reset link.
            </p>
          </div>

          {/* Form card */}
          <div className="flex items-center justify-center">
            <AuthCard
              title="Forgot Password"
              subtitle="Enter your registered email and we&apos;ll send a reset link if we find a match."
              trustText={getAuthTrustText("forgot")}
            >
              <form onSubmit={handleForgot} className="space-y-4">
                {inlineError && (
                  <div className="text-sm text-status-danger">{inlineError}</div>
                )}

                <FloatingInput
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />

                <div className="flex items-center justify-between">
                  <Link
                    to="/auth/login"
                    className="text-sm text-slate-700 hover:text-accent-primary dark:text-darkText"
                  >
                    Back to login
                  </Link>

                  <button
                    type="submit"
                    className={`rounded-md border border-accent-primary/40 bg-accent-primary px-3 py-2 text-sm font-header text-white transition-all duration-300 ${
                      loading ? "pointer-events-none opacity-70" : ""
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

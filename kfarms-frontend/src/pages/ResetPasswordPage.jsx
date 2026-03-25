import React from "react";
import AuthCard from "../components/AuthCard";
import AuthWatermark from "../components/AuthWatermark";
import GlassToast from "../components/GlassToast";
import { resetPassword } from "../services/authService";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import PageWrapper from "../components/PageWrapper";
import FloatingInput from "../components/FloatingInput";
import { getAuthTrustText } from "../constants/authCopy";
import kfarmsLogo from "../assets/Kfarms_logo.png";
import AuthThemeSwitcher from "../components/AuthThemeSwitcher";
import {
  ACCOUNT_PASSWORD_MIN_LENGTH,
  validateAccountPassword,
} from "../utils/accountValidation";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // read query params
  const token = searchParams.get("token"); // extract ?token=

  // Form state
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [inlineError, setInlineError] = React.useState("");
  const [toast, setToast] = React.useState({ message: "", type: "" });
  const redirectTimerRef = React.useRef(null);

  // Auto-clear inline error after 3s
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

  async function handleReset(e) {
    e.preventDefault();
    setInlineError("");

    if (!token) {
      setInlineError("This reset link is missing or invalid. Request a new one.");
      return;
    }

    const passwordError = validateAccountPassword(newPassword, ACCOUNT_PASSWORD_MIN_LENGTH);
    if (passwordError) {
      setInlineError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setInlineError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword({ token: token, newPassword });
      if (res?.success) {
        setToast({
          message: "Password reset successfully. Redirecting to login...",
          type: "success",
        });
        redirectTimerRef.current = window.setTimeout(
          () =>
            navigate("/auth/login", {
              state: {
                passwordResetMessage: true,
              },
            }),
          1500,
        );
      } else {
        setInlineError(res?.message || "Reset failed");
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
      <div className="relative app-full bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 text-slate-800 dark:from-darkbg dark:via-[#0A0A0F] dark:to-[#111827] dark:text-darkText">
        <AuthWatermark />
        <AuthThemeSwitcher />
        {/* Toast for system messages */}
        <GlassToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "" })}
        />

        <div className="relative z-10 w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center px-4">
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
              Reset your password safely and get back into your workspace.
            </p>
          </div>

          {/* Reset Password Form */}
          <div className="flex items-center justify-center">
            <AuthCard
              title="Reset Password"
              subtitle={token
                ? "Set a new password for your account"
                : "This link is incomplete. Request a fresh password reset link."}
              trustText={getAuthTrustText("reset")}
            >
              <form onSubmit={handleReset} className="space-y-4">
                {inlineError && (
                  <div className="text-sm text-status-danger">{inlineError}</div>
                )}

                <FloatingInput
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  type="password"
                  autoComplete="new-password"
                  disabled={!token}
                />

                <FloatingInput
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  type="password"
                  autoComplete="new-password"
                  disabled={!token}
                />

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Use at least 6 characters with letters and numbers, and choose something new.
                </p>

                <div className="flex items-center justify-between">
                  <Link
                    to="/auth/forgot-password"
                    className="text-sm text-slate-700 hover:text-accent-primary dark:text-darkText"
                  >
                    Request new link
                  </Link>

                  <button
                    type="submit"
                    className={`rounded-md border border-accent-primary/40 bg-accent-primary px-3 py-2 text-sm font-header text-white transition-all duration-300 ${
                      loading || !token ? "pointer-events-none opacity-70" : ""
                    }`}

                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Resetting...</span>
                      </div>
                    ) : (
                      "Reset Password"
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

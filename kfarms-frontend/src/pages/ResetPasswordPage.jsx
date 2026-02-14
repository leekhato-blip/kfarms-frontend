import React from "react";
import AuthCard from "../components/AuthCard";
import GlassToast from "../components/GlassToast";
import { resetPassword } from "../services/authService";
import { useNavigate, useSearchParams } from "react-router-dom";

import PageWrapper from "../components/PageWrapper";
import { LucideArrowDownRightFromSquare } from "lucide-react";
import FloatingInput from "../components/FloatingInput";
import { getAuthTrustText } from "../constants/authCopy";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // read query params
  const token = searchParams.get("token"); // extract ?token=

  // Form state
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [inlineError, setinlinerror] = React.useState("");
  const [toast, setToast] = React.useState({ message: "", type: "" });

  // Auto-clear inline error after 3s
  React.useEffect(() => {
    if (!inlineError) return;
    const t = setTimeout(() => setinlinerror(""), 3000);
    return () => clearTimeout(t);
  }, [inlineError]);

  async function handleReset(e) {
    e.preventDefault();
    setinlinerror("");

    if (!token) {
      setinlinerror("Invalid or expired token");
      return;
    }

    if (newPassword !== confirmPassword) {
      setinlinerror("Passwords do not match");
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
        setTimeout(() => navigate("/auth/login"), 1500);
      } else {
        setinlinerror(res?.message || "Reset failed");
      }
    } catch (err) {
      setinlinerror(
        err?.response?.data?.message || err.message || "Network error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageWrapper>
      <div className="app-full bg-gradient-to-br from-darkbg via-[#0A0A0F] to-[#111827] text-darkText px-4">
        {/* Toast for system messages */}
        <GlassToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "" })}
        />

        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center px-4">
          {/* Left side info */}
          <div className="hidden md:flex flex-col items-start">
            <div className="text-5xl font-header text-accent-primary">KFarms</div>
            <p className="font-body text-base text-textSecondary max-w-md">
              Reset your password safely. Enter your new password.
            </p>
          </div>

          {/* Reset Password Form */}
          <div className="flex items-center justify-center">
            <AuthCard
              title="Reset Password"
              subtitle="Set a new password for your account"
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
                  className="w-full rounded-md p-3 bg-darkbg/50 border border-transparent focus:border-accent-primary outline-none text-darkText"
                />

                <FloatingInput
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  type="password"
                  className="w-full rounded-md p-3 bg-darkbg/50 border border-transparent focus:border-accent-primary outline-none text-darkText"
                />

                <div className="flex items-center justify-between">
                  <button
                    type="submit"
                    className={`text-sm font-header px-3 py-2 rounded-md
                      border border-darkbg/30 hover:border-accent-primary/40 
                                bg-accent-primary transition-all duration-300  ${
                      loading ? "opacity-70 pointer-events-none" : ""
                    }`}

                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Reseting</span>
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

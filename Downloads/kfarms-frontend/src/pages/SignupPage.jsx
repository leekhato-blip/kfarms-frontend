import React from "react";
import AuthCard from "../components/AuthCard";
import GlassToast from "../components/GlassToast";
import { signUser } from "../services/authService";
import { Link, useNavigate } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
import FloatingInput from "../components/FloatingInput";

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = React.useState({
    email: "",
    username: "",
    password: "",
  });
  const [loading, setLoading] = React.useState(false);
  const [inlineError, setInlineError] = React.useState("");
  const [toast, setToast] = React.useState({ message: "", type: "" });

  React.useEffect(() => {
    if (!inlineError) return;
    const t = setTimeout(() => setInlineError(""), 3000);
    return () => clearTimeout(t);
  }, [inlineError]);

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setInlineError("");
    try {
      const res = await signUser(form);
      if (res?.success) {
        setToast({
          message: "Signup successful. Please login.",
          type: "success",
        });
        setTimeout(() => navigate("/auth/login"), 900);
      } else {
        setInlineError(res?.message || "Signup failed");
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
      <div className="app-full bg-gradient-to-br from-darkbg via-[#0A0A0F] to-[#111827] text-darkText px-4">
        <GlassToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", t })}
        />
        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center px-4">
          {/* Left promo area (same as login) */}
          <div className="hidden md:flex flex-col items-start gap-6">
            <div className="text-5xl font-header text-accent-primary">
              KFarms
            </div>
            <p className="font-body text-base text-darkText max-w-md">
              Create an account to start managing your farm - supplies,
              production, and tanks.
            </p>
          </div>

          <div className="flex items-center justify-center">
            <AuthCard title="Create account" subtitle="Register for KFarms">
              <form onSubmit={handleSignup} className="space-y-4">
                {inlineError && (
                  <div className="text-sm text-status-danger">
                    {inlineError}
                  </div>
                )}

                <FloatingInput
                  label="Email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, email: e.target.value }))
                  }
                  autoComplete="email"
                  type="email"
                  required
                />

                <FloatingInput
                  label="Username"
                  value={form.username}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, username: e.target.value }))
                  }
                  autoComplete="username"
                  required
                />
                <FloatingInput
                  label="Password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, password: e.target.value }))
                  }
                  type="password"
                  required
                />
                <div className="flex items-center justify-between">
                  <Link
                    to="/auth/login"
                    className="text-sm text-darkText hover:text-accent-primary"
                  >
                    Login
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
                        <span>Creating...</span>
                      </div>
                    ) : (
                      "Create Account"
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

import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, MailCheck } from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import apiClient from "../api/apiClient";
import { useTenant } from "../tenant/TenantContext";
import { useAuth } from "../hooks/useAuth";

function readErrorMessage(error) {
  const data = error?.response?.data;
  if (typeof data === "string") return data;
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  return "We couldn't process that invite right now. Please check the code and try again.";
}

export default function AcceptInvite() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [searchParams] = useSearchParams();
  const {
    activeTenantId,
    refreshTenants,
    setActiveTenant,
    ensureActiveTenant,
    clearTenantSwitchMessage,
  } = useTenant();

  const [token, setToken] = React.useState(() => searchParams.get("token") || "");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    if (activeTenantId) {
      navigate("/dashboard", { replace: true });
      return;
    }
    navigate("/", { replace: true });
  };

  const handleLogoutTo = async (path) => {
    try {
      await logout();
    } finally {
      navigate(path, { replace: true });
    }
  };

  const handleAcceptInvite = async (event) => {
    event.preventDefault();
    setError("");

    const inviteToken = token.trim();
    if (!inviteToken) {
      setError("Please paste your invite code.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post("/tenants/invites/accept", {
        token: inviteToken,
      });

      const payload = res.data?.data ?? res.data;
      const tenantList = await refreshTenants();
      const resolvedTenantId =
        Number(payload?.tenantId) ||
        Number(
          tenantList.find((tenant) => payload?.slug && tenant?.slug === payload.slug)?.tenantId,
        );

      if (resolvedTenantId) {
        setActiveTenant(resolvedTenantId);
      } else {
        ensureActiveTenant(tenantList);
      }

      clearTenantSwitchMessage();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-8 text-slate-100">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={handleBack}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="mb-5 flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleLogoutTo("/auth/login")}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-semibold hover:bg-white/20 transition"
            >
              Sign out to Login
            </button>
            <button
              type="button"
              onClick={() => handleLogoutTo("/")}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-semibold hover:bg-white/20 transition"
            >
              Sign out to Company Profile
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-200">
              <MailCheck className="h-4 w-4" />
              Team invite
            </div>
            <h1 className="text-2xl font-semibold">Join Organization</h1>
            <p className="mt-2 text-sm text-slate-300">
              Paste your invite code below, or open this page with <code>?token=...</code>.
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm text-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleAcceptInvite} className="mt-5 space-y-4">
              <div>
                <label htmlFor="invite-token" className="mb-1 block text-sm font-medium">
                  Invite code
                </label>
                <textarea
                  id="invite-token"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  rows={4}
                  required
                  placeholder="Paste invite code"
                  className="w-full rounded-lg border border-white/20 bg-slate-900/70 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  submitting
                    ? "cursor-not-allowed bg-sky-500/50"
                    : "bg-sky-500 hover:bg-sky-400"
                }`}
              >
                {submitting ? "Joining organization..." : "Join organization"}
              </button>
            </form>

            <div className="mt-4 text-xs text-slate-400">
              Need to create your own organization instead?{" "}
              <Link
                to="/onboarding/create-tenant"
                className="text-sky-300 hover:underline"
              >
                Create organization
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

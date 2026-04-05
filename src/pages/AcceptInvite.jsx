import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Home,
  Link2,
  LogOut,
  MailCheck,
  ShieldCheck,
  Users2,
} from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import AuthThemeSwitcher from "../components/AuthThemeSwitcher";
import AuthWatermark from "../components/AuthWatermark";
import apiClient from "../api/apiClient";
import { useTenant } from "../tenant/TenantContext";
import { useAuth } from "../hooks/useAuth";
import { toKfarmsAppPath } from "../apps/kfarms/paths";

const ACTION_BUTTON_CLASS =
  "inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20";

const PANEL_CLASS =
  "rounded-[1.75rem] border border-slate-200/80 bg-white/82 p-5 shadow-[0_24px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55 dark:shadow-[0_24px_48px_rgba(2,6,23,0.34)] sm:p-6";

const INVITE_GUIDE = [
  {
    icon: Link2,
    title: "Paste the invite code",
    body: "Use the code from your teammate or open the invite link directly.",
  },
  {
    icon: Users2,
    title: "Join the right workspace",
    body: "We connect this account to the invited farm and preserve the right access level.",
  },
  {
    icon: ShieldCheck,
    title: "Continue securely",
    body: "After acceptance, you go straight into the shared dashboard and records.",
  },
];

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
  const inviteDetectedFromLink = Boolean(searchParams.get("token"));

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    if (activeTenantId) {
      navigate(toKfarmsAppPath("/dashboard"), { replace: true });
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
      navigate(toKfarmsAppPath("/dashboard"), { replace: true });
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
<<<<<<< HEAD
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4 py-8 text-slate-900 dark:from-darkbg dark:via-[#0A0A0F] dark:to-[#111827] dark:text-slate-100">
        <AuthWatermark />
        <AuthThemeSwitcher />
=======
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-8 text-slate-100">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={handleBack}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
>>>>>>> 0babf4d (Update frontend application)

        <div className="relative z-10 mx-auto w-full max-w-5xl pt-12 sm:pt-14">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
<<<<<<< HEAD
              onClick={handleBack}
              className={ACTION_BUTTON_CLASS}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
=======
              onClick={() => handleLogoutTo("/auth/login")}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-semibold hover:bg-white/20 transition"
            >
              Sign out to Login
            </button>
            <button
              type="button"
              onClick={() => handleLogoutTo("/")}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-semibold hover:bg-white/20 transition"
            >
              Sign out to home
>>>>>>> 0babf4d (Update frontend application)
            </button>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleLogoutTo("/auth/login")}
                className={ACTION_BUTTON_CLASS}
              >
                <LogOut className="h-4 w-4" />
                Use another account
              </button>
              <button
                type="button"
                onClick={() => handleLogoutTo("/")}
                className={ACTION_BUTTON_CLASS}
              >
                <Home className="h-4 w-4" />
                Go home
              </button>
            </div>
          </div>

<<<<<<< HEAD
          <div className="mt-6 grid gap-6 lg:grid-cols-[0.92fr_minmax(0,1.08fr)]">
            <section className={PANEL_CLASS}>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/12 dark:text-sky-200">
                <MailCheck className="h-4 w-4" />
                Team invite
=======
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-200">
              <MailCheck className="h-4 w-4" />
              Team invite
            </div>
            <h1 className="text-2xl font-semibold">Join farm</h1>
            <p className="mt-2 text-sm text-slate-300">
              Paste your invite code below, or open this page with <code>?token=...</code>.
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-400/30 bg-red-500/20 px-3 py-2 text-sm text-red-100">
                {error}
>>>>>>> 0babf4d (Update frontend application)
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Join your farm team
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">
                Accept the invite, connect this account to the right workspace, and continue with the team dashboard, records, and shared settings.
              </p>

              {inviteDetectedFromLink ? (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                  Invite link detected. Review the code and continue when you&apos;re ready.
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                  If a teammate shared a full invite link, opening it here will fill the code automatically.
                </div>
              )}

              <div className="mt-6 grid gap-3">
                {INVITE_GUIDE.map(({ icon: Icon, title, body }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {title}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

<<<<<<< HEAD
            <section className={PANEL_CLASS}>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                <Link2 className="h-4 w-4" />
                Paste code
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Confirm your invite
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Paste the invite code below, or open this page with <code className="rounded bg-slate-100 px-1 py-0.5 text-[12px] text-slate-700 dark:bg-white/[0.08] dark:text-slate-200">?token=...</code> to fill it automatically.
              </p>

              {error && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleAcceptInvite} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="invite-token"
                    className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Invite code
                  </label>
                  <textarea
                    id="invite-token"
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                    rows={5}
                    required
                    placeholder="Paste invite code"
                    className="min-h-[170px] w-full rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Use the exact code from the invite email or message. We&apos;ll connect this account to the invited workspace.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(14,165,233,0.22)] transition ${
                    submitting
                      ? "cursor-not-allowed bg-sky-400/70"
                      : "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500"
                  }`}
                >
                  {submitting ? "Joining farm..." : "Join farm"}
                </button>
              </form>

              <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                Need to create your own farm instead?{" "}
                <Link
                  to="/onboarding/create-tenant"
                  className="font-semibold text-sky-600 hover:text-sky-500 hover:underline dark:text-sky-300"
                >
                  Create farm
                </Link>
              </div>
            </section>
=======
              <button
                type="submit"
                disabled={submitting}
                className={`w-full rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  submitting
                    ? "cursor-not-allowed bg-sky-500/50"
                    : "bg-sky-500 hover:bg-sky-400"
                }`}
                >
                {submitting ? "Joining farm..." : "Join farm"}
              </button>
            </form>

            <div className="mt-4 text-xs text-slate-400">
              Need to create your own farm instead?{" "}
              <Link
                to="/onboarding/create-tenant"
                className="text-sky-300 hover:underline"
              >
                Create farm
              </Link>
            </div>
>>>>>>> 0babf4d (Update frontend application)
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

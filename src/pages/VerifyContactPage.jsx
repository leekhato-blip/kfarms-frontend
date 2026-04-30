import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, MailCheck, MessageSquareMore, RefreshCw, ShieldCheck } from "lucide-react";
import AuthCard from "../components/AuthCard";
import AuthThemeSwitcher from "../components/AuthThemeSwitcher";
import AuthWatermark from "../components/AuthWatermark";
import FloatingInput from "../components/FloatingInput";
import GlassToast from "../components/GlassToast";
import PageLoader from "../components/PageLoader";
import PageWrapper from "../components/PageWrapper";
import kfarmsLogo from "../assets/Kfarms_logo.png";
import { getAuthTrustText } from "../constants/authCopy";
import { useAuth } from "../hooks/useAuth";
import { login as loginApi, resendContactVerification, verifyContact } from "../services/authService";
import { createTenant } from "../services/tenantService";
import { useTenant } from "../tenant/TenantContext";
import { toKfarmsAppPath } from "../apps/kfarms/paths";
import { slugifyWorkspaceName } from "../utils/slugify";
import {
  clearPendingContactVerification,
  readPendingContactVerification,
  writePendingContactVerification,
} from "../auth/contactVerificationStorage";
import { normalizeContactVerificationState } from "../utils/contactVerification";

function extractPayload(response) {
  return response?.data ?? response ?? {};
}

function buildVerificationState(primary = {}, fallback = {}) {
  const primarySource = primary && typeof primary === "object" ? primary : {};
  const fallbackSource = fallback && typeof fallback === "object" ? fallback : {};

  return normalizeContactVerificationState({
    ...fallbackSource,
    ...primarySource,
    preview: primarySource.preview || fallbackSource.preview || null,
  });
}

export default function VerifyContactPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshMe } = useAuth();
  const { ensureActiveTenant, refreshTenants, setActiveTenant } = useTenant();
  const storedDraft = React.useMemo(() => readPendingContactVerification(), []);
  const locationPayload = React.useMemo(
    () => (location.state && typeof location.state === "object" ? location.state : {}),
    [location.state],
  );

  const [form, setForm] = React.useState({
    emailCode: "",
    phoneCode: "",
  });
  const [loading, setLoading] = React.useState(false);
  const [resendingChannel, setResendingChannel] = React.useState("");
  const [inlineError, setInlineError] = React.useState("");
  const [toast, setToast] = React.useState({ message: "", type: "info" });
  const [verificationState, setVerificationState] = React.useState(() =>
    buildVerificationState(locationPayload, storedDraft),
  );

  React.useEffect(() => {
    if (!inlineError) return;
    const timer = window.setTimeout(() => setInlineError(""), 4000);
    return () => window.clearTimeout(timer);
  }, [inlineError]);

  const pendingEmail = verificationState.email;
  const hasPendingProvisioning = Boolean(
    storedDraft?.email &&
      storedDraft?.password &&
      storedDraft?.farmName &&
      (storedDraft?.farmSlug || storedDraft?.farmName) &&
      Array.isArray(storedDraft?.modules) &&
      storedDraft.modules.length > 0,
  );

  React.useEffect(() => {
    if (!verificationState.email && storedDraft?.email) {
      setVerificationState((current) =>
        normalizeContactVerificationState({
          ...current,
          email: storedDraft.email,
        }),
      );
    }
  }, [storedDraft?.email, verificationState.email]);

  const requiresPhoneVerification = verificationState.requiresPhoneVerification;
  const showPhoneVerification = verificationState.hasPhoneNumber;

  async function finishSignupProvisioning() {
    if (!hasPendingProvisioning) {
      clearPendingContactVerification();
      navigate("/auth/login", {
        replace: true,
        state: {
          passwordResetMessage: false,
          signupRecoveryMessage: "Verification complete. Sign in to continue.",
          prefillIdentifier: pendingEmail,
        },
      });
      return;
    }

    const draft = readPendingContactVerification();
    const email = String(draft?.email || "").trim();
    const password = String(draft?.password || "");
    const farmName = String(draft?.farmName || "").trim();
    const farmSlug = slugifyWorkspaceName(draft?.farmSlug || draft?.farmName);
    const modules = Array.isArray(draft?.modules) ? draft.modules : [];

    try {
      await loginApi({ identifier: email, password });

      const createdTenant = await createTenant({
        name: farmName,
        slug: farmSlug,
        modules,
      });

      await refreshMe();
      const tenantList = await refreshTenants({ force: true });
      const createdTenantId =
        Number(createdTenant?.tenantId) ||
        Number(tenantList.find((tenant) => String(tenant?.slug) === farmSlug)?.tenantId);

      if (createdTenantId) {
        setActiveTenant(createdTenantId);
      } else {
        ensureActiveTenant(tenantList);
      }

      clearPendingContactVerification();
      setToast({
        message: "Verification complete. Your farm is ready.",
        type: "success",
      });
      navigate(toKfarmsAppPath("/dashboard"), { replace: true });
    } catch (error) {
      clearPendingContactVerification();
      navigate("/auth/login", {
        replace: true,
        state: {
          signupRecoveryMessage:
            error?.message ||
            "Your account is verified, but we could not finish the farm setup automatically.",
          prefillIdentifier: email || pendingEmail,
        },
      });
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    if (loading) return;

    if (!pendingEmail) {
      setInlineError("We could not find the account waiting for verification.");
      return;
    }

    if (!verificationState.emailVerified && !form.emailCode.trim()) {
      setInlineError("Enter the email code to continue.");
      return;
    }

    if (requiresPhoneVerification && !form.phoneCode.trim()) {
      setInlineError("Enter the SMS code to continue.");
      return;
    }

    setLoading(true);
    setInlineError("");

    try {
      const response = await verifyContact({
        email: pendingEmail,
        emailCode: form.emailCode.trim(),
        phoneCode: requiresPhoneVerification ? form.phoneCode.trim() : undefined,
      });
      const payload = extractPayload(response);
      const nextState = buildVerificationState(
        {
          ...verificationState,
          ...payload,
          email: pendingEmail,
        },
        storedDraft,
      );

      setVerificationState(nextState);

      writePendingContactVerification({
        ...(readPendingContactVerification() || {}),
        ...nextState,
      });

      await finishSignupProvisioning();
    } catch (error) {
      setInlineError(
        error?.response?.data?.message ||
          error?.message ||
          "We could not verify those codes just now.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend(channel) {
    if (!pendingEmail || resendingChannel) return;
    if (channel === "SMS" && !showPhoneVerification) return;

    setResendingChannel(channel);
    setInlineError("");

    try {
      const response = await resendContactVerification({
        email: pendingEmail,
        channel,
      });
      const payload = extractPayload(response);
      const nextState = buildVerificationState(
        {
          ...verificationState,
          ...payload,
          email: pendingEmail,
        },
        storedDraft,
      );

      setVerificationState(nextState);

      writePendingContactVerification({
        ...(readPendingContactVerification() || {}),
        ...nextState,
      });

      setToast({
        message: nextState.previewMode
          ? "Preview mode is active. The latest verification code is shown on this page because live email and SMS delivery are not configured yet."
          : channel === "EMAIL"
            ? "A fresh email verification code has been sent."
            : "A fresh SMS verification code has been sent.",
        type: "success",
      });
    } catch (error) {
      setInlineError(
        error?.response?.data?.message ||
          error?.message ||
          "We could not resend the verification code.",
      );
    } finally {
      setResendingChannel("");
    }
  }

  const brandPrimaryColor = "#2563EB";
  const brandAccentColor = "#10B981";
  const emailLabel = verificationState.maskedEmail || pendingEmail || "your email";
  const phoneLabel = verificationState.maskedPhoneNumber || "your phone number";
  const preview = verificationState.preview;
  const previewMode = verificationState.previewMode;
  const emailDeliveryLabel = previewMode ? "Email code ready" : "Email code sent";
  const phoneDeliveryLabel = previewMode ? "SMS code ready" : "SMS code sent";
  const verificationHeadline = showPhoneVerification
    ? "Verify your email and phone before we open the farm."
    : "Verify your email before we open the farm.";
  const verificationSubtitle = showPhoneVerification
    ? "Enter the latest codes from your inbox and SMS."
    : "Enter the latest code from your inbox.";

  return (
    <PageWrapper>
      {loading && <PageLoader label="Verifying your contact details..." />}
      <div className="relative app-full bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 text-slate-800 dark:from-darkbg dark:via-[#0A0A0F] dark:to-[#111827] dark:text-darkText">
        <AuthWatermark />
        <AuthThemeSwitcher />
        <GlassToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "info" })}
        />

        <Link
          to="/auth/login"
          className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <div className="relative z-10 mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 px-4 pb-6 pt-20 sm:pb-8 sm:pt-24 md:grid-cols-[0.95fr_1.05fr] md:items-center">
          <div className="hidden md:flex md:flex-col md:gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
              <ShieldCheck className="h-4 w-4" style={{ color: brandAccentColor }} />
              Secure contact verification
            </div>
            <div className="flex items-center gap-3">
              <div className="grid h-16 w-16 place-items-center overflow-hidden">
                <img
                  src={kfarmsLogo}
                  alt="KFarms"
                  className="h-full w-full scale-[2] object-contain saturate-110 contrast-110"
                />
              </div>
              <div className="text-5xl font-header" style={{ color: brandPrimaryColor }}>
                KFarms
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="max-w-xl text-4xl font-semibold leading-tight">
                {verificationHeadline}
              </h1>
              <p className="max-w-xl text-base text-slate-600 dark:text-slate-300">
                {showPhoneVerification
                  ? "This helps us deliver alerts, password recovery, billing updates, and urgent support replies to the right person every time."
                  : "Confirm your email now, then add a phone number later from Settings whenever you want SMS alerts and recovery options."}
              </p>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-soft dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start gap-3">
                  <MailCheck className="mt-0.5 h-5 w-5 text-accent-primary" />
                  <div>
                    <div className="font-semibold">{emailDeliveryLabel}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">{emailLabel}</div>
                  </div>
                </div>
              </div>
              {showPhoneVerification ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-soft dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-start gap-3">
                    <MessageSquareMore className="mt-0.5 h-5 w-5 text-emerald-500" />
                    <div>
                      <div className="font-semibold">{phoneDeliveryLabel}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">{phoneLabel}</div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <AuthCard
              title={showPhoneVerification ? "Verify your contact details" : "Verify your email"}
              subtitle={verificationSubtitle}
              trustText={getAuthTrustText("signup")}
              accentColor={brandPrimaryColor}
              className="w-full max-w-2xl"
            >
              <form onSubmit={handleVerify} noValidate className="space-y-4">
                {inlineError ? (
                  <div className="rounded-2xl border border-red-300/60 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
                    {inlineError}
                  </div>
                ) : null}

                {!pendingEmail ? (
                  <div className="rounded-2xl border border-amber-300/60 bg-amber-50 px-3.5 py-3 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
                    We could not find the pending signup session. Sign up again or log in and request
                    a fresh verification code.
                  </div>
                ) : null}

                <div className="grid gap-4">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Email verification
                        </div>
                        <div className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                          {emailLabel}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleResend("EMAIL")}
                        disabled={!pendingEmail || Boolean(resendingChannel)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${resendingChannel === "EMAIL" ? "animate-spin" : ""}`} />
                        Resend email code
                      </button>
                    </div>

                    <div className="mt-4">
                      <FloatingInput
                        label={verificationState.emailVerified ? "Email verified" : "Email code"}
                        value={verificationState.emailVerified ? "Verified" : form.emailCode}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, emailCode: event.target.value }))
                        }
                        autoComplete="one-time-code"
                        disabled={verificationState.emailVerified || !pendingEmail}
                        required={!verificationState.emailVerified}
                      />
                    </div>
                  </div>

                  {showPhoneVerification ? (
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            SMS verification
                          </div>
                          <div className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                            {phoneLabel}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleResend("SMS")}
                          disabled={!pendingEmail || Boolean(resendingChannel)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${resendingChannel === "SMS" ? "animate-spin" : ""}`} />
                          Resend SMS code
                        </button>
                      </div>

                      <div className="mt-4">
                        <FloatingInput
                          label={verificationState.phoneVerified ? "Phone verified" : "SMS code"}
                          value={verificationState.phoneVerified ? "Verified" : form.phoneCode}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, phoneCode: event.target.value }))
                          }
                          autoComplete="one-time-code"
                          disabled={verificationState.phoneVerified || !pendingEmail}
                          required={requiresPhoneVerification}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                      Phone is optional during signup. You can add it later from Settings if you want SMS alerts.
                    </div>
                  )}
                </div>

                {previewMode ? (
                  <div className="rounded-2xl border border-sky-300/50 bg-sky-50 px-3.5 py-3 text-sm text-sky-800 dark:border-sky-400/30 dark:bg-sky-500/10 dark:text-sky-200">
                    <div className="font-semibold">Preview mode is enabled</div>
                    <div className="mt-1 leading-6">
                      Live email and SMS delivery are not configured yet, so this environment is
                      showing the current verification codes on-screen instead.
                    </div>
                    {preview?.emailCode || preview?.phoneCode ? (
                      <div className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-sky-700 dark:text-sky-100/80">
                        {preview?.emailCode ? `Email code ${preview.emailCode}` : ""}
                        {preview?.emailCode && preview?.phoneCode ? " · " : ""}
                        {preview?.phoneCode ? `SMS code ${preview.phoneCode}` : ""}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Codes expire after a short time. Use the latest ones if you requested a resend.
                </p>

                <div className="flex items-center justify-between gap-3">
                  <Link
                    to="/auth/login"
                    className="text-sm font-medium text-slate-600 transition hover:text-accent-primary dark:text-slate-300"
                  >
                    Finish later
                  </Link>

                  <button
                    type="submit"
                    disabled={!pendingEmail || loading}
                    className="inline-flex items-center gap-2 rounded-xl border border-accent-primary/30 bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        Verify and continue
                      </>
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

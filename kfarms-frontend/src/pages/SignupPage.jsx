import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Droplets,
  Feather,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import AuthCard from "../components/AuthCard";
import AuthThemeSwitcher from "../components/AuthThemeSwitcher";
import AuthWatermark from "../components/AuthWatermark";
import FarmModuleSelector from "../components/FarmModuleSelector";
import FloatingInput from "../components/FloatingInput";
import GlassToast from "../components/GlassToast";
import PageLoader from "../components/PageLoader";
import PageWrapper from "../components/PageWrapper";
import kfarmsLogo from "../assets/Kfarms_logo.png";
import { getAuthTrustText } from "../constants/authCopy";
import { useAuth } from "../hooks/useAuth";
import { login as loginApi, signUser } from "../services/authService";
import { createTenant } from "../services/tenantService";
import {
  FARM_MODULE_OPTIONS,
  FARM_MODULES,
} from "../tenant/tenantModules";
import { useTenant } from "../tenant/TenantContext";
import { slugifyWorkspaceName } from "../utils/slugify";

const SIGNUP_STEPS = [
  {
    id: "account",
    eyebrow: "Step 1 of 3",
    title: "Create your account",
    description: "Start with the person opening this workspace.",
    icon: UserRound,
  },
  {
    id: "farm",
    eyebrow: "Step 2 of 3",
    title: "Name your farm",
    description: "Set the farm name and the link people will use.",
    icon: Building2,
  },
  {
    id: "modules",
    eyebrow: "Step 3 of 3",
    title: "Choose your modules",
    description: "Pick Poultry, Fish Farming, or both, then review and finish.",
    icon: Sparkles,
  },
];

function extractErrorMessage(error, fallback) {
  const payload = error?.response?.data;
  if (typeof payload === "string" && payload.trim()) return payload;
  if (typeof payload?.message === "string" && payload.message.trim()) {
    return payload.message;
  }
  if (typeof payload?.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  return fallback;
}

function looksLikeEmail(value) {
  return /\S+@\S+\.\S+/.test(String(value || "").trim());
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { refreshMe } = useAuth();
  const { ensureActiveTenant, refreshTenants, setActiveTenant } = useTenant();
  const recoveryRedirectRef = React.useRef(null);
  const brandName = "KFarms";
  const brandLogo = kfarmsLogo;
  const brandPrimaryColor = "#2563EB";
  const brandAccentColor = "#10B981";
  const [form, setForm] = React.useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    farmName: "",
    farmSlug: "",
    modules: [FARM_MODULES.POULTRY],
  });
  const [slugEdited, setSlugEdited] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [inlineError, setInlineError] = React.useState("");
  const [toast, setToast] = React.useState({ message: "", type: "" });
  const [currentStep, setCurrentStep] = React.useState(0);

  const accountStepComplete = Boolean(
    form.email.trim() &&
      form.username.trim() &&
      form.password.length >= 8 &&
      form.confirmPassword &&
      form.password === form.confirmPassword,
  );
  const farmStepComplete = Boolean(
    form.farmName.trim() && slugifyWorkspaceName(form.farmSlug || form.farmName),
  );
  const modulesStepComplete = Array.isArray(form.modules) && form.modules.length > 0;
  const selectedModuleOptions = React.useMemo(
    () => FARM_MODULE_OPTIONS.filter((option) => form.modules.includes(option.id)),
    [form.modules],
  );
  const canSubmitSignup =
    accountStepComplete && farmStepComplete && modulesStepComplete && !loading;

  React.useEffect(() => {
    if (slugEdited) return;
    setForm((current) => ({
      ...current,
      farmSlug: slugifyWorkspaceName(current.farmName),
    }));
  }, [form.farmName, slugEdited]);

  React.useEffect(() => {
    if (!inlineError) return;
    const timer = setTimeout(() => setInlineError(""), 4000);
    return () => clearTimeout(timer);
  }, [inlineError]);

  React.useEffect(() => {
    setInlineError("");
  }, [currentStep]);

  React.useEffect(() => {
    return () => {
      if (recoveryRedirectRef.current) {
        window.clearTimeout(recoveryRedirectRef.current);
      }
    };
  }, []);

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function validateStep(stepIndex) {
    const email = form.email.trim();
    const username = form.username.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;
    const farmName = form.farmName.trim();
    const farmSlug = slugifyWorkspaceName(form.farmSlug || form.farmName);
    const modules = Array.isArray(form.modules) ? form.modules : [];

    if (stepIndex === 0) {
      if (!email || !username || !password || !confirmPassword) {
        setInlineError("Please complete your account details.");
        return false;
      }

      if (!looksLikeEmail(email)) {
        setInlineError("Please enter a valid email address.");
        return false;
      }

      if (password.length < 8) {
        setInlineError("Use at least 8 characters for your password.");
        return false;
      }

      if (password !== confirmPassword) {
        setInlineError("Your password confirmation does not match.");
        return false;
      }

      return true;
    }

    if (stepIndex === 1) {
      if (!farmName || !farmSlug) {
        setInlineError("Please add your farm name and farm link.");
        return false;
      }

      return true;
    }

    if (modules.length === 0) {
      setInlineError("Choose at least one module to start with.");
      return false;
    }

    return true;
  }

  function goToNextStep() {
    if (!validateStep(currentStep)) return;
    setCurrentStep((step) => Math.min(step + 1, SIGNUP_STEPS.length - 1));
  }

  function goToPreviousStep() {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  function redirectToLoginAfterRecovery(message, email) {
    setInlineError(message);

    if (recoveryRedirectRef.current) {
      window.clearTimeout(recoveryRedirectRef.current);
    }

    recoveryRedirectRef.current = window.setTimeout(() => {
      navigate("/auth/login", {
        replace: true,
        state: {
          signupRecoveryMessage: message,
          prefillIdentifier: email,
        },
      });
    }, 1800);
  }

  async function completeSignup() {
    const email = form.email.trim();
    const username = form.username.trim();
    const password = form.password;
    const farmName = form.farmName.trim();
    const farmSlug = slugifyWorkspaceName(form.farmSlug || form.farmName);
    const modules = Array.isArray(form.modules) ? form.modules : [];
    let accountCreated = false;

    setLoading(true);

    try {
      await signUser({ email, username, password });
      accountCreated = true;
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
        Number(
          tenantList.find((tenant) => String(tenant?.slug) === farmSlug)?.tenantId,
        );

      if (createdTenantId) {
        setActiveTenant(createdTenantId);
      } else {
        ensureActiveTenant(tenantList);
      }

      setToast({
        message: "Your farm is ready. Taking you inside now.",
        type: "success",
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const createFarmFallback =
        "Your account was created, but we could not finish the farm setup.";
      const loginFallback =
        "Your account is ready, but we could not sign you in automatically.";

      const looksLikeFarmSetupFailure =
        error?.config?.url?.includes?.("/tenants") ||
        error?.response?.config?.url?.includes?.("/tenants");

      if (accountCreated) {
        if (looksLikeFarmSetupFailure) {
          await refreshMe().catch(() => {});
        }

        redirectToLoginAfterRecovery(
          extractErrorMessage(
            error,
            looksLikeFarmSetupFailure ? createFarmFallback : loginFallback,
          ),
          email,
        );
        return;
      }

      setInlineError(extractErrorMessage(error, loginFallback));
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    setInlineError("");

    if (currentStep < SIGNUP_STEPS.length - 1) {
      goToNextStep();
      return;
    }

    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      return;
    }

    await completeSignup();
  }

  return (
    <PageWrapper>
      {loading && <PageLoader label="Creating your account and farm..." />}
      <div className="relative app-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 text-slate-800 dark:from-darkbg dark:via-[#0A0A0F] dark:to-[#111827] dark:text-darkText">
        <AuthWatermark />
        <AuthThemeSwitcher />
        <Link
          to="/"
          className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
          aria-label="Back to landing page"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <GlassToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "" })}
        />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-0 py-5 sm:px-2 sm:py-6 lg:gap-8 lg:px-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="hidden lg:flex lg:flex-col lg:gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
              <Sparkles className="h-4 w-4" style={{ color: brandAccentColor }} />
              One friendly setup
            </div>

            <div className="flex items-center gap-3">
              <div className="grid h-16 w-16 place-items-center overflow-hidden">
                <img
                  src={brandLogo}
                  alt={brandName}
                  className="h-full w-full scale-[2] object-contain saturate-110 contrast-110"
                />
              </div>
              <div className="text-5xl font-header" style={{ color: brandPrimaryColor }}>
                {brandName}
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="max-w-xl text-4xl font-semibold leading-tight">
                Sign up in 3 simple steps.
              </h1>
              <p className="max-w-xl text-base text-slate-600 dark:text-slate-300">
                Create your account, name your farm, choose Poultry, Fish Farming, or both,
                and walk straight into a ready-to-use workspace.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {SIGNUP_STEPS.map((step, index) => {
                const active = index === currentStep;
                const complete = index < currentStep;
                return (
                <div
                  key={step.id}
                  className={`rounded-2xl border p-4 text-sm shadow-soft transition dark:shadow-dark ${
                    active
                      ? "border-emerald-300/80 bg-emerald-50/90 text-slate-800 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-slate-100"
                      : "border-slate-200/70 bg-white/75 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  }`}
                >
                  <div className="inline-flex items-center gap-2">
                    <div
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                        complete || active
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-slate-200/80 text-slate-500 dark:bg-white/10 dark:text-slate-300"
                      }`}
                    >
                      {complete ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        React.createElement(step.icon, { className: "h-4 w-4" })
                      )}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Step {index + 1}
                    </div>
                  </div>
                  <p className="mt-3 font-semibold">{step.title}</p>
                  <p className="mt-1 leading-relaxed">{step.description}</p>
                </div>
                );
              })}
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white/75 p-5 shadow-soft dark:border-white/10 dark:bg-white/5">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-200">
                <ShieldCheck className="h-4 w-4" />
                What happens next
              </div>
              <div className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300">
                <div>1. We create your secure account.</div>
                <div>2. We open your farm workspace immediately.</div>
                <div>3. We show only the modules you picked so the app feels focused.</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <AuthCard
              title="Create your farm account"
              subtitle="Three simple steps. No long signup wall."
              trustText={getAuthTrustText("signup")}
              accentColor={brandPrimaryColor}
              className="w-full max-w-2xl"
            >
              <form onSubmit={handleSignup} noValidate className="space-y-4 sm:space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/85 px-3 py-2.5 sm:hidden dark:border-white/10 dark:bg-white/5">
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Step {currentStep + 1} of {SIGNUP_STEPS.length}
                      </div>
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {SIGNUP_STEPS[currentStep].title}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {SIGNUP_STEPS.map((step, index) => (
                        <span
                          key={`${step.id}-mobile-step`}
                          className={`h-2.5 rounded-full transition-all ${
                            index < currentStep
                              ? "w-6 bg-emerald-400"
                              : index === currentStep
                                ? "w-8 bg-accent-primary"
                                : "w-2.5 bg-slate-300/90 dark:bg-white/15"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="hidden flex-wrap gap-2 sm:flex">
                    {SIGNUP_STEPS.map((step, index) => {
                      const active = index === currentStep;
                      const complete = index < currentStep;
                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => {
                            if (index < currentStep) {
                              setCurrentStep(index);
                            }
                          }}
                          disabled={index > currentStep}
                          className={`flex min-w-[140px] flex-1 items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                            active
                              ? "border-accent-primary/35 bg-accent-primary/8"
                              : "border-slate-200/80 bg-slate-50/70 dark:border-white/10 dark:bg-white/5"
                          } ${index > currentStep ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          <span
                            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                              complete || active
                                ? "bg-accent-primary/15 text-accent-primary"
                                : "bg-slate-200/80 text-slate-500 dark:bg-white/10 dark:text-slate-300"
                            }`}
                          >
                            {complete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-xs uppercase tracking-[0.14em] text-slate-400">
                              Step {index + 1}
                            </span>
                            <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {step.title}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="hidden grid-cols-3 gap-2 sm:grid">
                    {SIGNUP_STEPS.map((step, index) => (
                      <div
                        key={`${step.id}-bar`}
                        className={`h-1.5 rounded-full transition ${
                          index <= currentStep
                            ? "bg-gradient-to-r from-accent-primary to-emerald-400"
                            : "bg-slate-200/80 dark:bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {inlineError && (
                  <div className="rounded-2xl border border-red-300/60 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
                    {inlineError}
                  </div>
                )}

                <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5 sm:p-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:bg-white/10 dark:text-slate-300">
                    {SIGNUP_STEPS[currentStep].eyebrow}
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl">
                      {SIGNUP_STEPS[currentStep].title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {SIGNUP_STEPS[currentStep].description}
                    </p>
                  </div>

                  {currentStep === 0 ? (
                    <div className="mt-4 space-y-3.5 sm:mt-5 sm:space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                        <FloatingInput
                          label="Email"
                          value={form.email}
                          onChange={(event) => updateField("email", event.target.value)}
                          autoComplete="email"
                          type="email"
                          required
                        />
                        <FloatingInput
                          label="Username"
                          value={form.username}
                          onChange={(event) => updateField("username", event.target.value)}
                          autoComplete="username"
                          required
                        />
                        <FloatingInput
                          label="Password"
                          value={form.password}
                          onChange={(event) => updateField("password", event.target.value)}
                          type="password"
                          autoComplete="new-password"
                          required
                        />
                        <FloatingInput
                          label="Confirm password"
                          value={form.confirmPassword}
                          onChange={(event) =>
                            updateField("confirmPassword", event.target.value)
                          }
                          type="password"
                          autoComplete="new-password"
                          required
                        />
                      </div>
                      <div className="rounded-2xl border border-slate-200/70 bg-white/80 px-3.5 py-2.5 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                        Use a password with at least 8 characters so your farm account starts secure.
                      </div>
                    </div>
                  ) : null}

                  {currentStep === 1 ? (
                    <div className="mt-4 space-y-3.5 sm:mt-5 sm:space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                        <FloatingInput
                          label="Farm name"
                          value={form.farmName}
                          onChange={(event) => updateField("farmName", event.target.value)}
                          required
                        />
                        <FloatingInput
                          label="Farm link"
                          value={form.farmSlug}
                          onChange={(event) => {
                            setSlugEdited(true);
                            updateField("farmSlug", slugifyWorkspaceName(event.target.value));
                          }}
                          required
                        />
                      </div>
                      <div className="rounded-2xl border border-slate-200/70 bg-white/80 px-3.5 py-2.5 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                        We suggest the farm link from your farm name automatically, and you can still
                        adjust it if you want something cleaner.
                      </div>
                    </div>
                  ) : null}

                  {currentStep === 2 ? (
                    <div className="mt-4 space-y-4 sm:mt-5 sm:space-y-5">
                      <FarmModuleSelector
                        value={form.modules}
                        onChange={(modules) => updateField("modules", modules)}
                        compact
                      />

                      <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
                        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-3.5 dark:border-white/10 dark:bg-white/5 sm:p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Your setup summary
                          </div>
                          <div className="mt-3 space-y-3 text-sm text-slate-700 dark:text-slate-200">
                            <div className="flex items-start gap-3">
                              <UserRound className="mt-0.5 h-4 w-4 text-accent-primary" />
                              <div>
                                <div className="font-semibold">{form.username || "Your username"}</div>
                                <div className="text-slate-500 dark:text-slate-400">
                                  {form.email || "Add your email in step one"}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Building2 className="mt-0.5 h-4 w-4 text-accent-primary" />
                              <div>
                                <div className="font-semibold">{form.farmName || "Your farm name"}</div>
                                <div className="text-slate-500 dark:text-slate-400">
                                  {slugifyWorkspaceName(form.farmSlug || form.farmName) || "your-farm-link"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-3.5 dark:border-white/10 dark:bg-white/5 sm:p-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Selected modules
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedModuleOptions.length > 0 ? (
                              selectedModuleOptions.map((option) => (
                                <div
                                  key={option.id}
                                  className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                                >
                                  {option.id === FARM_MODULES.POULTRY ? (
                                    <Feather className="h-4 w-4 text-amber-500" />
                                  ) : (
                                    <Droplets className="h-4 w-4 text-cyan-500" />
                                  )}
                                  {option.label}
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                Pick at least one module to continue.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:pt-4">
                  <Link
                    to="/auth/login"
                    className="text-sm text-slate-700 transition hover:text-accent-primary dark:text-darkText"
                  >
                    I already have an account
                  </Link>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row">
                    {currentStep > 0 ? (
                      <button
                        type="button"
                        onClick={goToPreviousStep}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </button>
                    ) : null}

                    <button
                      type={currentStep < SIGNUP_STEPS.length - 1 ? "button" : "submit"}
                      onClick={
                        currentStep < SIGNUP_STEPS.length - 1 ? goToNextStep : undefined
                      }
                      disabled={currentStep < SIGNUP_STEPS.length - 1 ? loading : !canSubmitSignup}
                      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-accent-primary/40 bg-accent-primary px-4 py-3 text-sm font-header text-white transition ${
                        loading ? "pointer-events-none opacity-70" : "hover:brightness-105"
                      }`}
                    >
                      {currentStep < SIGNUP_STEPS.length - 1 ? (
                        <>
                          Continue
                          <ArrowRight className="h-4 w-4" />
                        </>
                      ) : loading ? (
                        "Setting up your farm..."
                      ) : (
                        "Create account and farm"
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs leading-relaxed text-slate-400 sm:items-center">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Secure signup, farm-by-farm data separation, and module-based setup.
                </div>
              </form>
            </AuthCard>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

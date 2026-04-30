import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Droplets,
  Feather,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toKfarmsAppPath } from "../apps/kfarms/paths";
import AuthCard from "../components/AuthCard";
import AuthThemeSwitcher from "../components/AuthThemeSwitcher";
import AuthWatermark from "../components/AuthWatermark";
import FarmModuleSelector from "../components/FarmModuleSelector";
import FloatingInput from "../components/FloatingInput";
import GlassToast from "../components/GlassToast";
import PageLoader from "../components/PageLoader";
import PageWrapper from "../components/PageWrapper";
import { useAuth } from "../hooks/useAuth";
import kfarmsLogo from "../assets/Kfarms_logo.png";
import { getAuthTrustText } from "../constants/authCopy";
import { signUser } from "../services/authService";
import { createTenant } from "../services/tenantService";
import { useTenant } from "../tenant/TenantContext";
import {
  FARM_MODULE_OPTIONS,
  FARM_MODULES,
} from "../tenant/tenantModules";
import { slugifyWorkspaceName } from "../utils/slugify";
import {
  ACCOUNT_PASSWORD_MIN_LENGTH,
  getAccountPasswordChecks,
  looksLikeEmail,
  normalizeEmail,
  validateAccountPassword,
} from "../utils/accountValidation";

const SIGNUP_STEPS = [
  {
    id: "account",
    eyebrow: "Step 1 of 3",
    title: "Create your account",
    description: "Start with your login details. Add phone and verification later.",
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

function resolveCreatedTenantId(createdTenant, tenantList, farmSlug) {
  const list = Array.isArray(tenantList) ? tenantList : [];
  return (
    Number(createdTenant?.tenantId) ||
    Number(
      list.find((tenant) => String(tenant?.slug || "").trim() === farmSlug)?.tenantId,
    ) ||
    null
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { login, refreshMe } = useAuth();
  const { refreshTenants, ensureActiveTenant, setActiveTenant, resetTenantState } = useTenant();
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
    modules: [],
  });
  const [slugEdited, setSlugEdited] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [inlineError, setInlineError] = React.useState("");
  const [toast, setToast] = React.useState({ message: "", type: "" });
  const [currentStep, setCurrentStep] = React.useState(0);
  const signupCardRef = React.useRef(null);
  const previousStepRef = React.useRef(0);

  const accountStepComplete = Boolean(
    looksLikeEmail(form.email) &&
      form.username.trim() &&
      !validateAccountPassword(form.password, ACCOUNT_PASSWORD_MIN_LENGTH) &&
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
  const passwordChecks = React.useMemo(
    () => getAccountPasswordChecks(form.password, ACCOUNT_PASSWORD_MIN_LENGTH),
    [form.password],
  );
  const passwordRequirements = React.useMemo(
    () => [
      {
        id: "length",
        label: `At least ${ACCOUNT_PASSWORD_MIN_LENGTH} characters`,
        met: passwordChecks.hasMinimumLength,
      },
      {
        id: "letter",
        label: "Contains a letter",
        met: passwordChecks.hasLetter,
      },
      {
        id: "number",
        label: "Contains a number",
        met: passwordChecks.hasNumber,
      },
      {
        id: "match",
        label: "Passwords match",
        met: Boolean(form.confirmPassword) && form.password === form.confirmPassword,
      },
    ],
    [form.confirmPassword, form.password, passwordChecks],
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

    if (previousStepRef.current === currentStep) {
      return;
    }

    previousStepRef.current = currentStep;

    const frameId = window.requestAnimationFrame(() => {
      signupCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [currentStep]);

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

      const passwordError = validateAccountPassword(password, ACCOUNT_PASSWORD_MIN_LENGTH);
      if (passwordError) {
        setInlineError(passwordError);
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

  async function completeSignup() {
    const email = normalizeEmail(form.email);
    const username = form.username.trim();
    const password = form.password;
    const farmName = form.farmName.trim();
    const farmSlug = slugifyWorkspaceName(form.farmSlug || form.farmName);
    const modules = Array.isArray(form.modules) ? form.modules : [];

    setLoading(true);
    try {
      try {
        await signUser({ email, username, password });
      } catch (error) {
        setInlineError(
          extractErrorMessage(error, "We could not create your account right now."),
        );
        return;
      }

      try {
        await login({ identifier: email, password });
        resetTenantState();
      } catch (error) {
        navigate("/auth/login", {
          replace: true,
          state: {
            prefillIdentifier: email,
            signupRecoveryMessage:
              extractErrorMessage(
                error,
                "Your account is ready. Please sign in to finish setting up your workspace.",
              ) || "Your account is ready. Please sign in to continue.",
          },
        });
        return;
      }

      try {
        const createdTenant = await createTenant({
          name: farmName,
          slug: farmSlug,
          modules,
        });
        const tenantList = await refreshTenants({ force: true });
        const createdTenantId = resolveCreatedTenantId(createdTenant, tenantList, farmSlug);
        if (createdTenantId) {
          setActiveTenant(createdTenantId);
        } else {
          ensureActiveTenant(tenantList, { redirectIfEmpty: false });
        }
        await refreshMe().catch(() => null);
        navigate(toKfarmsAppPath("/dashboard"), { replace: true });
        return;
      } catch (error) {
        const tenantList = await refreshTenants({ force: true }).catch(() => []);
        const createdTenantId = resolveCreatedTenantId(null, tenantList, farmSlug);
        if (createdTenantId) {
          setActiveTenant(createdTenantId);
          await refreshMe().catch(() => null);
          navigate(toKfarmsAppPath("/dashboard"), { replace: true });
          return;
        }

        navigate("/onboarding/create-tenant", {
          replace: true,
          state: {
            prefill: {
              name: farmName,
              slug: farmSlug,
              modules,
            },
            onboardingError: `${extractErrorMessage(
              error,
              "Your account is ready, but we could not finish the workspace setup automatically.",
            )} Finish the workspace setup below.`,
          },
        });
        return;
      }
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
      {loading && <PageLoader label="Creating your account and workspace..." />}
      <div className="relative min-h-screen overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 text-slate-800 dark:from-darkbg dark:via-[#0A0A0F] dark:to-[#111827] dark:text-darkText">
        <AuthWatermark />
        <AuthThemeSwitcher />
        <Link
          to="/"
          className="absolute left-3 top-3 z-20 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20 sm:left-4 sm:top-4"
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

        <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-4 px-0 py-10 sm:px-2 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,44rem)] lg:gap-6 lg:px-4 lg:py-12">
          <div className="hidden lg:flex lg:flex-col lg:gap-5">
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
                then verify contact details later from settings when the workspace is ready.
              </p>
            </div>

            <div className="grid gap-3">
              {SIGNUP_STEPS.map((step, index) => {
                const active = index === currentStep;
                const complete = index < currentStep;
                return (
                  <div
                    key={step.id}
                    className={`rounded-2xl border px-4 py-4 shadow-soft transition dark:shadow-dark ${
                      active
                        ? "border-emerald-300/80 bg-emerald-50/90 text-slate-800 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-slate-100"
                        : "border-slate-200/70 bg-white/75 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                          complete || active
                            ? "bg-emerald-500/15 text-emerald-500"
                            : "bg-slate-200/80 text-slate-500 dark:bg-white/10 dark:text-slate-300"
                        }`}
                      >
                        {complete ? (
                          <Check className="h-4 w-4" strokeWidth={3} />
                        ) : (
                          React.createElement(step.icon, { className: "h-4 w-4" })
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Step {index + 1}
                        </div>
                        <p className="mt-1 text-lg font-semibold leading-tight">{step.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            ref={signupCardRef}
            className="flex min-h-[calc(100vh-7rem)] items-center justify-center lg:min-h-0"
          >
            <AuthCard
              title="Create your farm account"
              subtitle="Three simple steps. Phone and verification come after setup."
              trustText={getAuthTrustText("signup")}
              accentColor={brandPrimaryColor}
              className="w-full max-w-2xl lg:max-w-[44rem] lg:p-6"
            >
              <form onSubmit={handleSignup} noValidate className="space-y-3.5 sm:space-y-4">
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/85 px-3 py-2 sm:hidden dark:border-white/10 dark:bg-white/5">
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
                            {complete ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
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

                <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5 sm:p-5 lg:p-4">
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
                    <div className="mt-4 space-y-3.5 sm:mt-5 sm:space-y-4 lg:mt-4 lg:space-y-3">
                      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
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
                      <div className="rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-3 dark:border-white/10 dark:bg-white/5">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Password checklist
                        </div>
                        <div className="mt-2 grid gap-2 lg:grid-cols-2">
                          {passwordRequirements.map((requirement) => (
                            <div
                              key={requirement.id}
                              className={`inline-flex items-center gap-2 text-xs sm:text-sm ${
                                requirement.met
                                  ? "text-emerald-700 dark:text-emerald-200"
                                  : "text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              <span
                                className={`inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                                  requirement.met
                                    ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-200"
                                    : "border-slate-300 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
                                }`}
                              >
                                {requirement.met ? "✓" : ""}
                              </span>
                              <span>{requirement.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {currentStep === 1 ? (
                    <div className="mt-3.5 space-y-3 sm:mt-4 sm:space-y-4">
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
                    <div className="mt-3.5 space-y-3.5 sm:mt-4 sm:space-y-5">
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
                                <div className="text-slate-500 dark:text-slate-400">
                                  Add your phone number later from Settings
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

                <div className="flex flex-col gap-2.5 border-t border-slate-200/80 pt-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:pt-4">
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

                <div className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-400 sm:items-center sm:text-xs">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Secure signup, farm-by-farm data separation, and module-based setup.
                </div>

                <div className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-xs">
                  By creating an account, you agree to the{" "}
                  <Link
                    className="font-semibold text-accent-primary"
                    to="/terms"
                    state={{ returnTo: "/auth/signup" }}
                  >
                    Terms & Conditions
                  </Link>
                  .
                </div>
              </form>
            </AuthCard>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

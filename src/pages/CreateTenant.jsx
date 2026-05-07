import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Home,
  LogOut,
  Sparkles,
  Users2,
} from "lucide-react";
import { toKfarmsAppPath } from "../apps/kfarms/paths";
import PageWrapper from "../components/PageWrapper";
import AuthThemeSwitcher from "../components/AuthThemeSwitcher";
import AuthWatermark from "../components/AuthWatermark";
import Badge from "../components/Badge";
import FarmModuleSelector from "../components/FarmModuleSelector";
import { useTenant } from "../tenant/TenantContext";
import { useAuth } from "../hooks/useAuth";
import { createTenant } from "../services/tenantService";
import { getEnabledModuleOptions } from "../tenant/tenantModules";
import { slugifyWorkspaceName } from "../utils/slugify";

const ACTION_BUTTON_CLASS =
  "inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20";

const PANEL_CLASS =
  "rounded-[1.75rem] border border-slate-200/80 bg-white/82 p-5 shadow-[0_24px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55 dark:shadow-[0_24px_48px_rgba(2,6,23,0.34)] sm:p-6";

const SECTION_BADGE_BASE_CLASS =
  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm";

const QUICK_SETUP_BADGE_CLASS =
  `${SECTION_BADGE_BASE_CLASS} border-emerald-200/90 bg-emerald-100/95 text-emerald-900 dark:border-emerald-300/45 dark:bg-emerald-500/28 dark:text-emerald-50`;

const SETUP_GUIDE_BADGE_CLASS =
  `${SECTION_BADGE_BASE_CLASS} border-violet-200/90 bg-violet-100/95 text-violet-900 dark:border-violet-300/45 dark:bg-violet-500/28 dark:text-violet-50`;

const SETUP_GUIDE = [
  "Name the farm and confirm the workspace link.",
  "Choose the modules you want active from day one.",
  "Invite teammates, verify contacts, and refine settings later.",
];

function readErrorMessage(error) {
  const data = error?.response?.data;
  if (typeof data === "string") return data;
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  return "We couldn't create your farm right now. Please check your connection and try again.";
}

export default function CreateTenant() {
  const navigate = useNavigate();
  const location = useLocation();
  const postCreateRedirect =
    typeof location.state?.postCreateRedirect === "string"
      ? location.state.postCreateRedirect
      : "";
  const { logout } = useAuth();
  const {
    tenants,
    activeTenantId,
    loadingTenants,
    tenantSwitchMessage,
    refreshTenants,
    setActiveTenant,
    ensureActiveTenant,
    clearTenantSwitchMessage,
  } = useTenant();

  const prefill = location.state?.prefill || {};
  const [name, setName] = React.useState(() => String(prefill.name || ""));
  const [slug, setSlug] = React.useState(() => String(prefill.slug || ""));
  const [slugEdited, setSlugEdited] = React.useState(() => Boolean(prefill.slug));
  const [modules, setModules] = React.useState(() =>
    Array.isArray(prefill.modules) && prefill.modules.length > 0
      ? prefill.modules
      : [],
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState(() => String(location.state?.onboardingError || ""));

  React.useEffect(() => {
    if (slugEdited) return;
    setSlug(slugifyWorkspaceName(name));
  }, [name, slugEdited]);

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

  const switchTenant = (tenantId) => {
    setActiveTenant(tenantId);
    clearTenantSwitchMessage();
    navigate(toKfarmsAppPath("/dashboard"), { replace: true });
  };

  const handleGoHome = () => {
    clearTenantSwitchMessage();

    if (activeTenantId) {
      navigate(toKfarmsAppPath("/dashboard"), { replace: true });
      return;
    }

    const nextTenantId = ensureActiveTenant(tenants, {
      allowFallback: true,
      redirectIfEmpty: false,
    });

    if (nextTenantId) {
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

  const handleCreateTenant = async (event) => {
    event.preventDefault();
    setError("");

    const normalizedName = name.trim();
    const normalizedSlug = slugifyWorkspaceName(slug || name);

    if (!normalizedName) {
      setError("Please enter your farm name.");
      return;
    }

    if (!normalizedSlug) {
      setError("Please enter a short farm link.");
      return;
    }

    if (modules.length === 0) {
      setError("Choose at least one module to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createTenant({
        name: normalizedName,
        slug: normalizedSlug,
        modules,
      });

      const tenantList = await refreshTenants();
      const createdId =
        Number(created?.tenantId) ||
        Number(
          tenantList.find((tenant) => String(tenant?.slug) === normalizedSlug)?.tenantId,
        );

      if (createdId) {
        setActiveTenant(createdId);
      } else {
        ensureActiveTenant(tenantList);
      }

      clearTenantSwitchMessage();
      navigate(postCreateRedirect || toKfarmsAppPath("/dashboard"), { replace: true });
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 py-8 text-slate-900 dark:from-darkbg dark:via-[#0A0A0F] dark:to-[#111827] dark:text-slate-100">
        <AuthWatermark />
        <AuthThemeSwitcher />

        <div className="relative z-10 mx-auto w-full max-w-6xl pt-12 sm:pt-14">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleBack}
              className={ACTION_BUTTON_CLASS}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
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
                onClick={handleGoHome}
                className={ACTION_BUTTON_CLASS}
              >
                <Home className="h-4 w-4" />
                Go home
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
            <section className={PANEL_CLASS}>
              <div className={QUICK_SETUP_BADGE_CLASS}>
                <Building2 className="h-4 w-4" />
                Quick setup
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Create your farm
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Set up the workspace once, choose the right modules, and get your team ready to record clean farm activity from day one.
              </p>

              <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/85 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                You can invite teammates, verify contacts, and refine branding after the workspace is ready.
              </div>

              {tenantSwitchMessage && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
                  {tenantSwitchMessage}
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateTenant} className="mt-6 space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="tenant-name"
                      className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
                    >
                      Farm name
                    </label>
                    <input
                      id="tenant-name"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="K Farms Ltd"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="tenant-slug"
                      className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
                    >
                      Farm link
                    </label>
                    <input
                      id="tenant-slug"
                      type="text"
                      value={slug}
                      onChange={(event) => {
                        setSlugEdited(true);
                        setSlug(slugifyWorkspaceName(event.target.value));
                      }}
                      placeholder="k-farms-ltd"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                    <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      This becomes part of the farm link. We suggest one automatically from the name.
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Modules
                  </div>
                  <FarmModuleSelector
                    value={modules}
                    onChange={setModules}
                    helperText="Start with Poultry, Fish Farming, or both. You can expand the workspace later."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_36px_rgba(16,185,129,0.22)] transition ${
                    submitting
                      ? "cursor-not-allowed bg-emerald-400/70"
                      : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500"
                  }`}
                >
                  {submitting ? "Creating farm..." : "Create my farm"}
                </button>
              </form>

              <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                Already have an invite code?{" "}
                <Link
                  to="/onboarding/accept-invite"
                  className="font-semibold text-emerald-600 hover:text-emerald-500 hover:underline dark:text-emerald-300"
                >
                  Join with invite
                </Link>
              </div>
            </section>

            <div className="space-y-6">
              <section className={PANEL_CLASS}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                      <Users2 className="h-4 w-4" />
                      Your farms
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      Continue with an existing farm
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Already part of a team? Choose a farm below and jump straight back into work.
                    </p>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                    {loadingTenants ? "Loading..." : `${tenants.length} found`}
                  </div>
                </div>

                <div className="mt-5 max-h-[430px] space-y-3 overflow-auto pr-1">
                  {loadingTenants && (
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                      Loading your farms...
                    </div>
                  )}

                  {!loadingTenants && tenants.length === 0 && (
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                      You don&apos;t belong to any farm yet. Create one here or join with an invite code.
                    </div>
                  )}

                  {!loadingTenants &&
                    tenants.map((tenant) => {
                      const tenantId = Number(tenant?.tenantId);
                      const suspended = String(tenant?.status || "").toUpperCase() === "SUSPENDED";
                      return (
                        <div
                          key={tenantId || tenant?.slug || tenant?.name}
                          className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50/90 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="truncate text-base font-semibold text-slate-950 dark:text-white">
                                  {tenant?.name || "Untitled farm"}
                                </div>
                                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  {tenant?.slug ? `${tenant.slug}` : "Farm workspace"}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge kind="plan" value={tenant?.plan || "FREE"} />
                                <Badge kind="role" value={tenant?.roleLabel || tenant?.myRole || "STAFF"} />
                                <Badge kind="status" value={tenant?.status || "ACTIVE"} />
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {getEnabledModuleOptions(tenant).map((module) => (
                                <span
                                  key={`${tenantId}-${module.id}`}
                                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"
                                >
                                  {module.shortLabel}
                                </span>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => switchTenant(tenantId)}
                              disabled={suspended}
                              className={`w-full rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                suspended
                                  ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-500"
                                  : "bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                              }`}
                            >
                              {suspended ? "Temporarily unavailable" : "Open this farm"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </section>

              <section className={PANEL_CLASS}>
                <div className={SETUP_GUIDE_BADGE_CLASS}>
                  <Sparkles className="h-4 w-4" />
                  Setup guide
                </div>
                <div className="mt-4 space-y-3">
                  {SETUP_GUIDE.map((item, index) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]"
                    >
                      <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-white dark:text-slate-900">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

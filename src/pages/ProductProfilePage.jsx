import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Check,
  Users,
  Layers3,
  Menu,
  Mail,
  Monitor,
  Phone,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sun,
  Moon,
  WifiOff,
  X,
} from "lucide-react";
import kfarmsLogo from "../assets/Kfarms_logo.png";
import { useAuth } from "../hooks/useAuth";
import { formatThemePreferenceLabel } from "../constants/settings";
import { useTheme } from "../hooks/useTheme";
import { useTenant } from "../tenant/TenantContext";
import {
  PLAN_FEATURE_MATRIX,
  PLAN_IDS,
  getPlanById,
  isFeatureIncluded,
  normalizePlanId,
} from "../constants/plans";
import { usePlanCatalog } from "../hooks/usePlanCatalog";
import { getPlanBillingInfo, getPlanBillingOptions } from "../services/billingService";
import {
  buildBillingPlanFocusPath,
  buildTalkToSalesPath,
  SALES_MODAL_PARAM,
} from "../utils/billingNavigation";
import { useSalesModal } from "../components/SalesModalProvider";

const PLAN_TONE = {
  FREE: {
    border: "border-blue-300/60 dark:border-blue-300/30",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-400/30 dark:text-blue-50",
    glow: "from-blue-500/14 via-transparent to-cyan-500/12",
    button:
      "border-blue-300/60 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-200/80 dark:bg-blue-300 dark:text-slate-950 dark:hover:bg-blue-200",
  },
  PRO: {
    border: "border-violet-300/60 dark:border-violet-300/30",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-400/30 dark:text-violet-50",
    glow: "from-violet-500/16 via-transparent to-sky-500/12",
    button:
      "border-violet-300/60 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-200/80 dark:bg-violet-300 dark:text-slate-950 dark:hover:bg-violet-200",
  },
  ENTERPRISE: {
    border: "border-emerald-300/60 dark:border-emerald-300/30",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/30 dark:text-emerald-50",
    glow: "from-emerald-500/16 via-transparent to-cyan-500/12",
    button:
      "border-emerald-300/60 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-200/80 dark:bg-emerald-300 dark:text-slate-950 dark:hover:bg-emerald-200",
  },
};

const FOOTER_LINK_GROUPS = [
  {
    title: "Product",
    links: [
      { label: "Top Features", href: "#features" },
      { label: "Offline Mode", href: "#offline" },
      { label: "Plans", href: "#plans" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Workflows",
    links: [
      { label: "Create Farm", to: "/onboarding/create-tenant" },
      { label: "Accept Invite", to: "/onboarding/accept-invite" },
      { label: "Billing", to: "/billing" },
      { label: "Support", href: "mailto:support@kfarms.app" },
    ],
  },
  {
    title: "Access",
    links: [
      { label: "Login", to: "/auth/login" },
      { label: "Signup", to: "/auth/signup" },
      { label: "Terms", to: "/terms" },
      { label: "Workspace", to: "/dashboard" },
      { label: "Help Center", href: "#contact" },
    ],
  },
  {
    title: "KFarms",
    links: [
      { label: "About KFarms", to: "/company-profile" },
      { label: "Overview", to: "/product-profile" },
      { label: "Sales Team", href: "#contact" },
      { label: "Support Team", href: "mailto:support@kfarms.app" },
    ],
  },
];

const HERO_NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Offline Mode", href: "#offline" },
  { label: "Plans", href: "#plans" },
  { label: "Contact", href: "#contact" },
];

const HERO_SUPPORT_ITEMS = [
  {
    title: "Works offline",
    body: "No internet? No problem.",
    icon: WifiOff,
  },
  {
    title: "Auto sync",
    body: "Updates when you're back.",
    icon: RefreshCw,
  },
  {
    title: "Your data, safe",
    body: "Secure and private.",
    icon: ShieldCheck,
  },
];

const PRODUCT_FEATURES = [
  {
    title: "Offline-ready capture",
    description:
      "Record your daily farm work even without internet. Everything syncs automatically later.",
    icon: WifiOff,
    accent: "from-indigo-500/20 via-transparent to-sky-500/20",
    iconBg: "bg-indigo-500/20 text-indigo-400 ring-indigo-400/40",
  },
  {
    title: "Connected operations",
    description:
      "Manage poultry, fish, feed, inventory, and sales in one simple app.",
    icon: Layers3,
    accent: "from-sky-500/20 via-transparent to-indigo-500/20",
    iconBg: "bg-sky-500/20 text-sky-400 ring-sky-400/40",
  },
  {
    title: "Role-based teamwork",
    description:
      "Let workers record data while you stay in control of what they can see and do.",
    icon: Users,
    accent: "from-emerald-500/18 via-transparent to-sky-500/18",
    iconBg: "bg-emerald-500/20 text-emerald-400 ring-emerald-400/40",
  },
  {
    title: "Decision dashboards",
    description:
      "Quickly see if your farm is doing well or needs attention.",
    icon: BarChart3,
    accent: "from-indigo-500/18 via-transparent to-emerald-500/18",
    iconBg: "bg-indigo-500/20 text-indigo-400 ring-indigo-400/40",
  },
];

const OFFLINE_BENEFITS = [
  "Save your work even when network is down",
  "Sync automatically when internet is back",
  "No lost data, no double recording",
];

const OFFLINE_PANELS = [
  {
    title: "Field-safe capture",
    body: "Stock updates, task progress, production entries, and daily records do not have to wait for stable internet.",
  },
  {
    title: "Sync-safe recovery",
    body: "Work returns cleanly after interruptions instead of forcing your team to guess what was saved.",
  },
  {
    title: "Manager confidence",
    body: "Leaders still get a dependable picture once queued work completes, so reporting stays trustworthy.",
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    title: "Record",
    body: "Log eggs, sales, feed, or stock in seconds.",
  },
  {
    title: "Track",
    body: "See everything happening on your farm in one place.",
  },
  {
    title: "Continue offline",
    body: "Keep working even when network fails.",
  },
  {
    title: "Decide better",
    body: "Know if you're making progress or losing money.",
  },
];

function normalizeLimitLabel(label) {
  const raw = String(label || "").trim();
  const normalized = raw.toLowerCase().replace(/\s+/g, " ");
  if (
    normalized === "orgainzaiton" ||
    normalized === "orgainzation" ||
    normalized === "orgainzations" ||
    normalized === "organisation" ||
    normalized === "organisations"
  ) {
    return "Farms";
  }
  return raw;
}

export default function ProductProfilePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, isDark, toggleTheme } = useTheme();
  const [showScrollTop, setShowScrollTop] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [selectedProInterval, setSelectedProInterval] = React.useState("MONTHLY");
  const { openModal } = useSalesModal();
  const { isAuthenticated, user, logout } = useAuth();
  const { activeTenantId, activeTenant, tenants, loadingTenants } = useTenant();
  const planTierConfig = usePlanCatalog();
  const proBillingOptions = React.useMemo(() => getPlanBillingOptions("PRO"), []);
  const themeLabel = formatThemePreferenceLabel(theme);

  const workspacePath = activeTenantId ? "/dashboard" : "/onboarding/create-tenant";
  const workspaceLabel = activeTenantId
    ? "Open Farm"
    : loadingTenants
      ? "Checking your farms..."
      : (tenants?.length || 0) > 0
        ? "Choose farm"
        : "Create farm";
  const planNameById = planTierConfig.reduce((acc, plan) => {
    acc[plan.id] = plan.name;
    return acc;
  }, {});
  const currentTenantPlanId = normalizePlanId(activeTenant?.plan, "FREE");
  const currentTenantPlanName = getPlanById(currentTenantPlanId, "FREE").name;
  const currentYear = new Date().getFullYear();

  React.useEffect(() => {
    const nodes = document.querySelectorAll("[data-reveal]");
    if (!nodes.length) return undefined;

    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    document.title = "KFarms | Farm records";
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 320);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get(SALES_MODAL_PARAM) === "1") {
      openModal();
    }
  }, [location.search, openModal]);

  const handleSignOut = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const heroPrimaryCtaTo = isAuthenticated ? workspacePath : "/auth/signup";
  const heroPrimaryCtaLabel = isAuthenticated ? workspaceLabel : "Start for free";
  const proBillingPath = buildBillingPlanFocusPath("PRO", selectedProInterval);
  const proAuthState = React.useMemo(
    () => ({ postAuthRedirect: proBillingPath }),
    [proBillingPath],
  );

  const handleScrollToTop = React.useCallback(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div
      id="top"
      className={`min-h-screen overflow-x-hidden bg-lightbg dark:bg-darkBg text-lightText dark:text-darkText ${
        isDark ? "dark" : ""
      }`}
      style={{ backgroundColor: isDark ? "#07080b" : "#f9fafb" }}
    >
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
        <button
          type="button"
          onClick={handleScrollToTop}
          className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-700 shadow-neo transition dark:bg-darkCard/70 dark:text-slate-200 dark:shadow-dark ${
            showScrollTop
              ? "translate-y-0 opacity-100 hover:scale-[1.02] hover:bg-white/20"
              : "pointer-events-none translate-y-3 opacity-0"
          }`}
          aria-label="Scroll back to top"
        >
          <ArrowUp className="h-4 w-4 text-emerald-400" />
          Top
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-700 shadow-neo transition hover:scale-[1.02] hover:bg-white/20 dark:bg-darkCard/70 dark:text-slate-200 dark:shadow-dark"
          aria-label={`Theme: ${themeLabel}. Click to cycle theme.`}
          title={`Theme: ${themeLabel}. Click to cycle theme.`}
        >
          {theme === "system" ? (
            <>
              <Monitor className="h-4 w-4 text-sky-400" />
              {themeLabel}
            </>
          ) : (
            theme === "dark" ? (
              <>
                <Moon className="h-4 w-4 text-indigo-400" />
                {themeLabel}
              </>
            ) : (
              <>
                <Sun className="h-4 w-4 text-amber-400" />
                {themeLabel}
              </>
            )
          )}
        </button>
      </div>

      <div className="page-load">
        {/* Hero */}
        <section className="relative overflow-hidden">
          {isDark ? (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(59,130,246,0.22),transparent_34%),radial-gradient(circle_at_86%_8%,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_68%_58%,rgba(6,182,212,0.12),transparent_28%)]" />
              <div className="absolute inset-0 bg-[#061124]" />
              <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(4,16,38,0.94)_0%,rgba(6,18,37,0.9)_40%,rgba(7,50,69,0.7)_100%)]" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_86%_8%,rgba(16,185,129,0.14),transparent_30%),radial-gradient(circle_at_68%_58%,rgba(6,182,212,0.12),transparent_28%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(236,246,255,0.95)_0%,rgba(226,244,247,0.92)_40%,rgba(209,241,238,0.78)_100%)]" />
            </>
          )}
          <div className="pointer-events-none absolute left-[52%] top-[61%] hidden h-[22rem] w-[22rem] rounded-full border border-emerald-400/10 lg:block" />
          <div className="pointer-events-none absolute left-[56%] top-[65%] hidden h-[15rem] w-[15rem] rounded-full border border-cyan-400/10 lg:block" />

          <div className="relative mx-auto max-w-7xl px-6 pb-12 pt-7 sm:pb-14 sm:pt-9 lg:px-8 lg:pb-20">
            <nav className="z-30 mb-10">
              <div className="flex items-center justify-between gap-4 md:hidden">
                <Link
                  to="/product-profile"
                  className="inline-flex items-center gap-3"
                  onClick={() => setMobileNavOpen(false)}
                >
                  <img src={kfarmsLogo} alt="KFarms" className="h-14 w-auto object-contain" />
                  <span className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-50">
                    KFarms
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => setMobileNavOpen((open) => !open)}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-slate-700 transition-all duration-300 ease-out hover:bg-white/20 dark:text-slate-100 ${
                    mobileNavOpen ? "rotate-90 bg-white/15 dark:bg-white/15" : "rotate-0"
                  }`}
                  aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
                  aria-expanded={mobileNavOpen}
                >
                  <span className="relative inline-flex h-4.5 w-4.5 items-center justify-center">
                    <Menu
                      className={`absolute h-4.5 w-4.5 transition-all duration-300 ease-out ${
                        mobileNavOpen ? "scale-75 opacity-0" : "scale-100 opacity-100"
                      }`}
                    />
                    <X
                      className={`absolute h-4.5 w-4.5 transition-all duration-300 ease-out ${
                        mobileNavOpen ? "scale-100 opacity-100" : "scale-75 opacity-0"
                      }`}
                    />
                  </span>
                </button>
              </div>

              <div
                className={`grid transition-all duration-300 ease-out md:hidden ${
                  mobileNavOpen
                    ? "mt-4 grid-rows-[1fr] opacity-100"
                    : "mt-0 grid-rows-[0fr] opacity-0 pointer-events-none"
                }`}
                aria-hidden={!mobileNavOpen}
              >
                <div className="overflow-hidden">
                  <div className="rounded-[1.6rem] border border-white/10 bg-white/10 p-4 shadow-soft backdrop-blur-xl dark:bg-darkCard/[0.55]">
                  <div className="grid gap-2.5">
                    {HERO_NAV_LINKS.map((link) => (
                      <a
                        key={`mobile-${link.label}`}
                        href={link.href}
                        onClick={() => setMobileNavOpen(false)}
                        className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white/10 dark:text-slate-100"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-2.5">
                    {isAuthenticated ? (
                      <>
                        <Link
                          to={workspacePath}
                          onClick={() => setMobileNavOpen(false)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:opacity-90"
                        >
                          {workspaceLabel}
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="rounded-xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white/[0.15] dark:text-slate-100"
                        >
                          Sign out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/auth/login"
                          onClick={() => setMobileNavOpen(false)}
                          className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-white/10 dark:text-slate-100"
                        >
                          Login
                        </Link>
                        <Link
                          to="/auth/signup"
                          onClick={() => setMobileNavOpen(false)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:opacity-90"
                        >
                          Start for free
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
                </div>
              </div>

              <div className="hidden items-center justify-between gap-8 md:flex">
                <Link to="/product-profile" className="inline-flex items-center gap-3">
                  <img src={kfarmsLogo} alt="KFarms" className="h-14 w-auto object-contain" />
                  <span className="text-[1.45rem] font-semibold tracking-tight text-slate-800 dark:text-slate-50">
                    KFarms
                  </span>
                </Link>

                <div className="flex items-center gap-10">
                  {HERO_NAV_LINKS.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  {isAuthenticated ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="text-sm font-semibold text-slate-700 transition hover:text-slate-900 dark:text-slate-100 dark:hover:text-white"
                      >
                        Sign out
                      </button>
                      <Link
                        to={workspacePath}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(45,212,191,0.18)] transition hover:opacity-90"
                      >
                        {workspaceLabel}
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/auth/login"
                        className="text-sm font-semibold text-slate-700 transition hover:text-slate-900 dark:text-slate-100 dark:hover:text-white"
                      >
                        Login
                      </Link>
                      <Link
                        to="/auth/signup"
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(45,212,191,0.18)] transition hover:opacity-90"
                      >
                        Start for free
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </nav>

            <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
              <div className="max-w-2xl min-w-0">
                <h1 className="text-4xl font-header font-semibold leading-[1.02] text-slate-800 dark:text-slate-50 sm:text-5xl lg:text-[4.35rem]">
                  <span className="block">Stop guessing.</span>
                  <span className="mt-2 block">Know what&apos;s happening</span>
                  <span className="mt-2 block">
                    on{" "}
                    <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-500 bg-clip-text text-transparent">
                      your farm.
                    </span>
                  </span>
                </h1>

                <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-[1.08rem]">
                  Track eggs, sales, feed, and stock in one place, even without internet. KFarms
                  keeps your records clear, syncs when you&apos;re back online, and helps you stay
                  in control every day.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to={heroPrimaryCtaTo}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 px-7 py-4 text-base font-semibold text-white shadow-[0_22px_46px_rgba(45,212,191,0.2)] transition hover:opacity-90"
                  >
                    {heroPrimaryCtaLabel}
                    <ArrowUpRight className="h-4.5 w-4.5" />
                  </Link>
                  <a
                    href="#plans"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] px-7 py-4 text-base font-semibold text-slate-700 transition hover:bg-white/[0.14] dark:text-slate-100"
                  >
                    See plans
                  </a>
                </div>

                {!isAuthenticated ? (
                  <div className="mt-5 text-base text-slate-500 dark:text-slate-400">
                    Already have an account?{" "}
                    <Link
                      to="/auth/login"
                      className="font-semibold text-emerald-500 transition hover:text-emerald-400"
                    >
                      Login
                    </Link>
                  </div>
                ) : (
                  <div className="mt-5 text-sm text-slate-500 dark:text-slate-400">
                    Signed in as{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-100">
                      {user?.email || user?.username || "User"}
                    </span>
                    {activeTenant ? (
                      <>
                        {" · "}
                        <span className="font-semibold text-slate-700 dark:text-slate-100">
                          {activeTenant.name}
                        </span>
                        {" · "}
                        {currentTenantPlanName} plan
                      </>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="relative min-w-0 lg:justify-self-end">
                <div className="pointer-events-none absolute -inset-6 rounded-[2.8rem] bg-[radial-gradient(circle_at_38%_28%,rgba(59,130,246,0.18),transparent_40%),radial-gradient(circle_at_76%_26%,rgba(16,185,129,0.14),transparent_35%)] blur-2xl" />
                <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.14] bg-[#091426]/80 p-2 shadow-[0_30px_90px_rgba(2,8,23,0.38)] backdrop-blur-xl">
                  <img
                    src="/hero-dashboard-live-demo.png"
                    alt="Demo KFarms dashboard showing farm metrics, charts, and recent activity."
                    className="block w-full rounded-[1.55rem] border border-white/10 bg-[#091426]"
                    loading="eager"
                  />
                </div>
              </div>
            </div>

            <div className="mt-12 grid gap-4 border-white/10 md:mt-14 md:grid-cols-3 md:gap-0 md:px-3">
              {HERO_SUPPORT_ITEMS.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className={`flex items-start gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.06] px-5 py-4 shadow-soft backdrop-blur-sm md:rounded-none md:border-y-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none ${
                      index === 1 ? "md:border-x md:px-7" : ""
                    } ${index === 0 ? "md:pl-3 md:pr-7" : ""} ${index === 2 ? "md:pl-7 md:pr-3" : ""}`}
                  >
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/[0.12] text-emerald-400 ring-1 ring-emerald-400/[0.18]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="text-lg font-semibold text-slate-800 dark:text-slate-50">
                        {item.title}
                      </div>
                      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {item.body}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      {/* Top Features */}
      <section
        id="features"
        className="max-w-6xl mx-auto px-6 py-12 reveal"
        data-reveal
        style={{ "--reveal-delay": "40ms" }}
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-6">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-indigo-500/10 opacity-80" />
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-header font-semibold">
                What you can actually do with KFarms
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                Used by farmers to track daily eggs, sales, and feed without stress.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/10 text-xs text-slate-500 dark:text-slate-400">
              Simple • Practical • Reliable
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRODUCT_FEATURES.map((item) => {
              const Icon = item.icon;

              return (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 dark:bg-darkCard/70 p-4 shadow-soft dark:shadow-dark card-hover"
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.accent} opacity-80`}
                />
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-100">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10 dark:bg-white/5 ${item.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  {item.title}
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {item.description}
                </div>
              </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link
              to={workspacePath}
              className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 font-semibold hover:bg-white/20 transition"
            >
              {workspaceLabel}
            </Link>
            <a
              href="#plans"
              className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 font-semibold hover:bg-white/20 transition"
            >
              Compare plans
            </a>
          </div>
        </div>
      </section>

      {/* Offline Mode */}
      <section
        id="offline"
        className="max-w-6xl mx-auto px-6 pb-12 reveal"
        data-reveal
        style={{ "--reveal-delay": "80ms" }}
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-5 shadow-neo dark:bg-darkCard/70 dark:shadow-dark sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-indigo-500/10 opacity-70" />
          <div className="relative grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div>
              <h2 className="text-xl font-header font-semibold">
                No internet? No problem.
              </h2>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Keep working, record everything, and sync later when network returns.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                {OFFLINE_BENEFITS.map((item) => (
                  <div
                    key={item}
                    className="rounded-lg border border-white/10 bg-white/5 p-3 shadow-soft dark:bg-darkCard/70 dark:shadow-dark"
                  >
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{item}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-header text-lg font-semibold">
                  Made for busy farm days
                </h3>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Offline-safe flow
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                KFarms keeps daily records simple when work is moving fast, teams are spread out,
                and network is unreliable.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {OFFLINE_PANELS.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-lg border border-white/10 bg-white/5 p-3 shadow-soft dark:bg-darkCard/70 dark:shadow-dark"
                  >
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                      {item.title}
                    </div>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {item.body}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section
        id="plans"
        className="max-w-6xl mx-auto px-6 pb-12"
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-6">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-emerald-500/10 opacity-80" />
          <div className="relative">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-header font-semibold">Plans</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
                  Start simple. Upgrade as your farm grows.
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
                  You can start for free and upgrade only when you need more.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/10 text-xs text-slate-500 dark:text-slate-400">
                Free • Pro • Enterprise
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {planTierConfig.map((plan) => {
                const tone = PLAN_TONE[plan.id] || PLAN_TONE.FREE;
                const isProPlan = plan.id === "PRO";
                const billingInfo = isProPlan ? getPlanBillingInfo("PRO", selectedProInterval) : null;
                const compareAtPriceLabel = isProPlan
                  ? selectedProInterval === "ANNUAL"
                    ? billingInfo?.compareAtLabel || ""
                    : plan.compareAtPriceLabel || ""
                  : plan.compareAtPriceLabel || "";
                const priceLabel = isProPlan
                  ? selectedProInterval === "ANNUAL"
                    ? billingInfo?.priceLabel || plan.priceLabel
                    : plan.priceLabel
                  : plan.priceLabel;
                const cycleLabel = isProPlan
                  ? selectedProInterval === "ANNUAL"
                    ? billingInfo?.cycleLabel || plan.cycleLabel
                    : plan.cycleLabel
                  : plan.cycleLabel;
                const promoNote = isProPlan
                  ? selectedProInterval === "ANNUAL"
                    ? billingInfo?.promoNote || billingInfo?.label || ""
                    : plan.promoNote || ""
                  : plan.promoNote || "";
                let actionPath = plan.ctaPath;
                let actionLabel = plan.ctaLabel;

                if (isAuthenticated) {
                  if (plan.id === "FREE") {
                    actionPath = activeTenantId ? "/billing" : workspacePath;
                    actionLabel = activeTenantId ? "Manage Free Plan" : "Start Free";
                  } else if (plan.id === "PRO") {
                    actionPath = proBillingPath;
                    actionLabel =
                      currentTenantPlanId === "PRO"
                        ? "Manage Pro Plan"
                        : "Upgrade to Pro";
                  } else if (plan.id === "ENTERPRISE") {
                    actionPath =
                      currentTenantPlanId === "ENTERPRISE"
                        ? "/billing"
                        : buildTalkToSalesPath();
                    actionLabel =
                      currentTenantPlanId === "ENTERPRISE"
                        ? "Manage Enterprise Plan"
                        : "Talk to Sales";
                  }
                } else if (plan.id === "PRO") {
                  actionPath = "/auth/signup";
                  actionLabel = plan.ctaLabel;
                }

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col h-full overflow-hidden rounded-xl border bg-white/80 dark:bg-darkCard/70 p-5 shadow-soft dark:shadow-dark card-hover ${tone.border}`}
                  >
                    <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tone.glow} opacity-80`} />
                    <div className="relative flex flex-col h-full">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.badge}`}>
                        {plan.name}
                      </span>
                      {plan.recommended && (
                        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:bg-violet-300 dark:text-slate-950">
                          Most Popular
                        </span>
                      )}
                    </div>
                    {isProPlan ? (
                      <div className="mt-4 rounded-2xl border border-violet-200/80 bg-violet-50/85 p-3 shadow-[0_12px_28px_rgba(124,58,237,0.08)] dark:border-violet-300/15 dark:bg-violet-500/10 dark:shadow-none">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-700 dark:text-violet-200">
                              Pro billing
                            </div>
                            <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                              Choose monthly or annual before checkout.
                            </p>
                          </div>
                          <div className="rounded-full border border-violet-200/80 bg-white/80 px-2 py-1 text-[10px] font-semibold text-violet-700 dark:border-violet-300/15 dark:bg-white/10 dark:text-violet-200">
                            {selectedProInterval === "ANNUAL" ? "Best value" : "Flexible"}
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {proBillingOptions.map((option) => {
                            const optionSelected = selectedProInterval === option.interval;
                            const intervalLabel = option.interval === "ANNUAL" ? "Annual" : "Monthly";
                            return (
                              <button
                                key={option.interval}
                                type="button"
                                onClick={() => setSelectedProInterval(option.interval)}
                                className={`rounded-xl border px-3 py-3 text-left transition ${
                                  optionSelected
                                    ? "border-slate-900 bg-slate-900 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] dark:border-white dark:bg-white dark:text-slate-950"
                                    : "border-violet-200/80 bg-white text-slate-700 hover:bg-violet-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]"
                                }`}
                              >
                                <div className="text-sm font-semibold">{intervalLabel}</div>
                                <div
                                  className={`mt-1 text-[11px] ${
                                    optionSelected
                                      ? "text-white/80 dark:text-slate-700"
                                      : "text-slate-500 dark:text-slate-400"
                                  }`}
                                >
                                  {option.savingsLabel || "Flexible billing"}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                    {(compareAtPriceLabel || priceLabel) ? (
                      <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="flex flex-wrap items-end gap-3">
                          {compareAtPriceLabel ? (
                            <span className="text-base font-semibold text-slate-400 line-through decoration-2 dark:text-slate-500">
                              {compareAtPriceLabel}
                            </span>
                          ) : null}
                          <div className="text-[2rem] font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                            {priceLabel}
                          </div>
                        </div>
                        {cycleLabel ? (
                          <div className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                            {cycleLabel}
                          </div>
                        ) : null}
                        {promoNote ? (
                          <div className="mt-2 inline-flex rounded-full border border-emerald-300/60 bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-500/15 dark:text-emerald-200">
                            {promoNote}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">{plan.tagline}</p>

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {plan.limits.map((limit) => (
                        <div
                          key={`${plan.id}-${limit.label}`}
                          className="min-w-0 rounded-lg border border-slate-200/80 bg-white/70 px-2 py-2 text-center dark:border-white/10 dark:bg-white/5"
                        >
                          <div className="break-words text-[10px] font-medium leading-tight text-slate-500 dark:text-slate-400">
                            {normalizeLimitLabel(limit.label)}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100">{limit.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 space-y-2">
                      {plan.highlights.map((item) => (
                        <div key={item} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="mt-0.5 w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto pt-5">
                      {plan.id === "ENTERPRISE" && currentTenantPlanId !== "ENTERPRISE" ? (
                        <button
                          type="button"
                          onClick={openModal}
                          className={`inline-flex w-full items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold transition ${tone.button}`}
                        >
                          Talk to Sales
                        </button>
                      ) : (
                        <Link
                          to={actionPath}
                          state={!isAuthenticated && isProPlan ? proAuthState : undefined}
                          className={`inline-flex w-full items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold transition ${tone.button}`}
                        >
                          {actionLabel}
                        </Link>
                      )}
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200/80 dark:border-white/10">
              <div className="overflow-x-auto">
                <table className="min-w-[780px] w-full text-sm">
                  <thead className="bg-slate-100/70 dark:bg-white/5 text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]">
                        Feature
                      </th>
                      {PLAN_IDS.map((planId) => (
                        <th
                          key={`matrix-head-${planId}`}
                          className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em]"
                        >
                          {planNameById[planId] || planId}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PLAN_FEATURE_MATRIX.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t border-slate-200/80 text-slate-700 dark:border-white/10 dark:text-slate-300"
                      >
                        <td className="px-4 py-3 text-xs sm:text-sm">{row.feature}</td>
                        {PLAN_IDS.map((planId) => {
                          const enabled = isFeatureIncluded(planId, row);
                          return (
                            <td
                              key={`${row.id}-${planId}`}
                              className="px-4 py-3 text-center"
                            >
                              {enabled ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-200/80 dark:bg-emerald-300 dark:text-emerald-950">
                                  <Check className="w-3 h-3" />
                                  Included
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        className="max-w-6xl mx-auto px-6 pb-12 reveal"
        data-reveal
        style={{ "--reveal-delay": "140ms" }}
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-6">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-sky-500/10 opacity-70" />
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-header font-semibold">
                How it works
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                A simple flow for recording work and staying in control every day.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/10 text-xs text-slate-500 dark:text-slate-400">
              Simple • Smart • Professional
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {HOW_IT_WORKS_STEPS.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/10 bg-white/5 dark:bg-darkCard/70 p-4 shadow-soft dark:shadow-dark card-hover"
              >
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                  {item.title}
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {item.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section
        id="contact"
        className="max-w-6xl mx-auto px-6 pb-16 reveal"
        data-reveal
        style={{ "--reveal-delay": "160ms" }}
      >
        <div className="relative overflow-hidden rounded-2xl bg-white/10 dark:bg-darkCard/70 border border-white/10 shadow-neo dark:shadow-dark p-6">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/12 via-transparent to-emerald-500/12 opacity-80" />
          <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="text-xl font-header font-semibold">Contact</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                Need help getting started? We'll guide you, answer your questions, and help you set
                up your farm.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
                <a
                  href="mailto:support@kfarms.app"
                  className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10"
                >
                  <Mail className="w-4 h-4 text-slate-400" />
                  support@kfarms.app
                </a>
                <a
                  href="tel:+2349035085579"
                  className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10"
                >
                  <Phone className="w-4 h-4 text-slate-400" />
                  +234 903 5085 579
                </a>
                <div className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  Abuja, NG
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/40 p-4 backdrop-blur-xl dark:bg-white/5">
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Need fast help?
              </div>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                Open the Support Center for farmer guides, help requests, and assistant chat.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/support"
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500/90 via-sky-500/90 to-emerald-500/90 px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:opacity-90"
                >
                  Get help
                </Link>
                <Link
                  to="/billing"
                  className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white/70 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
                >
                  Billing support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sales Modal Moved to Global Provider */}


      <footer className="relative overflow-hidden border-t border-white/10 bg-white/10 dark:bg-darkCard/40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_25%,rgba(99,102,241,0.17),transparent_42%),radial-gradient(circle_at_86%_8%,rgba(16,185,129,0.15),transparent_36%),radial-gradient(circle_at_84%_86%,rgba(56,189,248,0.14),transparent_36%)]" />
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/60 to-transparent dark:via-slate-500/60" />
        <div className="relative max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-5">
              <div className="rounded-2xl border border-white/15 bg-white/40 p-5 shadow-neo backdrop-blur-xl dark:bg-darkCard/70 dark:shadow-dark">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/50 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                  KFarms
                </div>
                <h3 className="mt-3 text-lg font-header font-semibold text-slate-900 dark:text-slate-100">
                  Simple farm records. Clear decisions. Better results.
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Record daily work, stay productive offline, and keep a clear view of what your
                  farm is producing, selling, and spending.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={workspacePath}
                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500/90 via-sky-500/90 to-emerald-500/90 px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:opacity-90"
                  >
                    {workspaceLabel}
                  </Link>
                  <a
                    href="mailto:support@kfarms.app"
                    className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white/70 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
                  >
                    support@kfarms.app
                  </a>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 lg:col-span-7">
              {FOOTER_LINK_GROUPS.map((group) => (
                <div key={group.title} className="border-l border-white/20 pl-3 dark:border-white/10">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    {group.title}
                  </div>
                  <div className="mt-3 space-y-2">
                    {group.links.map((link) => {
                      if (link.to) {
                        return (
                          <Link
                            key={`${group.title}-${link.label}`}
                            to={link.to}
                            className="block text-sm text-slate-700 transition hover:text-accent-primary dark:text-slate-300 dark:hover:text-sky-300"
                          >
                            {link.label}
                          </Link>
                        );
                      }

                      return (
                        <a
                          key={`${group.title}-${link.label}`}
                          href={link.href}
                          className="block text-sm text-slate-700 transition hover:text-accent-primary dark:text-slate-300 dark:hover:text-sky-300"
                        >
                          {link.label}
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-white/15 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:text-slate-400">
            <span>© {currentYear} KFarms. All rights reserved.</span>
            <div className="flex flex-wrap items-center gap-4">
              <Link className="transition hover:text-accent-primary" to="/terms">
                Terms
              </Link>
              <a className="transition hover:text-accent-primary" href="mailto:support@kfarms.app">
                support@kfarms.app
              </a>
              <a className="transition hover:text-accent-primary" href="tel:+2349035085579">
                +234 903 5085 579
              </a>
              <span>Abuja, Nigeria</span>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}

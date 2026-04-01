import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  BellRing,
  CheckCircle2,
  Check,
  Building2,
  Leaf,
  Droplets,
  TrendingUp,
  Users,
  KeyRound,
  Layers3,
  Mail,
  Phone,
  MapPin,
  Sun,
  Moon,
  Package,
  WifiOff,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../tenant/TenantContext";
import {
  PLAN_FEATURE_MATRIX,
  PLAN_IDS,
  PLAN_TIER_CONFIG,
  getPlanById,
  isFeatureIncluded,
  normalizePlanId,
} from "../constants/plans";
import { buildBillingPlanFocusPath } from "../utils/billingNavigation";

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
    title: "Platform",
    links: [
      { label: "Login", to: "/auth/login" },
      { label: "Signup", to: "/auth/signup" },
      { label: "Workspace", to: "/dashboard" },
      { label: "Help Center", href: "#contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "ROOTS", to: "/company-profile" },
      { label: "Product Profile", to: "/product-profile" },
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

const HERO_TRUST_POINTS = [
  "Keep working when the internet drops, then sync back automatically.",
  "Run ponds, poultry, feeds, supplies, inventory, production, and sales from one workspace.",
  "Give each teammate the right access without exposing the wrong records.",
  "Scale from one farm to multi-site operations without rewriting your process.",
];

const PRODUCT_FEATURES = [
  {
    title: "Offline-ready capture",
    description:
      "Record field activity without waiting for perfect network conditions. KFarms keeps work moving and syncs forward when the connection returns.",
    icon: WifiOff,
    accent: "from-indigo-500/20 via-transparent to-sky-500/20",
    iconBg: "bg-indigo-500/20 text-indigo-400 ring-indigo-400/40",
  },
  {
    title: "Connected operations",
    description:
      "Keep ponds, poultry, feeds, inventory, supplies, and sales flowing inside one product instead of scattered tools and notes.",
    icon: Layers3,
    accent: "from-sky-500/20 via-transparent to-indigo-500/20",
    iconBg: "bg-sky-500/20 text-sky-400 ring-sky-400/40",
  },
  {
    title: "Role-based teamwork",
    description:
      "Owners, admins, managers, and staff can work from the same farm without seeing the wrong records or controls.",
    icon: Users,
    accent: "from-emerald-500/18 via-transparent to-sky-500/18",
    iconBg: "bg-emerald-500/20 text-emerald-400 ring-emerald-400/40",
  },
  {
    title: "Multi-farm control",
    description:
      "Keep each farm separate while giving operators and leaders a cleaner way to work across more than one location.",
    icon: Building2,
    accent: "from-amber-500/18 via-transparent to-emerald-500/18",
    iconBg: "bg-amber-500/20 text-amber-400 ring-amber-400/40",
  },
  {
    title: "Dashboards and trends",
    description:
      "Use summaries, watchlists, revenue views, and performance signals to react faster and plan better.",
    icon: BarChart3,
    accent: "from-indigo-500/18 via-transparent to-emerald-500/18",
    iconBg: "bg-indigo-500/20 text-indigo-400 ring-indigo-400/40",
  },
  {
    title: "Support for rollout",
    description:
      "Bring teams on smoothly with invitations, help flows, and product guidance that supports real adoption.",
    icon: BellRing,
    accent: "from-emerald-500/18 via-transparent to-sky-500/18",
    iconBg: "bg-emerald-500/20 text-emerald-400 ring-emerald-400/40",
  },
];

const OFFLINE_BENEFITS = [
  "Save core actions locally while the network is weak or unavailable.",
  "Resume sync automatically once a connection is available again.",
  "Avoid double entry and late reconstruction after service interruptions.",
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

const PRODUCT_LANES = [
  {
    title: "Ponds and livestock",
    body: "Track pond stock, flock batches, mortality, and routine operational notes.",
    icon: Droplets,
    iconClass: "text-sky-400",
  },
  {
    title: "Feeds and inventory",
    body: "Watch stock levels, feed usage, reorder pressure, and storage movement in one place.",
    icon: Package,
    iconClass: "text-emerald-400",
  },
  {
    title: "Sales and revenue",
    body: "Capture sales activity, track income, and keep the commercial side tied to operations.",
    icon: TrendingUp,
    iconClass: "text-indigo-400",
  },
  {
    title: "Team coordination",
    body: "Invite teammates, assign roles, and keep each person focused on the right lane of work.",
    icon: Users,
    iconClass: "text-violet-400",
  },
  {
    title: "Permissions and control",
    body: "Maintain isolated farm data, clear permissions, and safer workspace boundaries.",
    icon: KeyRound,
    iconClass: "text-amber-400",
  },
  {
    title: "Daily execution",
    body: "Make day-to-day logging practical and consistent so records stay useful long after entry.",
    icon: Leaf,
    iconClass: "text-lime-400",
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

function getInitialTheme() {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("kf_theme");
  if (saved) return saved;
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export default function ProductProfilePage() {
  const navigate = useNavigate();
  const [theme, setTheme] = React.useState(getInitialTheme);
  const [showScrollTop, setShowScrollTop] = React.useState(false);
  const isDark = theme === "dark";
  const { isAuthenticated, user, logout } = useAuth();
  const { activeTenantId, activeTenant, tenants, loadingTenants } = useTenant();

  const workspacePath = activeTenantId ? "/dashboard" : "/onboarding/create-tenant";
  const workspaceLabel = activeTenantId
    ? "Open Farm"
    : loadingTenants
      ? "Checking your farms..."
      : (tenants?.length || 0) > 0
        ? "Choose farm"
        : "Create farm";
  const planNameById = PLAN_TIER_CONFIG.reduce((acc, plan) => {
    acc[plan.id] = plan.name;
    return acc;
  }, {});
  const currentTenantPlanId = normalizePlanId(activeTenant?.plan, "FREE");
  const currentTenantPlanName = getPlanById(currentTenantPlanId, "FREE").name;
  const currentYear = new Date().getFullYear();

  React.useEffect(() => {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.body.classList.toggle("dark", isDark);
    localStorage.setItem("kf_theme", theme);
    document.documentElement.style.transition =
      "background-color 200ms, color 200ms";
  }, [theme]);

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
      { threshold: 0.2 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    document.title = "KFarms Product Profile";
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

  const handleSignOut = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const handleScrollToTop = React.useCallback(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div
      id="top"
      className={`min-h-screen bg-lightbg dark:bg-darkBg text-lightText dark:text-darkText ${
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
          onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-700 shadow-neo transition hover:scale-[1.02] hover:bg-white/20 dark:bg-darkCard/70 dark:text-slate-200 dark:shadow-dark"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              Light
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-400" />
              Dark
            </>
          )}
        </button>
      </div>

      <div className="page-load">
        {/* Hero */}
        <section className="relative overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(99,102,241,0.28),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(16,185,129,0.22),transparent_40%),radial-gradient(circle_at_80%_85%,rgba(59,130,246,0.22),transparent_45%)]" />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-emerald-900/25 to-slate-950/60" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(99,102,241,0.20),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(34,197,94,0.20),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.20),transparent_40%)]" />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-emerald-500/10 to-sky-500/10" />
          </>
        )}
        <div className="relative max-w-6xl mx-auto px-6 py-12 sm:py-16">
          <div className="sticky top-4 z-30 mb-6">
            <nav className="rounded-[1.5rem] border border-white/15 bg-white/50 px-4 py-3 shadow-soft backdrop-blur-xl dark:bg-darkCard/60 dark:shadow-dark">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center justify-between gap-3 lg:min-w-[12rem]">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.45)]" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        KFarms
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Product Profile
                      </div>
                    </div>
                  </div>

                  <Link
                    to={workspacePath}
                    className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500/90 via-sky-500/90 to-emerald-500/90 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-soft transition hover:opacity-90 lg:hidden"
                  >
                    {workspaceLabel}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="hide-scrollbar overflow-x-auto">
                  <div className="flex min-w-max items-center gap-5 px-1">
                    {HERO_NAV_LINKS.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        className="text-xs font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>

                <Link
                  to={workspacePath}
                  className="hidden items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500/90 via-sky-500/90 to-emerald-500/90 px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:opacity-90 lg:inline-flex"
                >
                  {workspaceLabel}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </nav>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/45 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 dark:bg-white/10 dark:text-slate-200">
                Product profile
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-header font-semibold leading-tight text-slate-800 dark:text-slate-100">
                One product for farm work, offline capture, and clearer daily decisions.
              </h1>
              <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl">
                KFarms helps farm teams record operations, keep work moving when the network fails,
                and manage ponds, poultry, inventory, supplies, sales, and teamwork from one place.
              </p>

              {!isAuthenticated ? (
                <div className="mt-6 flex flex-row gap-3">
                  <Link
                    to="/auth/login"
                    className="flex-1 inline-flex items-center justify-center px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500/90 via-sky-500/90 to-emerald-500/90 text-white shadow-soft hover:opacity-90 transition font-semibold"
                  >
                    Login
                  </Link>
                  <Link
                    to="/auth/signup"
                    className="flex-1 inline-flex items-center justify-center px-5 py-2 rounded-lg border border-white/10 bg-white/10 hover:bg-white/20 transition font-semibold text-slate-700 dark:text-slate-100"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-xs text-slate-700 dark:text-slate-200">
                    Signed in as{" "}
                    <span className="font-semibold">
                      {user?.email || user?.username || "User"}
                    </span>
                    {" · "}
                    {(tenants?.length || 0)} farm{(tenants?.length || 0) === 1 ? "" : "s"}
                  </div>
                  {activeTenant && (
                    <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-900 dark:text-emerald-200">
                      Current farm:{" "}
                      <span className="font-semibold">{activeTenant.name}</span>
                      {" · "}
                      {activeTenant.myRole || "Member"}
                      {" · "}
                      {currentTenantPlanName} plan
                    </div>
                  )}
                  {!activeTenant && (tenants?.length || 0) > 0 && (
                    <div className="rounded-xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-900 dark:text-amber-200">
                      You are signed in, but you haven&apos;t picked a farm yet.
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Link
                      to={workspacePath}
                      className="col-span-2 sm:col-span-1 inline-flex items-center justify-center whitespace-nowrap px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500/90 via-sky-500/90 to-emerald-500/90 text-white shadow-soft hover:opacity-90 transition font-semibold"
                    >
                      {workspaceLabel}
                    </Link>
                    <Link
                      to="/onboarding/accept-invite"
                      className="inline-flex items-center justify-center whitespace-nowrap px-5 py-2 rounded-lg border border-white/10 bg-white/10 hover:bg-white/20 transition font-semibold text-slate-700 dark:text-slate-100"
                    >
                      Accept Invite
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="inline-flex items-center justify-center whitespace-nowrap px-5 py-2 rounded-lg border border-red-300/40 bg-red-500/10 text-red-700 dark:text-red-300 hover:bg-red-500/20 transition font-semibold"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="relative overflow-hidden rounded-2xl bg-white/10 dark:bg-darkCard/70 border border-white/10 shadow-neo dark:shadow-dark p-6">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/12 via-transparent to-emerald-500/12 opacity-80" />
                <div className="relative">
                  <h3 className="font-header font-semibold text-lg text-slate-800 dark:text-slate-100">
                    Why farm teams choose KFarms
                  </h3>
                  <div className="mt-4 grid gap-3">
                    {HERO_TRUST_POINTS.map((item) => (
                      <div key={item} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
                        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                          <Check className="w-4 h-4" strokeWidth={3} />
                        </span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                {[
                  { label: "Capture", value: "Daily work" },
                  { label: "Recover", value: "Offline queues" },
                  { label: "Scale", value: "Multi-site ready" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/10 dark:from-darkCard/70 dark:via-darkCard/40 dark:to-darkCard/80 p-3 shadow-soft dark:shadow-dark card-hover"
                  >
                    <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                Top product features
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                The product profile should quickly show buyers and operators what makes KFarms
                practical, interesting, and valuable in real day-to-day farm work.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/10 text-xs text-slate-500 dark:text-slate-400">
              Product-led • Farm-ready • Practical
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
          <div className="relative overflow-hidden rounded-2xl bg-white/10 dark:bg-darkCard/70 border border-white/10 shadow-neo dark:shadow-dark p-6">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-indigo-500/10 opacity-70" />
            <h2 className="text-xl font-header font-semibold mb-3">Offline mode</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              KFarms is built for real field conditions. When the network drops, your team can keep
              capturing work and sync forward once the connection returns.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 text-xs text-slate-500 dark:text-slate-400">
              {OFFLINE_BENEFITS.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-white/10 bg-white/5 dark:bg-darkCard/70 p-3 shadow-soft dark:shadow-dark"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{item}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 dark:bg-darkCard/70 p-6 shadow-soft dark:shadow-dark">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-sky-500/10 opacity-60" />
            <h3 className="font-header font-semibold text-lg mb-3">
              Built by ROOTS for practical rollout
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              The product profile should show confidence not just in design, but in how the app
              behaves when farms are busy, distributed, and not always online.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 text-xs text-slate-500 dark:text-slate-400">
              {OFFLINE_PANELS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-white/10 bg-white/5 dark:bg-darkCard/70 p-3 shadow-soft dark:shadow-dark"
                >
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                    {item.title}
                  </div>
                  <div className="mt-2">{item.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Product Lanes */}
      <section
        id="services"
        className="max-w-6xl mx-auto px-6 pb-12 reveal"
        data-reveal
        style={{ "--reveal-delay": "120ms" }}
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-header font-semibold">Product lanes</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              KFarms should feel like a real operating surface, not just a brochure. These are the
              lanes teams can recognize immediately.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/10 text-xs text-slate-500 dark:text-slate-400">
            Operational • Visible • Actionable
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRODUCT_LANES.map((service) => {
            const Icon = service.icon;

            return (
            <div
              key={service.title}
              className="group relative overflow-hidden rounded-xl bg-white/10 dark:bg-darkCard/70 border border-white/10 p-5 shadow-soft dark:shadow-dark transition hover:-translate-y-0.5 card-hover"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/20 via-transparent to-indigo-500/20 opacity-80" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg grid place-items-center ring-1 ring-white/10 bg-white/10 dark:bg-white/5">
                  <Icon className={`w-5 h-5 ${service.iconClass}`} />
                </div>
                <h3 className="font-semibold">{service.title}</h3>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {service.body}
              </p>
            </div>
            );
          })}
        </div>
      </section>

      {/* Plans */}
      <section
        id="plans"
        className="max-w-6xl mx-auto px-6 pb-12 reveal"
        data-reveal
        style={{ "--reveal-delay": "130ms" }}
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-6">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-emerald-500/10 opacity-80" />
          <div className="relative">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-header font-semibold">Plans</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
                  Choose a tier based on your current stage. This pricing matrix is data-driven, so
                  updating one config updates every plan card and feature row automatically.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/10 text-xs text-slate-500 dark:text-slate-400">
                Free • Pro • Enterprise
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {PLAN_TIER_CONFIG.map((plan) => {
                const tone = PLAN_TONE[plan.id] || PLAN_TONE.FREE;
                let actionPath = plan.ctaPath;
                let actionLabel = plan.ctaLabel;

                if (isAuthenticated) {
                  if (plan.id === "FREE") {
                    actionPath = activeTenantId ? "/billing" : workspacePath;
                    actionLabel = activeTenantId ? "Manage Free Plan" : "Start Free";
                  } else if (plan.id === "PRO") {
                    actionPath = buildBillingPlanFocusPath("PRO");
                    actionLabel =
                      currentTenantPlanId === "PRO"
                        ? "Manage Pro Plan"
                        : "Upgrade to Pro";
                  } else if (plan.id === "ENTERPRISE") {
                    actionPath =
                      currentTenantPlanId === "ENTERPRISE"
                        ? "/billing"
                        : "/product-profile#contact";
                    actionLabel =
                      currentTenantPlanId === "ENTERPRISE"
                        ? "Manage Enterprise Plan"
                        : "Talk to Sales";
                  }
                }

                return (
                  <div
                    key={plan.id}
                    className={`relative overflow-hidden rounded-xl border bg-white/80 dark:bg-darkCard/70 p-5 shadow-soft dark:shadow-dark card-hover ${tone.border}`}
                  >
                    <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tone.glow} opacity-80`} />
                    <div className="relative">
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
                    <div className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                      {plan.priceLabel}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{plan.cycleLabel}</div>
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

                    <Link
                      to={actionPath}
                      className={`mt-5 inline-flex w-full items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold transition ${tone.button}`}
                    >
                      {actionLabel}
                    </Link>
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
                How KFarms works
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                A clean operating loop that turns field activity into clearer action and better coordination.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/10 text-xs text-slate-500 dark:text-slate-400">
              Simple • Smart • Professional
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {[
              {
                title: "Capture",
                body:
                  "Log ponds, hatches, sales, inventory, and supplies with guided forms even during busy workdays.",
              },
              {
                title: "Monitor",
                body:
                  "Track stock, water changes, queues, and performance with summaries your team can understand quickly.",
              },
              {
                title: "Recover",
                body:
                  "Continue recording offline, then let sync recovery bring the data back into the main view.",
              },
              {
                title: "Analyze",
                body:
                  "Use trends, dashboards, and revenue views to improve planning, budgeting, and output.",
              },
              {
                title: "Align",
                body:
                  "Keep owners, managers, and staff on the same page with role-based workflows and cleaner visibility.",
              },
              {
                title: "Scale",
                body:
                  "Start with one farm, then expand into broader teams and multi-site operations when you are ready.",
              },
            ].map((item) => (
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
                Talk to the KFarms product team for setup, pricing, offline deployment questions,
                or larger rollouts. We usually reply the same business day.
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

      <footer className="relative overflow-hidden border-t border-white/10 bg-white/10 dark:bg-darkCard/40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_25%,rgba(99,102,241,0.17),transparent_42%),radial-gradient(circle_at_86%_8%,rgba(16,185,129,0.15),transparent_36%),radial-gradient(circle_at_84%_86%,rgba(56,189,248,0.14),transparent_36%)]" />
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/60 to-transparent dark:via-slate-500/60" />
        <div className="relative max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-5">
              <div className="rounded-2xl border border-white/15 bg-white/40 p-5 shadow-neo backdrop-blur-xl dark:bg-darkCard/70 dark:shadow-dark">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/50 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                  KFarms Product Profile
                </div>
                <h3 className="mt-3 text-lg font-header font-semibold text-slate-900 dark:text-slate-100">
                  Farm software built for real work on real farms.
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  KFarms helps teams record work, stay productive offline, see progress clearly,
                  and grow from one farm into a more coordinated operation.
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
            <span>© {currentYear} KFarms by ROOTS. All rights reserved.</span>
            <div className="flex flex-wrap items-center gap-4">
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

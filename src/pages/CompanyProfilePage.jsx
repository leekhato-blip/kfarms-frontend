import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  Building2,
  HeartPulse,
  Layers3,
  Mail,
  MapPin,
  Monitor,
  Moon,
  Phone,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import { formatThemePreferenceLabel } from "../constants/settings";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useTenant } from "../tenant/TenantContext";
import {
  PLAN_FEATURE_MATRIX,
  PLAN_IDS,
  PLAN_TIER_CONFIG,
  getPlanById,
  isFeatureIncluded,
  normalizePlanId,
} from "../constants/plans";

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
      { label: "Features", href: "#services" },
      { label: "Pricing", href: "#plans" },
      { label: "Security", href: "#plans" },
      { label: "Billing", to: "/billing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#services" },
      { label: "Contact", href: "#contact" },
      { label: "Create Farm", to: "/onboarding/create-tenant" },
      { label: "Accept Invite", to: "/onboarding/accept-invite" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help Center", href: "#contact" },
      { label: "Status", href: "#contact" },
      { label: "API Access", href: "#plans" },
      { label: "Support", href: "mailto:support@kfarms.app" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#contact" },
      { label: "Terms", href: "#contact" },
      { label: "Cookie Policy", href: "#contact" },
      { label: "DPA", href: "#contact" },
    ],
  },
];

const FOOTER_HIGHLIGHTS = [
  { label: "Farm-ready", value: "Live dashboards" },
  { label: "Daily speed", value: "Quick reviews" },
  { label: "Access", value: "Role-based control" },
];

const HERO_NAV_LINKS = [
  { label: "Services", href: "#services" },
  { label: "Pricing", href: "#plans" },
  { label: "Contact", href: "#contact" },
];

const HERO_QUICK_METRICS = [
  { label: "Setup", value: "< 15 min" },
  { label: "Modules", value: "5 core tools" },
  { label: "Collaboration", value: "Multi-team ready" },
];

const HERO_TRUST_POINTS = [
  "Separate records for each farm",
  "Clear dashboards for pond, feeds, sales, and supply operations",
  "Scales from one farm to multi-site operations",
  "Built by ROOTS for practical day-to-day execution",
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

const COMPANY_NAV_LINKS = [
  { label: "Company", href: "#company" },
  { label: "Products", href: "#products" },
  { label: "Approach", href: "#approach" },
  { label: "Contact", href: "#contact" },
];

const COMPANY_SIGNALS = [
  {
    label: "Built for operations",
    value: "Real-world software for teams that need structure, speed, and accountability.",
  },
  {
    label: "Portfolio thinking",
    value: "ROOTS is designed to support multiple practical business systems, not one isolated tool.",
  },
  {
    label: "Rollout support",
    value: "We focus on adoption, clarity, and usable workflows so teams can actually keep using what we build.",
  },
];

const COMPANY_PILLARS = [
  {
    title: "Clarity",
    body: "We turn messy daily activity into cleaner workflows, better visibility, and easier decisions.",
    icon: Layers3,
    tone: "text-indigo-400",
  },
  {
    title: "Continuity",
    body: "We build for real operating environments where internet, people, and processes are not always perfect.",
    icon: ShieldCheck,
    tone: "text-emerald-400",
  },
  {
    title: "Control",
    body: "ROOTS products help teams work with the right permissions, cleaner records, and more reliable oversight.",
    icon: Users,
    tone: "text-sky-400",
  },
];

const PRODUCT_PORTFOLIO = [
  {
    name: "KFarms",
    stage: "Live",
    summary: "Farm operations, inventory, sales, team roles, and offline-ready field capture.",
    accent: "from-indigo-500/18 via-transparent to-emerald-500/18",
    icon: Building2,
  },
  {
    name: "Property Operations",
    stage: "Planned",
    summary: "A ROOTS lane for tenancy, rent workflows, and property-side operations.",
    accent: "from-sky-500/18 via-transparent to-indigo-500/18",
    icon: Layers3,
  },
  {
    name: "Education Operations",
    stage: "Planned",
    summary: "A school operations lane focused on structure, communication, and daily admin flow.",
    accent: "from-emerald-500/18 via-transparent to-sky-500/18",
    icon: Users,
  },
  {
    name: "Healthcare Operations",
    stage: "Planned",
    summary: "A future ROOTS product for clinic and hospital process visibility and administration.",
    accent: "from-violet-500/18 via-transparent to-indigo-500/18",
    icon: HeartPulse,
  },
];

const APPROACH_STEPS = [
  {
    title: "Understand the workflow",
    body: "We start from how teams actually work, not from generic software templates.",
  },
  {
    title: "Build for daily use",
    body: "ROOTS products aim to feel usable under pressure, with clearer actions and less friction.",
  },
  {
    title: "Support adoption",
    body: "We think beyond launch so teams can roll out, train, and keep momentum after deployment.",
  },
];

export default function CompanyProfilePage() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [showScrollTop, setShowScrollTop] = React.useState(false);
  const { isAuthenticated } = useAuth();
  const { activeTenantId, tenants, loadingTenants } = useTenant();
  const themeLabel = formatThemePreferenceLabel(theme);

  const workspacePath = activeTenantId ? "/dashboard" : "/onboarding/create-tenant";
  const workspaceLabel = activeTenantId
    ? "Open Farm"
    : loadingTenants
      ? "Checking your workspace..."
      : (tenants?.length || 0) > 0
        ? "Choose Workspace"
        : "Create Workspace";

  React.useEffect(() => {
    document.title = "ROOTS Company Profile";
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

  const handleScrollToTop = React.useCallback(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div
      id="top"
      className={`min-h-screen bg-lightbg text-lightText dark:bg-darkBg dark:text-darkText ${isDark ? "dark" : ""}`}
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

      <section className="relative overflow-hidden border-b border-white/10">
        {isDark ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(99,102,241,0.28),transparent_42%),radial-gradient(circle_at_84%_14%,rgba(16,185,129,0.18),transparent_36%),radial-gradient(circle_at_82%_82%,rgba(56,189,248,0.22),transparent_42%)]" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/75 to-[#04111e]" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(99,102,241,0.18),transparent_38%),radial-gradient(circle_at_84%_14%,rgba(16,185,129,0.14),transparent_32%),radial-gradient(circle_at_84%_86%,rgba(56,189,248,0.16),transparent_38%)]" />
            <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-sky-50/70" />
          </>
        )}

        <div className="relative mx-auto max-w-6xl px-6 py-12 sm:py-16">
          <div className="sticky top-4 z-30 mb-8">
            <nav className="rounded-[1.6rem] border border-white/15 bg-white/50 px-4 py-3 shadow-soft backdrop-blur-xl dark:bg-darkCard/60 dark:shadow-dark">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <Link to="/company-profile" className="flex min-w-0 items-center gap-3">
                    <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border border-white/20 bg-white/45 dark:bg-white/10">
                      <span className="absolute inset-[6px] rounded-[0.7rem] border border-white/20 dark:border-white/10" />
                      <Sparkles className="h-4 w-4 text-emerald-400" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        ROOTS
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Company Profile
                      </div>
                    </div>
                  </Link>

                  <Link
                    to="/product-profile"
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500/90 via-sky-500/90 to-emerald-500/90 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-soft transition hover:opacity-90"
                  >
                    View KFarms
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 dark:border-white/10">
                  <div className="hide-scrollbar overflow-x-auto">
                    <div className="flex min-w-max items-center gap-4 sm:gap-6">
                      {COMPANY_NAV_LINKS.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          className="group relative py-1 text-xs font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                        >
                          {link.label}
                          <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 transition-transform duration-200 group-hover:scale-x-100" />
                        </a>
                      ))}
                    </div>
                  </div>

                  <Link
                    to={workspacePath}
                    className="hidden shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white md:inline-flex"
                  >
                    {workspaceLabel}
                  </Link>
                </div>
              </div>
            </nav>
          </div>

          <div id="company" className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/45 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 dark:bg-white/10 dark:text-slate-200">
                Operating systems for real teams
              </div>
              <h1 className="mt-5 max-w-3xl font-header text-3xl font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-4xl lg:text-5xl">
                ROOTS builds practical software for operations that cannot run on guesswork.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                We design and grow products for teams that need clearer records, better coordination,
                and software they can actually keep using in the real world.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/product-profile"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500/90 via-sky-500/90 to-emerald-500/90 px-5 py-2.5 font-semibold text-white shadow-soft transition hover:opacity-90"
                >
                  Explore KFarms
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={isAuthenticated ? workspacePath : "/auth/login"}
                  className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/10 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-white/20 dark:text-slate-100"
                >
                  {isAuthenticated ? workspaceLabel : "Login"}
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/10 p-6 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/12 via-transparent to-emerald-500/12 opacity-80" />
              <div className="relative">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  ROOTS in view
                </div>
                <div className="mt-4 space-y-3">
                  {COMPANY_SIGNALS.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/10 bg-white/10 p-4 dark:bg-white/5"
                    >
                      <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        {item.label}
                      </div>
                      <div className="mt-2 text-sm font-medium leading-6 text-slate-800 dark:text-slate-100">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COMPANY_PILLARS.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-soft dark:bg-darkCard/70 dark:shadow-dark"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 dark:bg-white/5">
                  <Icon className={`h-5 w-5 ${item.tone}`} />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {item.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="products" className="mx-auto max-w-6xl px-6 pb-12">
        <div className="rounded-[1.9rem] border border-white/10 bg-white/10 p-6 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-header text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Product portfolio
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
                ROOTS is growing as a portfolio of practical operations products. KFarms is live, and
                the broader platform direction supports more business systems over time.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-500 dark:text-slate-400">
              Live now • Expanding thoughtfully
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {PRODUCT_PORTFOLIO.map((product) => {
              const Icon = product.icon;

              return (
                <div
                  key={product.name}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-soft dark:bg-darkCard/60 dark:shadow-dark"
                >
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${product.accent} opacity-80`} />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 dark:bg-white/5">
                        <Icon className="h-5 w-5 text-sky-400" />
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">
                        {product.stage}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {product.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                      {product.summary}
                    </p>
                    {product.name === "KFarms" ? (
                      <Link
                        to="/product-profile"
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-800 transition hover:text-indigo-500 dark:text-slate-100 dark:hover:text-sky-300"
                      >
                        Open product profile
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="approach" className="mx-auto max-w-6xl px-6 pb-12">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-soft dark:bg-darkCard/70 dark:shadow-dark">
            <h2 className="font-header text-2xl font-semibold text-slate-900 dark:text-slate-100">
              How ROOTS works
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
              Our company approach is centered on operational reality: understand the work, shape the
              workflow, and support adoption after launch.
            </p>

            <div className="mt-5 space-y-3">
              {APPROACH_STEPS.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 dark:bg-darkCard/60"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-slate-800 dark:bg-white/5 dark:text-slate-100">
                      {index + 1}
                    </span>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {step.title}
                    </div>
                  </div>
                  <div className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {step.body}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-soft dark:bg-darkCard/70 dark:shadow-dark">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              ROOTS promise
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
              Software should make operations easier to run, not harder to explain.
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
              That is why ROOTS focuses on products that help teams see what is happening, act more
              confidently, and reduce the friction that usually slows down real-world execution.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 dark:bg-darkCard/60">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Product direction
                </div>
                <div className="mt-2 text-sm font-medium leading-6 text-slate-800 dark:text-slate-100">
                  Focused on practical tools for real operational domains.
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 dark:bg-darkCard/60">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Delivery mindset
                </div>
                <div className="mt-2 text-sm font-medium leading-6 text-slate-800 dark:text-slate-100">
                  Clear rollout, sensible controls, and support that keeps adoption moving.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-[1.9rem] border border-white/10 bg-white/10 p-6 shadow-neo dark:bg-darkCard/70 dark:shadow-dark">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="font-header text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Contact ROOTS
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                Talk to ROOTS about products, partnership, rollout, or how the company can support
                your next operational system.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
                <a
                  href="mailto:support@kfarms.app"
                  className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10"
                >
                  <Mail className="h-4 w-4 text-slate-400" />
                  support@kfarms.app
                </a>
                <a
                  href="tel:+2349035085579"
                  className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10"
                >
                  <Phone className="h-4 w-4 text-slate-400" />
                  +234 903 5085 579
                </a>
                <div className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  Abuja, Nigeria
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/40 p-4 backdrop-blur-xl dark:bg-white/5">
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Quick path
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                Want to see the live product story? Jump straight into the KFarms product profile.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/product-profile"
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500/90 via-sky-500/90 to-emerald-500/90 px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:opacity-90"
                >
                  View product profile
                </Link>
                <Link
                  to={workspacePath}
                  className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white/70 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
                >
                  {workspaceLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

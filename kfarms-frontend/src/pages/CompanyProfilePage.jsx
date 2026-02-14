import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Building2,
  Leaf,
  Droplets,
  TrendingUp,
  ShieldCheck,
  Users,
  KeyRound,
  Layers3,
  Mail,
  Phone,
  MapPin,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTenant } from "../tenant/TenantContext";

function getInitialTheme() {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("kf_theme");
  if (saved) return saved;
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export default function CompanyProfilePage() {
  const navigate = useNavigate();
  const [theme, setTheme] = React.useState(getInitialTheme);
  const isDark = theme === "dark";
  const { isAuthenticated, user, logout } = useAuth();
  const { activeTenantId, activeTenant, tenants, loadingTenants } = useTenant();

  const workspacePath = activeTenantId ? "/dashboard" : "/onboarding/create-tenant";
  const workspaceLabel = activeTenantId
    ? "Open Workspace"
    : loadingTenants
      ? "Checking your organizations..."
      : (tenants?.length || 0) > 0
        ? "Choose Organization"
        : "Create Organization";

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

  const handleSignOut = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div
      className={`min-h-screen bg-lightbg dark:bg-darkBg text-lightText dark:text-darkText ${
        isDark ? "dark" : ""
      }`}
      style={{ backgroundColor: isDark ? "#07080b" : "#f9fafb" }}
    >
      {/* Floating theme toggle */}
      <button
        type="button"
        onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        className="fixed bottom-6 right-6 z-[60] inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 dark:bg-darkCard/70 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-neo dark:shadow-dark hover:scale-[1.02] hover:bg-white/20 transition"
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
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-emerald-500/8 to-sky-500/8" />
          </>
        )}
        <div className="relative max-w-6xl mx-auto px-6 py-16 sm:py-20">
          <div className="flex flex-col lg:flex-row lg:items-center gap-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/10 dark:bg-darkCard/60 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ROOTS • KFarms
              </div>
              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-header font-semibold leading-tight">
                The smart, simple platform for farm operations.
              </h1>
              <p className="mt-4 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl">
                KFarms brings ponds, sales, and supplies into one clear system.
                Track performance, reduce waste, and keep your team aligned with
                tools that are fast, friendly, and reliable.
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
                    {(tenants?.length || 0)} org{(tenants?.length || 0) === 1 ? "" : "s"}
                  </div>
                  {activeTenant && (
                    <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-900 dark:text-emerald-200">
                      Current organization:{" "}
                      <span className="font-semibold">{activeTenant.name}</span>
                      {" · "}
                      {activeTenant.myRole || "Member"}
                    </div>
                  )}
                  {!activeTenant && (tenants?.length || 0) > 0 && (
                    <div className="rounded-xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-900 dark:text-amber-200">
                      You are signed in, but you haven&apos;t picked an organization yet.
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      to={workspacePath}
                      className="flex-1 inline-flex items-center justify-center px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500/90 via-sky-500/90 to-emerald-500/90 text-white shadow-soft hover:opacity-90 transition font-semibold"
                    >
                      {workspaceLabel}
                    </Link>
                    <Link
                      to="/onboarding/accept-invite"
                      className="flex-1 inline-flex items-center justify-center px-5 py-2 rounded-lg border border-white/10 bg-white/10 hover:bg-white/20 transition font-semibold text-slate-700 dark:text-slate-100"
                    >
                      Accept Invite
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="inline-flex items-center justify-center px-5 py-2 rounded-lg border border-red-300/40 bg-red-500/10 text-red-700 dark:text-red-300 hover:bg-red-500/20 transition font-semibold"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="relative overflow-hidden rounded-2xl bg-white/10 dark:bg-darkCard/70 border border-white/10 shadow-neo dark:shadow-dark p-6">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-emerald-500/10 opacity-70" />
                <h3 className="font-header font-semibold text-lg">
                  Why teams choose KFarms
                </h3>
                <div className="mt-4 grid gap-3">
                  {[
                    "Clear daily dashboards that save time",
                    "Smart alerts for water, stock, and health",
                    "Accurate records for audits and reporting",
                    "Trends that guide planning and growth",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                {[
                  { label: "Faster reviews", value: "4x" },
                  { label: "Waste reduced", value: "25%" },
                  { label: "Team clarity", value: "10/10" },
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

      {/* About */}
      <section
        className="max-w-6xl mx-auto px-6 py-12 reveal"
        data-reveal
        style={{ "--reveal-delay": "40ms" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
          <div className="relative overflow-hidden rounded-2xl bg-white/10 dark:bg-darkCard/70 border border-white/10 shadow-neo dark:shadow-dark p-6">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-indigo-500/10 opacity-70" />
            <h2 className="text-xl font-header font-semibold mb-3">About</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              KFarms is made for operators who want clean, dependable data. It
              turns daily activity into clear insight so you can act early and
              run with confidence.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="rounded-lg border border-white/10 bg-white/5 dark:bg-darkCard/70 p-3 shadow-soft dark:shadow-dark">
                Role-based access with fully traceable updates.
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 dark:bg-darkCard/70 p-3 shadow-soft dark:shadow-dark">
                One source of truth for every pond and batch.
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 dark:bg-darkCard/70 p-6 shadow-soft dark:shadow-dark">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-sky-500/10 opacity-60" />
            <h3 className="font-header font-semibold text-lg mb-3">
              Built by ROOTS
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              ROOTS builds practical software for real operations. KFarms is
              our flagship platform for aquaculture and modern farm teams.
            </p>
            <div className="mt-4 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="w-2 h-2 rounded-full bg-indigo-400" />
              Reliable
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              Transparent
              <div className="w-2 h-2 rounded-full bg-sky-400" />
              Secure
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section
        className="max-w-6xl mx-auto px-6 pb-12 reveal"
        data-reveal
        style={{ "--reveal-delay": "80ms" }}
      >
        <h2 className="text-xl font-header font-semibold mb-4">Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: "Fish Pond Management",
              description:
                "Monitor pond health, stock levels, and water schedules in one place.",
              icon: <Droplets className="w-5 h-5 text-sky-400" />,
              accent: "from-sky-500/15 via-transparent to-indigo-500/15",
              iconBg: "bg-sky-500/15 text-sky-400 ring-sky-400/40",
            },
            {
              title: "Sales & Revenue Tracking",
              description:
                "Capture sales, track income, and spot trends with clean reports.",
              icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
              accent: "from-sky-500/15 via-transparent to-indigo-500/15",
              iconBg: "bg-sky-500/15 text-sky-400 ring-sky-400/40",
            },
            {
              title: "Feed & Supply Monitoring",
              description:
                "Stay ahead of stockouts with organized feed and supply logs.",
              icon: <Leaf className="w-5 h-5 text-lime-400" />,
              accent: "from-sky-500/15 via-transparent to-indigo-500/15",
              iconBg: "bg-sky-500/15 text-sky-400 ring-sky-400/40",
            },
          ].map((service) => (
            <div
              key={service.title}
              className="group relative overflow-hidden rounded-xl bg-white/10 dark:bg-darkCard/70 border border-white/10 p-5 shadow-soft dark:shadow-dark transition hover:-translate-y-0.5 card-hover"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${service.accent} opacity-80`}
              />
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg grid place-items-center ring-1 ring-white/10 ${service.iconBg}`}
                >
                  {service.icon}
                </div>
                <h3 className="font-semibold">{service.title}</h3>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        className="max-w-6xl mx-auto px-6 pb-12 reveal"
        data-reveal
        style={{ "--reveal-delay": "120ms" }}
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-6">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-sky-500/10 opacity-70" />
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-header font-semibold">
                How KFarms works
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                A simple flow that keeps your data clean and your team aligned.
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
                  "Log ponds, hatches, sales, and supplies with clean, guided forms.",
              },
              {
                title: "Monitor",
                body:
                  "Track stock, water changes, and performance with live summaries.",
              },
              {
                title: "Alert",
                body:
                  "Get notified early about risks before they become losses.",
              },
              {
                title: "Analyze",
                body:
                  "Use trends to improve planning, budgeting, and output.",
              },
              {
                title: "Align",
                body:
                  "Keep teams on the same page with consistent workflows.",
              },
              {
                title: "Scale",
                body:
                  "Start with ponds, then expand to sales and supplies anytime.",
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

      {/* Tenant Feature */}
      <section
        className="max-w-6xl mx-auto px-6 pb-12 reveal"
        data-reveal
        style={{ "--reveal-delay": "140ms" }}
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 dark:bg-darkCard/70 shadow-neo dark:shadow-dark p-6">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-indigo-500/10 opacity-80" />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-header font-semibold">
                New: Team Workspaces
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                KFarms now lets each organization work in its own secure workspace. This keeps
                records separated and makes teamwork easier across multiple farms.
              </p>
            </div>
            <Link
              to={workspacePath}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500/90 via-sky-500/90 to-indigo-500/90 text-white shadow-soft hover:opacity-90 transition text-sm font-semibold"
            >
              {workspaceLabel}
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Organization Selector",
                body: "Switch organizations from the top bar whenever you need to.",
                icon: <Building2 className="w-4 h-4 text-emerald-400" />,
              },
              {
                title: "Clear Permissions",
                body: "Your role (Owner, Admin, or Member) controls what you can do.",
                icon: <Users className="w-4 h-4 text-sky-400" />,
              },
              {
                title: "Simple Invites",
                body: "Join a team quickly with an invite code.",
                icon: <KeyRound className="w-4 h-4 text-indigo-400" />,
              },
              {
                title: "Private Data",
                body: "Each organization sees only its own data and activity.",
                icon: <Layers3 className="w-4 h-4 text-amber-400" />,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/10 bg-white/5 dark:bg-darkCard/70 p-4 shadow-soft dark:shadow-dark card-hover"
              >
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-100">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 dark:bg-white/5">
                    {item.icon}
                  </span>
                  {item.title}
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {item.body}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link
              to="/onboarding/create-tenant"
              className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 font-semibold hover:bg-white/20 transition"
            >
              Create Organization
            </Link>
            <Link
              to="/onboarding/accept-invite"
              className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 font-semibold hover:bg-white/20 transition"
            >
              Accept Invite
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section
        className="max-w-6xl mx-auto px-6 pb-16 reveal"
        data-reveal
        style={{ "--reveal-delay": "160ms" }}
      >
        <div className="rounded-2xl bg-white/10 dark:bg-darkCard/70 border border-white/10 shadow-neo dark:shadow-dark p-6">
          <h2 className="text-xl font-header font-semibold mb-4">Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-400" />
              support@kfarms.app
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-slate-400" />
              +234 903 5085 579
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-slate-400" />
              Abuja, NG
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}

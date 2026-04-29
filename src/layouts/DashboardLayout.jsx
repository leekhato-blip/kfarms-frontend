import React from "react";
import GlassToast from "../components/GlassToast";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import WorkspaceBottomNav from "../components/WorkspaceBottomNav";
import SupportAssistantWidget from "../components/SupportAssistantWidget";
import { useAuth } from "../hooks/useAuth";
import {
  DEMO_ACCOUNT_BLOCKED_MESSAGE,
  DEMO_ACCOUNT_EVENT,
  isDemoAccountUser,
} from "../auth/demoMode";

const DashboardLayoutContext = React.createContext(false);

function DashboardLayoutShell({ children }) {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();
  const [demoToast, setDemoToast] = React.useState("");
  const demoAccountActive = isDemoAccountUser(user);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleDemoBlocked = (event) => {
      setDemoToast(event?.detail?.message || DEMO_ACCOUNT_BLOCKED_MESSAGE);
    };

    window.addEventListener(DEMO_ACCOUNT_EVENT, handleDemoBlocked);
    return () => {
      window.removeEventListener(DEMO_ACCOUNT_EVENT, handleDemoBlocked);
    };
  }, []);

  return (
    <div className="min-h-screen bg-lightbg dark:bg-darkbg text-lightText dark:text-darkText">
      <div className="flex min-h-screen relative bg-lightbg dark:bg-darkbg text-lightText dark:text-darkText">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col overflow-x-hidden px-4 pt-4 pb-0 md:px-6 md:pt-6 md:pb-0">
          <Topbar />
          {demoAccountActive && (
            <section className="mt-4 rounded-3xl border border-amber-200/70 bg-[linear-gradient(135deg,rgba(254,243,199,0.95),rgba(219,234,254,0.9))] px-5 py-4 shadow-neo dark:border-amber-300/20 dark:bg-[linear-gradient(135deg,rgba(120,53,15,0.35),rgba(30,41,59,0.72))] dark:shadow-dark">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-200">
                Demo Mode
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                You are viewing sample farm data.
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                Explore the full workspace, but changes, sync, and other write actions are disabled because this is only a walkthrough account.
              </p>
            </section>
          )}
          <main data-route-scroll className="mt-6 flex-1 pb-32 md:pb-8">
            {children}
          </main>

          <footer className="mt-auto -mx-4 overflow-hidden border-t border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(240,246,252,0.92))] pb-[calc(env(safe-area-inset-bottom,0px)+7rem)] shadow-neo backdrop-blur-xl md:-mx-6 md:pb-0 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(8,17,32,0.84),rgba(12,26,46,0.92))] dark:shadow-dark">
            <div className="relative px-4 py-4 md:px-6">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_50%,rgba(14,165,233,0.15),transparent_42%),radial-gradient(circle_at_92%_50%,rgba(16,185,129,0.16),transparent_44%)]" />
              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex items-center gap-2 text-xs text-slate-600 sm:text-sm dark:text-slate-300">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-white/60 text-[10px] font-bold tracking-[0.08em] text-slate-700 dark:bg-white/10 dark:text-slate-100">
                    KF
                  </span>
                  <span>© {currentYear} KFarms by ROOTS. Built for modern farm operations.</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                  <a
                    className="rounded-full border border-white/20 bg-white/50 px-3 py-1 text-slate-600 transition hover:border-accent-primary/35 hover:text-accent-primary dark:bg-white/10 dark:text-slate-200"
                    href="/product-profile#plans"
                  >
                    Pricing
                  </a>
                  <a
                    className="rounded-full border border-white/20 bg-white/50 px-3 py-1 text-slate-600 transition hover:border-accent-primary/35 hover:text-accent-primary dark:bg-white/10 dark:text-slate-200"
                    href="/product-profile#contact"
                  >
                    Contact
                  </a>
                  <a
                    className="rounded-full border border-white/20 bg-white/50 px-3 py-1 text-slate-600 transition hover:border-accent-primary/35 hover:text-accent-primary dark:bg-white/10 dark:text-slate-200"
                    href="mailto:support@kfarms.app"
                  >
                    Support
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
      <WorkspaceBottomNav />
      <GlassToast
        message={demoToast}
        type="info"
        duration={3200}
        onClose={() => setDemoToast("")}
      />
      <SupportAssistantWidget />
    </div>
  );
}

export default function DashboardLayout({ children }) {
  const isNestedLayout = React.useContext(DashboardLayoutContext);

  if (isNestedLayout) {
    return children;
  }

  return (
    <DashboardLayoutContext.Provider value={true}>
      <DashboardLayoutShell>{children}</DashboardLayoutShell>
    </DashboardLayoutContext.Provider>
  );
}

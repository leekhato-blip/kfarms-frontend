import React from "react";
import { Mail, Phone, MapPin, X } from "lucide-react";

const SalesModalContext = React.createContext(null);

export function SalesModalProvider({ children }) {
  const [salesModalOpen, setSalesModalOpen] = React.useState(false);

  const openModal = React.useCallback(() => {
    setSalesModalOpen(true);
  }, []);

  const closeModal = React.useCallback(() => {
    setSalesModalOpen(false);
  }, []);

  React.useEffect(() => {
    if (!salesModalOpen || typeof window === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeModal, salesModalOpen]);

  const value = React.useMemo(() => ({ openModal, closeModal }), [openModal, closeModal]);

  return (
    <SalesModalContext.Provider value={value}>
      {children}
      {salesModalOpen ? (
        <div className="fixed inset-0 z-[14000] flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label="Close sales contact modal"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/15 bg-white/95 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-slate-950/95">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800 dark:border-emerald-300/25 dark:bg-emerald-500/12 dark:text-emerald-200">
                  Talk to Sales
                </div>
                <h3 className="mt-4 text-2xl font-header font-semibold text-slate-950 dark:text-slate-50">
                  Contact the KFarms team
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Share your setup, team size, and workflow needs. We'll help you choose the right rollout and enterprise support path.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]"
                aria-label="Close sales contact modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              <a
                href="mailto:support@kfarms.app"
                className="inline-flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
              >
                <Mail className="h-4 w-4 text-slate-400" />
                support@kfarms.app
              </a>
              <a
                href="tel:+2349035085579"
                className="inline-flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
              >
                <Phone className="h-4 w-4 text-slate-400" />
                +234 903 5085 579
              </a>
              <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
                <MapPin className="h-4 w-4 text-slate-400" />
                Abuja, Nigeria
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <a
                href="mailto:support@kfarms.app?subject=KFarms%20Enterprise%20Inquiry"
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:opacity-90"
              >
                Email sales
              </a>
              <a
                href="tel:+2349035085579"
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-100 dark:hover:bg-white/[0.08]"
              >
                Call now
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </SalesModalContext.Provider>
  );
}

export function useSalesModal() {
  const context = React.useContext(SalesModalContext);
  if (!context) {
    throw new Error("useSalesModal must be used within a SalesModalProvider");
  }
  return context;
}

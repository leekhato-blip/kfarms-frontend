import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, ShieldCheck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthThemeSwitcher from "../components/AuthThemeSwitcher";
import AuthWatermark from "../components/AuthWatermark";
import PageWrapper from "../components/PageWrapper";

const TERMS_SECTIONS = [
  {
    title: "Using KFarms",
    body:
      "By creating an account or using KFarms, you agree to use the app responsibly, keep your information accurate, and follow these terms whenever you access the service.",
  },
  {
    title: "Accounts and access",
    body:
      "You are responsible for your login details, the people you invite into your workspace, and the actions taken through your account. Workspace owners should only grant access to trusted team members.",
  },
  {
    title: "Records and data",
    body:
      "You keep ownership of the farm records you enter into KFarms. You are responsible for reviewing entries, keeping contact details up to date, and confirming important records before relying on them for business decisions.",
  },
  {
    title: "Offline use and syncing",
    body:
      "KFarms may let you capture records without internet access. You are still responsible for checking that devices sync successfully once connectivity returns and for resolving any conflicting edits.",
  },
  {
    title: "Billing and promotional offers",
    body:
      "Paid plans, discounts, trials, and promo offers may change over time. Unless we clearly state otherwise, promotional pricing is temporary and regular billing resumes when the offer ends.",
  },
  {
    title: "Acceptable use",
    body:
      "Do not misuse KFarms, attempt to bypass access controls, interfere with the service, upload harmful content, or use the app for unlawful activity. We may suspend access if we need to protect users, data, or the platform.",
  },
  {
    title: "Availability",
    body:
      "We work to keep KFarms reliable, but we do not promise uninterrupted service at all times. Maintenance, provider outages, third-party failures, or connectivity problems can affect access and message delivery.",
  },
  {
    title: "Liability and review",
    body:
      "KFarms supports farm operations, but it does not replace your own judgement, accounting review, husbandry checks, or professional advice. You remain responsible for the decisions you make using the records in the app.",
  },
  {
    title: "Changes to these terms",
    body:
      "We may update these terms as KFarms grows. When we make material changes, we will update the effective date and may notify users through the app or by email.",
  },
];

export default function TermsPage() {
  const effectiveDate = "April 3, 2026";
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <div className="relative min-h-screen overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 text-slate-800 dark:from-[#020617] dark:via-[#050A14] dark:to-[#0F172A] dark:text-darkText">
        <AuthWatermark />
        <AuthThemeSwitcher />

        <Link
          to="/"
          className="absolute left-3 top-3 z-20 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20 sm:left-4 sm:top-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center py-20 sm:py-24">
          <div className="relative w-full rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/12 dark:bg-[#0B1322]/95 dark:shadow-[0_28px_70px_rgba(2,6,23,0.55)] sm:p-8 lg:p-10">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-600 shadow-[0_10px_22px_rgba(15,23,42,0.08)] transition hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20"
              aria-label="Close terms and conditions"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  <FileText className="h-4 w-4 text-accent-primary" />
                  Terms & Conditions
                </div>
                <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-50 sm:text-4xl">
                  Clear terms for using KFarms
                </h1>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                  These terms explain the main rules for using KFarms, managing farm records,
                  inviting team members, and using paid features. Please have legal counsel review
                  them before you rely on them as your final production terms.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-300/30 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-100">
                <div className="inline-flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  Effective date
                </div>
                <div className="mt-1">{effectiveDate}</div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {TERMS_SECTIONS.map((section) => (
                <section
                  key={section.title}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-5 dark:border-white/12 dark:bg-white/[0.08]"
                >
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    {section.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {section.body}
                  </p>
                </section>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white/85 p-5 dark:border-white/12 dark:bg-white/[0.08]">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Contact
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                If you have questions about these terms, billing, or account responsibility, reach
                out to <a className="font-semibold text-accent-primary" href="mailto:support@kfarms.app">support@kfarms.app</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

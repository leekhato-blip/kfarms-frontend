import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, CircleHelp, Sparkles, X } from "lucide-react";

const GUIDE_CARD_STORAGE_PREFIX = "kfarms.farmerGuideCard.";

function readHiddenState(storageKey) {
  if (!storageKey || typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(`${GUIDE_CARD_STORAGE_PREFIX}${storageKey}`) === "hidden";
  } catch {
    return false;
  }
}

function persistHiddenState(storageKey, hidden) {
  if (!storageKey || typeof window === "undefined") return;

  try {
    if (hidden) {
      window.localStorage.setItem(`${GUIDE_CARD_STORAGE_PREFIX}${storageKey}`, "hidden");
      return;
    }
    window.localStorage.removeItem(`${GUIDE_CARD_STORAGE_PREFIX}${storageKey}`);
  } catch {
    return;
  }
}

export default function FarmerGuideCard({
  icon: Icon = Sparkles,
  title = "How to use this page",
  description = "",
  steps = [],
  tip = "",
  className = "",
  storageKey = "",
}) {
  const safeSteps = Array.isArray(steps) ? steps.filter(Boolean).slice(0, 3) : [];
  const [isHidden, setIsHidden] = React.useState(() => readHiddenState(storageKey));
  const prefersReducedMotion = useReducedMotion();
  const MotionDiv = motion.div;
  const MotionButton = motion.button;
  const MotionSection = motion.section;
  const GuideIcon = Icon;
  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.26, ease: [0.22, 1, 0.36, 1] };

  React.useEffect(() => {
    setIsHidden(readHiddenState(storageKey));
  }, [storageKey]);

  function hideCard() {
    setIsHidden(true);
    persistHiddenState(storageKey, true);
  }

  function showCard() {
    setIsHidden(false);
    persistHiddenState(storageKey, false);
  }

  return (
    <MotionDiv layout transition={transition} className={className}>
      <AnimatePresence initial={false} mode="wait">
        {isHidden ? (
          <MotionDiv
            key="guide-collapsed"
            layout
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: -8 }}
            transition={transition}
            className="flex justify-end"
          >
            <MotionButton
              layout
              type="button"
              onClick={showCard}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-sky-200/80 bg-white/80 text-sky-700 shadow-soft transition hover:-translate-y-0.5 hover:bg-white sm:h-10 sm:w-10 dark:border-sky-400/25 dark:bg-[#081427]/80 dark:text-sky-200 dark:hover:bg-[#0c1a31]"
              title={`Show help for ${title}`}
              aria-label={`Show help for ${title}`}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
            >
              <CircleHelp className="h-4.5 w-4.5" aria-hidden="true" />
            </MotionButton>
          </MotionDiv>
        ) : (
          <MotionSection
            key="guide-expanded"
            layout
            initial={prefersReducedMotion ? false : { opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
            transition={transition}
            className="relative overflow-hidden rounded-2xl border border-sky-200/60 bg-white/75 p-4 shadow-soft dark:border-sky-500/20 dark:bg-[#081427]/80"
            aria-label={title}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.10),transparent_40%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.10),transparent_40%)]" />

            <div className="relative">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-200/70 bg-sky-50 text-sky-700 shadow-soft dark:border-sky-400/25 dark:bg-sky-500/10 dark:text-sky-200">
                    <GuideIcon className="h-5 w-5" aria-hidden="true" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-200/80">
                      Start Here
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-slate-900 sm:text-lg dark:text-slate-50">
                      {title}
                    </h2>
                    {description ? (
                      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        {description}
                      </p>
                    ) : null}
                  </div>
                </div>

                <MotionButton
                  layout
                  type="button"
                  onClick={hideCard}
                  className="inline-flex min-h-11 self-end shrink-0 items-center gap-1 rounded-full border border-white/60 bg-white/75 px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-white sm:min-h-0 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                  title={`Hide help for ${title}`}
                  aria-label={`Hide help for ${title}`}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Hide</span>
                </MotionButton>
              </div>

              {safeSteps.length ? (
                <MotionDiv layout className="mt-4 grid gap-3 md:grid-cols-3">
                  {safeSteps.map((step, index) => (
                    <div
                      key={`${title}-${index}`}
                      className="rounded-xl border border-white/50 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex min-h-7 min-w-7 items-center justify-center rounded-full bg-sky-600 px-1.5 text-[11px] font-semibold leading-none tabular-nums text-white sm:min-h-8 sm:min-w-8 sm:px-2 sm:text-xs dark:bg-sky-500/80">
                          {index + 1}
                        </span>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {step}
                        </p>
                      </div>
                    </div>
                  ))}
                </MotionDiv>
              ) : null}

              {tip ? (
                <MotionDiv
                  layout
                  className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-3 text-sm text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-100"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>{tip}</p>
                </MotionDiv>
              ) : null}
            </div>
          </MotionSection>
        )}
      </AnimatePresence>
    </MotionDiv>
  );
}

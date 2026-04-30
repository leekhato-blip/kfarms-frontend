import React from "react";
import { Check, Copy, GitBranch, GitCommitHorizontal, Globe, Info } from "lucide-react";
import { API_BASE_URL } from "../api/endpoints";

function formatBuildTime(value) {
  if (!value) return "Unknown";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export default function BuildInfoBadge() {
  const [expanded, setExpanded] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const commitSha = import.meta.env.VITE_APP_COMMIT_SHA || "unknown";
  const commitFullSha = import.meta.env.VITE_APP_COMMIT_FULL_SHA || commitSha;
  const branch = import.meta.env.VITE_APP_BRANCH || "unknown";
  const buildTime = import.meta.env.VITE_APP_BUILD_TIME || "";
  const buildSource = import.meta.env.VITE_APP_BUILD_SOURCE || "unknown";
  const buildTimeLabel = formatBuildTime(buildTime);
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const apiTarget = API_BASE_URL || `${currentOrigin}/api`;

  React.useEffect(() => {
    if (!copied) return undefined;

    const timeoutId = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const handleCopy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(commitFullSha);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2 sm:bottom-5 sm:right-5">
      {expanded && (
        <section className="pointer-events-auto w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/92 p-4 text-left shadow-[0_22px_48px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/88 dark:shadow-[0_24px_52px_rgba(2,6,23,0.42)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Frontend Build
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Commit {commitSha}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-slate-300 dark:hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="mt-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50/90 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
              <span className="inline-flex items-center gap-2">
                <GitCommitHorizontal className="h-3.5 w-3.5" />
                Full SHA
              </span>
              <code className="truncate font-mono text-[11px] text-slate-800 dark:text-slate-100">
                {commitFullSha}
              </code>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200/70 bg-slate-50/90 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  <GitBranch className="h-3.5 w-3.5" />
                  Branch
                </p>
                <p className="mt-1 font-mono text-[12px] text-slate-800 dark:text-slate-100">
                  {branch}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/70 bg-slate-50/90 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  <Info className="h-3.5 w-3.5" />
                  Source
                </p>
                <p className="mt-1 text-[12px] font-medium text-slate-800 dark:text-slate-100">
                  {buildSource}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/70 bg-slate-50/90 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Built
              </p>
              <p className="mt-1 text-[12px] font-medium text-slate-800 dark:text-slate-100">
                {buildTimeLabel}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/70 bg-slate-50/90 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                <Globe className="h-3.5 w-3.5" />
                API Target
              </p>
              <code className="mt-1 block break-all font-mono text-[11px] text-slate-800 dark:text-slate-100">
                {apiTarget}
              </code>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:text-white"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied full SHA" : "Copy full SHA"}
          </button>
        </section>
      )}

      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/88 px-3 py-2 text-xs font-semibold text-slate-700 shadow-[0_16px_34px_rgba(15,23,42,0.15)] backdrop-blur-xl transition hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-slate-950/82 dark:text-slate-100 dark:shadow-[0_18px_36px_rgba(2,6,23,0.4)]"
        title={`Frontend build ${commitFullSha}`}
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600 dark:bg-emerald-400/12 dark:text-emerald-300">
          <GitCommitHorizontal className="h-3.5 w-3.5" />
        </span>
        <span>Build</span>
        <code className="font-mono text-[11px]">{commitSha}</code>
      </button>
    </div>
  );
}

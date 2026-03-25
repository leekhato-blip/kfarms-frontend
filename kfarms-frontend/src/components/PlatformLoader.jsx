import React from "react";
import { createPortal } from "react-dom";
import rootsLogo from "../assets/roots-logo.png";

const THEME_KEY = "kf_theme";

function getPreferredTheme() {
  if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
    return "dark";
  }

  if (typeof window === "undefined") return "dark";

  const savedTheme = window.localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

export default function PlatformLoader({ label = "Loading ROOTS platform..." }) {
  const [theme, setTheme] = React.useState(getPreferredTheme);

  React.useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return undefined;

    const syncTheme = () => setTheme(getPreferredTheme());
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    const mediaQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;

    mediaQuery?.addEventListener?.("change", syncTheme);

    window.addEventListener("storage", syncTheme);

    return () => {
      observer.disconnect();
      mediaQuery?.removeEventListener?.("change", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  React.useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const isDark = theme === "dark";

  const content = (
    <div
      className={`${isDark ? "dark " : ""}fixed inset-0 z-[9990] h-screen w-screen overflow-hidden`}
      role="status"
      aria-live="polite"
    >
      <div
        className="atlas-theme atlas-root-network flex h-full min-h-screen w-full items-center justify-center px-4"
        style={{
          colorScheme: isDark ? "dark" : "light",
          backgroundColor: isDark ? "#010208" : "#eef2ff",
        }}
      >
        <style>{`
          @keyframes platform-loader-orbit {
            0% { transform: rotate(0deg) translateY(-48px) rotate(0deg); opacity: 0.42; }
            50% { opacity: 1; }
            100% { transform: rotate(360deg) translateY(-48px) rotate(-360deg); opacity: 0.42; }
          }
          @keyframes platform-loader-pulse {
            0%, 100% { transform: scaleY(0.45); opacity: 0.45; }
            50% { transform: scaleY(1); opacity: 1; }
          }
          @keyframes platform-loader-glow {
            0%, 100% { opacity: 0.2; transform: scale(0.96); }
            50% { opacity: 0.55; transform: scale(1.03); }
          }
        `}</style>

        <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-[color:var(--atlas-border-strong)] bg-[color:var(--atlas-surface)]/94 px-7 py-8 shadow-[0_28px_90px_rgba(2,6,23,0.46)] backdrop-blur-2xl sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/60 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.14),transparent_46%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.12),transparent_42%)]" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center rounded-full border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/84 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--atlas-muted)]">
              ROOTS Platform
            </div>

            <div className="relative mt-7 flex h-32 w-32 items-center justify-center">
              <div className="absolute inset-0 rounded-[2rem] border border-violet-300/25 bg-violet-500/8" />
              <div
                className="absolute inset-2 rounded-[1.75rem] bg-[radial-gradient(circle,rgba(139,92,246,0.24),transparent_68%)]"
                style={{ animation: "platform-loader-glow 2.2s ease-in-out infinite" }}
              />
              <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-[1.7rem] border border-[color:var(--atlas-border)] bg-[color:var(--atlas-surface-soft)]/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <img src={rootsLogo} alt="ROOTS" className="h-16 w-16 object-contain" />
              </div>

              <span
                className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.85)]"
                style={{ animation: "platform-loader-orbit 4s linear infinite" }}
              />
              <span
                className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-300 shadow-[0_0_14px_rgba(167,139,250,0.78)]"
                style={{ animation: "platform-loader-orbit 3.1s linear infinite reverse" }}
              />
            </div>

            <div className="mt-7 text-3xl font-semibold tracking-[0.18em] text-[var(--atlas-text-strong)]">
              ROOTS
            </div>
            <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--atlas-muted)]">
              Platform Console
            </div>
            <div className="mt-4 max-w-xs text-sm leading-6 text-[var(--atlas-muted)]">
              {label}
            </div>

            <div className="mt-7 flex h-10 items-end gap-2">
              {["0ms", "160ms", "320ms", "480ms"].map((delay, index) => (
                <span
                  key={`platform-loader-bar-${index}`}
                  className="w-2.5 rounded-full bg-gradient-to-t from-blue-500 via-violet-400 to-cyan-300"
                  style={{
                    height: `${20 + index * 4}px`,
                    animation: `platform-loader-pulse 1.2s ease-in-out ${delay} infinite`,
                    transformOrigin: "bottom",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return content;
  }

  return createPortal(content, document.body);
}

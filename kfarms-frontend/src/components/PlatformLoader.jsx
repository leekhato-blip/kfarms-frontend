import React from "react";
import { createPortal } from "react-dom";
import rootsLogo from "../assets/roots-logo-trimmed.png";

const THEME_KEY = "kf_theme";

function getPreferredTheme() {
  if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
    return "dark";
  }

  if (typeof window === "undefined") return "light";

  const savedTheme = window.localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

const PALETTES = {
  light: {
    background:
      "radial-gradient(640px 280px at 50% 18%, rgba(59, 130, 246, 0.1), transparent 62%), radial-gradient(420px 220px at 50% 78%, rgba(16, 185, 129, 0.08), transparent 58%), linear-gradient(180deg, #f4f7fd 0%, #f8fbff 56%, #ffffff 100%)",
    surface: "rgba(255, 255, 255, 0.76)",
    surfaceBorder: "rgba(148, 163, 184, 0.2)",
    frame: "rgba(255, 255, 255, 0.72)",
    frameBorder: "rgba(148, 163, 184, 0.18)",
    frameGlow: "rgba(96, 165, 250, 0.16)",
    overline: "rgba(79, 70, 229, 0.72)",
    title: "#0f172a",
    text: "rgba(71, 85, 105, 0.82)",
    line: "rgba(203, 213, 225, 0.8)",
    signal: "linear-gradient(90deg, #4f46e5 0%, #2563eb 60%, #06b6d4 100%)",
    badge: "rgba(59, 130, 246, 0.1)",
    badgeBorder: "rgba(59, 130, 246, 0.18)",
    badgeText: "#1d4ed8",
  },
  dark: {
    background:
      "radial-gradient(640px 280px at 50% 18%, rgba(96, 165, 250, 0.12), transparent 62%), radial-gradient(420px 220px at 50% 78%, rgba(45, 212, 191, 0.08), transparent 58%), linear-gradient(180deg, #040813 0%, #07111d 56%, #0b1625 100%)",
    surface: "rgba(8, 15, 29, 0.74)",
    surfaceBorder: "rgba(100, 116, 139, 0.2)",
    frame: "rgba(15, 23, 42, 0.72)",
    frameBorder: "rgba(100, 116, 139, 0.18)",
    frameGlow: "rgba(96, 165, 250, 0.22)",
    overline: "rgba(147, 197, 253, 0.76)",
    title: "#f8fafc",
    text: "rgba(203, 213, 225, 0.8)",
    line: "rgba(30, 41, 59, 0.9)",
    signal: "linear-gradient(90deg, #818cf8 0%, #60a5fa 60%, #22d3ee 100%)",
    badge: "rgba(59, 130, 246, 0.12)",
    badgeBorder: "rgba(96, 165, 250, 0.22)",
    badgeText: "#dbeafe",
  },
};

export default function PlatformLoader({
  label = "Loading ROOTS platform...",
  portal = true,
  lockBody = true,
}) {
  const [theme, setTheme] = React.useState(getPreferredTheme);
  const isDark = theme === "dark";
  const palette = isDark ? PALETTES.dark : PALETTES.light;

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
    if (!lockBody || typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [lockBody]);

  const content = (
    <div
      className={`${isDark ? "dark " : ""}fixed inset-0 z-[9990] overflow-hidden`}
      role="status"
      aria-live="polite"
    >
      <div
        className="flex min-h-screen items-center justify-center px-6 py-10"
        style={{
          background: palette.background,
          colorScheme: isDark ? "dark" : "light",
        }}
      >
        <style>{`
          @keyframes platform-loader-signal {
            0% { transform: translateX(-120%); }
            100% { transform: translateX(285%); }
          }
          @keyframes platform-loader-breathe {
            0%, 100% { transform: scale(0.98); opacity: 0.72; }
            50% { transform: scale(1.02); opacity: 1; }
          }
          @keyframes platform-loader-pulse {
            0%, 100% { transform: scale(0.94); opacity: 0.55; }
            50% { transform: scale(1.06); opacity: 0.9; }
          }
        `}</style>

        <div className="w-full max-w-[19rem]">
          <div
            className="relative overflow-hidden rounded-[1.8rem] border px-7 py-7 text-center backdrop-blur-xl sm:px-8 sm:py-8"
            style={{
              background: palette.surface,
              borderColor: palette.surfaceBorder,
              boxShadow: isDark
                ? "0 18px 50px rgba(2, 6, 23, 0.35)"
                : "0 18px 48px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div
              className="pointer-events-none absolute left-1/2 top-[5.35rem] h-[6.25rem] w-[6.25rem] -translate-x-1/2 rounded-full"
              style={{
                background: palette.frameGlow,
                filter: "blur(18px)",
                animation: "platform-loader-pulse 2.6s ease-in-out infinite",
              }}
            />

            <div className="relative z-10">
              <span
                className="inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{
                  background: palette.badge,
                  borderColor: palette.badgeBorder,
                  color: palette.badgeText,
                }}
              >
                ROOTS Platform
              </span>

              <div
                className="mx-auto mt-5 flex h-[5rem] w-[5rem] items-center justify-center rounded-[1.6rem] border"
                style={{
                  borderColor: palette.frameBorder,
                  background: palette.frame,
                  boxShadow: `0 0 0 1px ${palette.frameBorder}, 0 18px 40px ${palette.frameGlow}`,
                  animation: "platform-loader-breathe 2.6s ease-in-out infinite",
                }}
              >
                <div
                  className="flex h-[3.8rem] w-[3.8rem] items-center justify-center rounded-[1.25rem] border"
                  style={{
                    borderColor: palette.frameBorder,
                    background: palette.surface,
                  }}
                >
                  <img
                    src={rootsLogo}
                    alt="ROOTS"
                    className="h-10 w-auto object-contain"
                  />
                </div>
              </div>

              <div
                className="mx-auto mt-5 h-[2px] w-12 rounded-full"
                style={{ background: palette.overline }}
              />

              <div
                className="mt-4 font-header text-[1.38rem] font-semibold tracking-[0.16em] sm:text-[1.55rem]"
                style={{ color: palette.title }}
              >
                ROOTS
              </div>

              <p
                className="mx-auto mt-2 max-w-[14rem] text-sm leading-6"
                style={{ color: palette.text }}
              >
                {label}
              </p>

              <div
                className="mx-auto mt-6 h-1.5 w-24 overflow-hidden rounded-full"
                style={{ background: palette.line }}
              >
                <span
                  className="block h-full w-10 rounded-full"
                  style={{
                    background: palette.signal,
                    animation: "platform-loader-signal 1.35s ease-in-out infinite",
                  }}
                />
              </div>

              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: palette.overline }} />
                <span
                  className="text-[11px] font-medium tracking-[0.08em]"
                  style={{ color: palette.text }}
                >
                  Preparing your platform workspace
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined" || !portal) {
    return content;
  }

  return createPortal(content, document.body);
}

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

export default function PlatformLoader({
  label = "Opening dashboards, apps, and live signals...",
  portal = true,
  lockBody = true,
}) {
  const [theme, setTheme] = React.useState(getPreferredTheme);
  const isDark = theme === "dark";
  const background = isDark
    ? "radial-gradient(1120px 560px at 15% 0%, rgba(37, 99, 235, 0.14), transparent 60%), radial-gradient(860px 520px at 85% 18%, rgba(16, 185, 129, 0.12), transparent 56%), rgba(4, 10, 24, 0.94)"
    : "radial-gradient(980px 500px at 12% 0%, rgba(37, 99, 235, 0.12), transparent 58%), radial-gradient(760px 460px at 88% 18%, rgba(16, 185, 129, 0.12), transparent 54%), rgba(248, 250, 252, 0.94)";
  const cardSurface = isDark ? "rgba(15, 23, 42, 0.8)" : "rgba(255, 255, 255, 0.9)";
  const cardBorder = isDark ? "rgba(148, 163, 184, 0.22)" : "rgba(148, 163, 184, 0.22)";
  const cardShadow = isDark
    ? "0 22px 60px rgba(2, 6, 23, 0.4)"
    : "0 22px 56px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.82)";

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
      className={`${isDark ? "dark " : ""}fixed inset-0 z-[9990]`}
      role="status"
      aria-live="polite"
    >
      <div
        className="flex min-h-screen items-center justify-center px-6 py-10"
        style={{
          background,
          colorScheme: isDark ? "dark" : "light",
          backdropFilter: "blur(6px)",
        }}
      >
        <style>{`
          @keyframes roots-loader-spin {
            to { transform: rotate(360deg); }
          }

          @keyframes roots-loader-pulse {
            0%, 100% { transform: scale(1); opacity: 0.92; }
            50% { transform: scale(1.05); opacity: 1; }
          }
        `}</style>

        <div
          className="flex w-full max-w-[22rem] items-center gap-[18px] rounded-[18px] border px-[22px] py-[18px] backdrop-blur-xl"
          style={{
            background: cardSurface,
            borderColor: cardBorder,
            boxShadow: cardShadow,
          }}
        >
          <div
            className="relative grid h-[52px] w-[52px] shrink-0 place-items-center overflow-hidden rounded-[14px]"
            style={{
              background: isDark
                ? "linear-gradient(140deg, rgba(37,99,235,0.22) 0%, rgba(16,185,129,0.2) 100%)"
                : "linear-gradient(140deg, rgba(37,99,235,0.14) 0%, rgba(16,185,129,0.14) 100%)",
            }}
          >
            <div
              className="absolute inset-[6px] rounded-[12px]"
              style={{
                background: isDark ? "rgba(7, 12, 24, 0.78)" : "rgba(255, 255, 255, 0.88)",
                animation: "roots-loader-pulse 2.2s ease-in-out infinite",
              }}
            />
            <span
              className="absolute h-6 w-6 rounded-full"
              style={{
                border: isDark
                  ? "3px solid rgba(255, 255, 255, 0.26)"
                  : "3px solid rgba(15, 23, 42, 0.14)",
                borderTopColor: isDark ? "#bfdbfe" : "#2563eb",
                animation: "roots-loader-spin 0.95s linear infinite",
              }}
            />
            <img
              src={rootsLogo}
              alt="ROOTS"
              className="relative z-[1] h-7 w-auto object-contain"
            />
          </div>

          <div className="min-w-0">
            <div
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: isDark ? "rgba(110, 231, 183, 0.92)" : "#047857" }}
            >
              Platform loader
            </div>
            <div
              className="mt-1 font-header text-[17px] font-semibold"
              style={{ color: isDark ? "#e2e8f0" : "#0f172a" }}
            >
              ROOTS
            </div>
            <div
              className="mt-1 text-xs"
              style={{ color: isDark ? "rgba(226, 232, 240, 0.72)" : "rgba(51, 65, 85, 0.78)" }}
            >
              {label}
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

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
  label = "Loading ROOTS platform...",
  portal = true,
  lockBody = true,
}) {
  const [theme, setTheme] = React.useState(getPreferredTheme);
  const isDark = theme === "dark";
  const background = isDark
    ? "radial-gradient(980px 520px at 18% 0%, rgba(37, 99, 235, 0.14), transparent 58%), radial-gradient(760px 420px at 84% 18%, rgba(16, 185, 129, 0.14), transparent 54%), rgba(4, 10, 24, 0.94)"
    : "radial-gradient(920px 480px at 12% 0%, rgba(37, 99, 235, 0.12), transparent 58%), radial-gradient(760px 420px at 88% 18%, rgba(16, 185, 129, 0.1), transparent 54%), rgba(248, 250, 252, 0.94)";
  const cardSurface = isDark ? "rgba(10, 18, 35, 0.82)" : "rgba(255, 255, 255, 0.92)";
  const cardBorder = isDark ? "rgba(100, 116, 139, 0.2)" : "rgba(148, 163, 184, 0.2)";
  const cardShadow = isDark
    ? "0 22px 56px rgba(2, 6, 23, 0.38)"
    : "0 22px 56px rgba(15, 23, 42, 0.12)";

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
          backdropFilter: "blur(8px)",
        }}
      >
        <style>{`
          @keyframes roots-loader-spin {
            to { transform: rotate(360deg); }
          }

          @keyframes roots-loader-slide {
            0% { transform: translateX(-135%); }
            100% { transform: translateX(235%); }
          }

          @keyframes roots-loader-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-2px); }
          }
        `}</style>

        <div
          className="w-full max-w-[20rem] rounded-[1.55rem] border p-5 backdrop-blur-xl"
          style={{
            background: cardSurface,
            borderColor: cardBorder,
            boxShadow: cardShadow,
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[1.1rem]"
              style={{
                background: isDark
                  ? "linear-gradient(145deg, rgba(37,99,235,0.24), rgba(16,185,129,0.2))"
                  : "linear-gradient(145deg, rgba(37,99,235,0.14), rgba(16,185,129,0.14))",
              }}
            >
              <div
                className="absolute inset-[7px] rounded-[0.9rem] border"
                style={{
                  borderColor: isDark ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.18)",
                  background: isDark ? "rgba(7, 12, 24, 0.84)" : "rgba(255,255,255,0.9)",
                  animation: "roots-loader-float 2.4s ease-in-out infinite",
                }}
              />
              <span
                className="absolute h-8 w-8 rounded-full"
                style={{
                  border: isDark
                    ? "2px solid rgba(255,255,255,0.24)"
                    : "2px solid rgba(15,23,42,0.12)",
                  borderTopColor: isDark ? "#93c5fd" : "#2563eb",
                  animation: "roots-loader-spin 1.1s linear infinite",
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
                ROOTS Platform
              </div>
              <div
                className="mt-1 font-header text-[1.05rem] font-semibold"
                style={{ color: isDark ? "#e2e8f0" : "#0f172a" }}
              >
                ROOTS
              </div>
              <div
                className="mt-1 text-xs leading-5"
                style={{ color: isDark ? "rgba(226, 232, 240, 0.72)" : "rgba(51, 65, 85, 0.78)" }}
              >
                {label}
              </div>
            </div>
          </div>

          <div
            className="mt-4 h-1.5 overflow-hidden rounded-full"
            style={{
              background: isDark ? "rgba(30, 41, 59, 0.9)" : "rgba(226, 232, 240, 0.96)",
            }}
          >
            <span
              className="block h-full w-16 rounded-full"
              style={{
                background: "linear-gradient(90deg, #16a34a 0%, #2563eb 52%, #38bdf8 100%)",
                animation: "roots-loader-slide 1.25s ease-in-out infinite",
              }}
            />
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
